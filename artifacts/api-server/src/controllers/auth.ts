import { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq, and, or } from "drizzle-orm";
import { z } from "zod/v4";
import { signToken } from "../lib/jwt";

const appleJwksClient = jwksClient({ jwksUri: "https://appleid.apple.com/auth/keys", cache: true, cacheMaxAge: 600_000, rateLimit: true });

async function verifyGoogleToken(accessToken: string): Promise<{ id: string; email: string; name: string } | null> {
  try { const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`); if (!res.ok) return null; const data = await res.json() as Record<string, string>; if (!data.email_verified || data.email_verified === "false") return null; return { id: data.sub, email: data.email, name: data.name ?? data.email }; } catch { return null; }
}
async function verifyFacebookToken(accessToken: string): Promise<{ id: string; email: string; name: string } | null> {
  try { const res = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`); if (!res.ok) return null; const data = await res.json() as Record<string, string>; if (!data.id) return null; return { id: data.id, email: data.email ?? "", name: data.name ?? "" }; } catch { return null; }
}
async function verifyAppleToken(identityToken: string): Promise<{ id: string; email: string; name: string } | null> {
  try { const decoded = jwt.decode(identityToken, { complete: true }); if (!decoded || typeof decoded === "string" || !decoded.header.kid) return null; const signingKey = await appleJwksClient.getSigningKey(decoded.header.kid); const publicKey = signingKey.getPublicKey(); const verified = jwt.verify(identityToken, publicKey, { algorithms: ["RS256"], issuer: "https://appleid.apple.com" }) as jwt.JwtPayload; return { id: verified.sub ?? "", email: verified.email ?? "", name: (verified as any).name ?? "" }; } catch { return null; }
}

const socialSchema = z.object({ provider: z.enum(["google", "facebook", "apple"]), token: z.string().min(1), role: z.enum(["client", "lawyer"]).optional().default("client"), displayName: z.string().optional(), storedEmail: z.string().optional() });

export async function socialAuth(req: Request, res: Response) {
  const parsed = socialSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "validation_error", issues: parsed.error.issues });
  const { provider, token, role, displayName, storedEmail } = parsed.data;
  try {
    let providerUser: { id: string; email: string; name: string } | null = null;
    if (provider === "google") providerUser = await verifyGoogleToken(token);
    else if (provider === "facebook") providerUser = await verifyFacebookToken(token);
    else { providerUser = await verifyAppleToken(token); if (providerUser && !providerUser.email && storedEmail) providerUser.email = storedEmail; if (providerUser && !providerUser.name && displayName) providerUser.name = displayName; }
    if (!providerUser || !providerUser.id) return res.status(401).json({ ok: false, error: "invalid_provider_token" });
    if (!providerUser.email) return res.status(400).json({ ok: false, error: "email_required", message: "البريد الإلكتروني مطلوب. يرجى إعادة المحاولة مع السماح بمشاركة بريدك الإلكتروني." });
    let dbUser = await findUser(provider, providerUser.id, providerUser.email);
    if (!dbUser) {
      const newId = `${provider}-${providerUser.id.substring(0, 12)}-${Date.now()}`;
      await db.insert(usersTable).values({ id: newId, name: providerUser.name || providerUser.email.split("@")[0], email: providerUser.email, authProvider: provider, providerId: providerUser.id, role, createdAt: new Date(), updatedAt: new Date() });
      dbUser = await findUser(provider, providerUser.id, providerUser.email);
    } else {
      if (dbUser.deletedAt && dbUser.deletionScheduledAt) {
        const now = new Date();
        if (dbUser.deletionScheduledAt > now) { await db.update(usersTable).set({ deletedAt: null, deletionScheduledAt: null, accountStatus: "active", updatedAt: now }).where(eq(usersTable.id, dbUser.id)); dbUser = await findUser(provider, providerUser.id, providerUser.email); req.log.info({ userId: dbUser?.id }, "soft-deleted account reactivated on login"); }
        else return res.status(403).json({ ok: false, error: "account_permanently_deleted", message: "عذراً، انتهت مدة استعادة الحساب (30 يوماً). تم حذف الحساب نهائياً." });
      }
      if (dbUser && dbUser.accountStatus === "terminated" && !dbUser.deletedAt) return res.status(403).json({ ok: false, error: "account_terminated", message: "عذراً، تم إيقاف هذا الحساب. يرجى التواصل مع الدعم." });
      if (dbUser && (dbUser.authProvider === "local" || !dbUser.providerId)) await db.update(usersTable).set({ authProvider: provider, providerId: providerUser.id, updatedAt: new Date() }).where(eq(usersTable.id, dbUser.id));
    }
    if (!dbUser) return res.status(500).json({ ok: false, error: "user_creation_failed" });
    if (dbUser.role !== "admin" && dbUser.role !== role) return res.status(403).json({ ok: false, error: "role_mismatch", message: dbUser.role === "lawyer" ? "عذراً، هذا الحساب مسجل كمحامٍ. يرجى الدخول من بوابة المحامين." : "عذراً، هذا الحساب مسجل كعميل. يرجى الدخول من بوابة العملاء." });
    const jwtToken = signToken({ userId: dbUser.id, email: dbUser.email, role: (dbUser.role ?? "client") as "client" | "lawyer" | "admin", provider });
    return res.json({ ok: true, jwt: jwtToken, user: { id: dbUser.id, name: dbUser.name, email: dbUser.email, role: dbUser.role, country: dbUser.country, authProvider: dbUser.authProvider, deletionRejectionNote: dbUser.deletionRejectionNote ?? null, createdAt: dbUser.createdAt } });
  } catch (err) { req.log.error(err, "socialAuth failed"); return res.status(500).json({ ok: false, error: "internal_error" }); }
}

async function findUser(provider: string, providerId: string, email: string) {
  const rows = await db.select().from(usersTable).where(or(and(eq(usersTable.authProvider, provider as any), eq(usersTable.providerId, providerId)), eq(usersTable.email, email))).limit(1);
  return rows[0] ?? null;
}

const localAuthSchema = z.object({ email: z.string().email(), password: z.string().min(6).max(128), name: z.string().min(2).max(100).optional(), phone: z.string().max(20).optional(), country: z.enum(["qatar", "jordan"]).optional(), role: z.enum(["client", "lawyer"]).optional().default("client"), specialization: z.string().max(200).optional(), bio: z.string().max(2000).optional(), hourlyRate: z.number().positive().optional() });

export async function localAuth(req: Request, res: Response) {
  const parsed = localAuthSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "validation_error", issues: parsed.error.issues });
  const { email, password, name, phone, country, role, specialization, bio, hourlyRate } = parsed.data;
  const normalEmail = email.trim().toLowerCase();
  const DUMMY_HASH = "$2b$10$dummyhashfortimingsafetyXXXXXXXXXXXXXXXXX";
  try {
    const rows = await db.select().from(usersTable).where(eq(usersTable.email, normalEmail)).limit(1);
    const existing = rows[0] ?? null;
    if (existing) {
      if (existing.accountStatus === "terminated") return res.status(403).json({ ok: false, error: "account_terminated", message: "تم إيقاف هذا الحساب." });
      if (existing.passwordHash) {
        const match = await bcrypt.compare(password, existing.passwordHash);
        if (!match) { await bcrypt.compare(password, DUMMY_HASH).catch(() => {}); return res.status(401).json({ ok: false, error: "invalid_credentials", message: "كلمة المرور غير صحيحة" }); }
      } else {
        req.log.warn({ userId: existing.id }, "local-auth: rejected password-link attempt for social-only account");
        return res.status(403).json({ ok: false, error: "social_account_only", message: "هذا الحساب مرتبط بتسجيل دخول اجتماعي (Google/Apple). يرجى استخدام نفس طريقة التسجيل." });
      }

      // The selected portal is part of the authentication boundary. Never issue
      // a JWT for a valid password if the account belongs to the other portal.
      if (existing.role !== "admin" && existing.role !== role) {
        return res.status(403).json({
          ok: false,
          error: "role_mismatch",
          message: existing.role === "lawyer"
            ? "عذراً، هذا الحساب مسجل كمحامٍ. يرجى الدخول من بوابة المحامين."
            : "عذراً، هذا الحساب مسجل كعميل. يرجى الدخول من بوابة العملاء.",
        });
      }

      const jwtToken = signToken({ userId: existing.id, email: existing.email, role: (existing.role ?? "client") as "client" | "lawyer" | "admin", provider: "local" });
      return res.json({ ok: true, jwt: jwtToken, userId: existing.id, isNew: false, user: { id: existing.id, name: existing.name, email: existing.email, role: existing.role, phone: existing.phone, country: existing.country, specialization: existing.specialization, bio: existing.bio, hourlyRate: existing.hourlyRate ? parseFloat(existing.hourlyRate) : null } });
    }
    if (!name?.trim()) return res.status(400).json({ ok: false, error: "name_required", message: "الاسم مطلوب للتسجيل" });
    const passwordHash = await bcrypt.hash(password, 10);
    const newId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    await db.insert(usersTable).values({ id: newId, name: name.trim(), email: normalEmail, passwordHash, phone: phone ?? null, country: country ?? null, role, authProvider: "local", accountStatus: "active", ...(role === "lawyer" ? { specialization: specialization ?? null, bio: bio ?? null, hourlyRate: hourlyRate != null ? String(hourlyRate) : null } : {}), createdAt: new Date(), updatedAt: new Date() });
    const jwtToken = signToken({ userId: newId, email: normalEmail, role, provider: "local" });
    return res.status(201).json({ ok: true, jwt: jwtToken, userId: newId, isNew: true, user: { id: newId, name: name.trim(), email: normalEmail, role, phone: phone ?? null, country: country ?? null, specialization: specialization ?? null, bio: bio ?? null, hourlyRate: hourlyRate ?? null } });
  } catch (err) { req.log.error(err, "localAuth failed"); return res.status(500).json({ ok: false, error: "internal_error" }); }
}
