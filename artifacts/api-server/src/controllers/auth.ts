import { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import { z } from "zod/v4";
import { signToken } from "../lib/jwt";

const appleJwksClient = jwksClient({
  jwksUri: "https://appleid.apple.com/auth/keys",
  cache: true,
  cacheMaxAge: 600_000,
  rateLimit: true,
});

// ── Provider token verifiers ─────────────────────────────────────────────────

async function verifyGoogleToken(
  accessToken: string,
): Promise<{ id: string; email: string; name: string } | null> {
  try {
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
    );
    if (!res.ok) return null;
    const data = await res.json() as Record<string, string>;
    if (!data.email_verified || data.email_verified === "false") return null;
    return { id: data.sub, email: data.email, name: data.name ?? data.email };
  } catch {
    return null;
  }
}

async function verifyFacebookToken(
  accessToken: string,
): Promise<{ id: string; email: string; name: string } | null> {
  try {
    const res = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`,
    );
    if (!res.ok) return null;
    const data = await res.json() as Record<string, string>;
    if (!data.id) return null;
    return { id: data.id, email: data.email ?? "", name: data.name ?? "" };
  } catch {
    return null;
  }
}

async function verifyAppleToken(
  identityToken: string,
): Promise<{ id: string; email: string; name: string } | null> {
  try {
    const decoded = jwt.decode(identityToken, { complete: true });
    if (!decoded || typeof decoded === "string" || !decoded.header.kid) return null;

    const signingKey = await appleJwksClient.getSigningKey(decoded.header.kid);
    const publicKey = signingKey.getPublicKey();

    const verified = jwt.verify(identityToken, publicKey, {
      algorithms: ["RS256"],
      issuer: "https://appleid.apple.com",
    }) as jwt.JwtPayload;

    return {
      id: verified.sub ?? "",
      email: verified.email ?? "",
      name: (verified as any).name ?? "",
    };
  } catch {
    return null;
  }
}

// ── Main social auth handler ─────────────────────────────────────────────────

const socialSchema = z.object({
  provider: z.enum(["google", "facebook", "apple"]),
  token: z.string().min(1),
  role: z.enum(["client", "lawyer"]).optional().default("client"),
  displayName: z.string().optional(),
  storedEmail: z.string().optional(),
});

export async function socialAuth(req: Request, res: Response) {
  const parsed = socialSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "validation_error", issues: parsed.error.issues });
  }

  const { provider, token, role, displayName, storedEmail } = parsed.data;

  try {
    // 1. Verify token with provider
    let providerUser: { id: string; email: string; name: string } | null = null;

    if (provider === "google") {
      providerUser = await verifyGoogleToken(token);
    } else if (provider === "facebook") {
      providerUser = await verifyFacebookToken(token);
    } else if (provider === "apple") {
      providerUser = await verifyAppleToken(token);
      // Apple only gives email on first login — use stored email for subsequent logins
      if (providerUser && !providerUser.email && storedEmail) {
        providerUser.email = storedEmail;
      }
      if (providerUser && !providerUser.name && displayName) {
        providerUser.name = displayName;
      }
    }

    if (!providerUser || !providerUser.id) {
      return res.status(401).json({ ok: false, error: "invalid_provider_token" });
    }

    // Email is required — for Apple it may be missing on re-login
    if (!providerUser.email) {
      return res.status(400).json({
        ok: false,
        error: "email_required",
        message: "البريد الإلكتروني مطلوب. يرجى إعادة المحاولة مع السماح بمشاركة بريدك الإلكتروني.",
      });
    }

    // 2. Find or create user in DB
    let dbUser = await findUser(provider, providerUser.id, providerUser.email);

    if (!dbUser) {
      const newId = `${provider}-${providerUser.id.substring(0, 12)}-${Date.now()}`;
      await db.insert(usersTable).values({
        id: newId,
        name: providerUser.name || providerUser.email.split("@")[0],
        email: providerUser.email,
        authProvider: provider,
        providerId: providerUser.id,
        role,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      dbUser = await findUser(provider, providerUser.id, providerUser.email);
    } else {
      // Soft-delete reactivation: client logged back in within 30-day window
      if (dbUser.deletedAt && dbUser.deletionScheduledAt) {
        const now = new Date();
        if (dbUser.deletionScheduledAt > now) {
          // Reactivate — clear soft-delete fields
          await db
            .update(usersTable)
            .set({
              deletedAt: null,
              deletionScheduledAt: null,
              accountStatus: "active",
              updatedAt: now,
            })
            .where(eq(usersTable.id, dbUser.id));
          dbUser = await findUser(provider, providerUser.id, providerUser.email);
          req.log.info({ userId: dbUser?.id }, "soft-deleted account reactivated on login");
        } else {
          // 30-day window has passed — account permanently deleted
          return res.status(403).json({
            ok: false,
            error: "account_permanently_deleted",
            message: "عذراً، انتهت مدة استعادة الحساب (30 يوماً). تم حذف الحساب نهائياً.",
          });
        }
      }

      // Block login if account is hard-terminated (non-soft-delete termination)
      if (dbUser && dbUser.accountStatus === "terminated" && !dbUser.deletedAt) {
        return res.status(403).json({
          ok: false,
          error: "account_terminated",
          message: "عذراً، تم إيقاف هذا الحساب. يرجى التواصل مع الدعم.",
        });
      }

      // Update provider info if this is a new social link to an existing email account
      if (dbUser && (dbUser.authProvider === "local" || !dbUser.providerId)) {
        await db
          .update(usersTable)
          .set({ authProvider: provider, providerId: providerUser.id, updatedAt: new Date() })
          .where(eq(usersTable.id, dbUser.id));
      }
    }

    if (!dbUser) {
      return res.status(500).json({ ok: false, error: "user_creation_failed" });
    }

    // ── RBAC: block cross-portal login ────────────────────────────────────────
    if (dbUser.role !== "admin" && dbUser.role !== role) {
      if (dbUser.role === "lawyer" && role === "client") {
        return res.status(403).json({
          ok: false,
          error: "role_mismatch",
          message: "عذراً، هذا الحساب مسجل كمحامٍ. يرجى الدخول من بوابة المحامين.",
        });
      }
      if (dbUser.role === "client" && role === "lawyer") {
        return res.status(403).json({
          ok: false,
          error: "role_mismatch",
          message: "عذراً، هذا الحساب مسجل كعميل. يرجى الدخول من بوابة العملاء.",
        });
      }
    }

    // 3. Issue JWT
    const jwtToken = signToken({
      userId: dbUser.id,
      email: dbUser.email,
      role: (dbUser.role ?? "client") as "client" | "lawyer" | "admin",
      provider,
    });

    req.log.info({ userId: dbUser.id, provider, email: dbUser.email }, "social auth success");

    return res.json({
      ok: true,
      jwt: jwtToken,
      user: {
        id: dbUser.id,
        name: dbUser.name,
        email: dbUser.email,
        role: dbUser.role,
        country: dbUser.country,
        authProvider: dbUser.authProvider,
        deletionRejectionNote: dbUser.deletionRejectionNote ?? null,
        createdAt: dbUser.createdAt,
      },
    });
  } catch (err) {
    req.log.error(err, "socialAuth failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

async function findUser(provider: string, providerId: string, email: string) {
  const rows = await db
    .select()
    .from(usersTable)
    .where(
      or(
        and(eq(usersTable.authProvider, provider as any), eq(usersTable.providerId, providerId)),
        eq(usersTable.email, email),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
