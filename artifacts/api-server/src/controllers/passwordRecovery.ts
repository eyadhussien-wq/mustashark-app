import { type Request, type Response } from "express";
import { randomInt, createHash } from "node:crypto";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq, and, lt, sql } from "drizzle-orm";
import { z } from "zod/v4";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const OTP_LENGTH = 6;

type RecoveryChannel = "email" | "whatsapp";

const requestSchema = z.object({
  email: z.string().email(),
  channel: z.enum(["email", "whatsapp"]).default("email"),
});

const verifySchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(6).max(128),
});

function hashOtp(otp: string) {
  return createHash("sha256").update(otp).digest("hex");
}

function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local.slice(0, 2)}***@${domain}`;
}

function maskPhone(phone: string) {
  const clean = phone.replace(/\s+/g, "");
  return clean.length > 4 ? `${clean.slice(0, 3)}***${clean.slice(-2)}` : "***";
}

async function deliverOtp(params: {
  channel: RecoveryChannel;
  email: string;
  phone?: string | null;
  otp: string;
}) {
  const { channel, email, phone, otp } = params;

  if (channel === "email") {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.PASSWORD_RESET_FROM_EMAIL;
    if (!apiKey || !from) {
      if (process.env.NODE_ENV !== "production") {
        return { delivered: true, developmentOtp: otp };
      }
      throw new Error("PASSWORD_RESET_EMAIL_NOT_CONFIGURED");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: "رمز استعادة كلمة المرور - مستشارك",
        text: `رمز استعادة كلمة المرور الخاص بك هو: ${otp}\n\nالرمز صالح لمدة 10 دقائق. إذا لم تطلب استعادة كلمة المرور فتجاهل هذه الرسالة.`,
      }),
    });

    if (!response.ok) throw new Error("PASSWORD_RESET_EMAIL_DELIVERY_FAILED");
    return { delivered: true };
  }

  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!accessToken || !phoneNumberId) {
    if (process.env.NODE_ENV !== "production") {
      return { delivered: true, developmentOtp: otp };
    }
    throw new Error("PASSWORD_RESET_WHATSAPP_NOT_CONFIGURED");
  }
  if (!phone) throw new Error("PHONE_REQUIRED_FOR_WHATSAPP");

  const response = await fetch(`https://graph.facebook.com/v23.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone.replace(/\D/g, ""),
      type: "template",
      template: {
        name: process.env.WHATSAPP_PASSWORD_RESET_TEMPLATE ?? "mustasharek_password_reset",
        language: { code: process.env.WHATSAPP_PASSWORD_RESET_LANGUAGE ?? "ar" },
        components: [{ type: "body", parameters: [{ type: "text", text: otp }] }],
      },
    }),
  });

  if (!response.ok) throw new Error("PASSWORD_RESET_WHATSAPP_DELIVERY_FAILED");
  return { delivered: true };
}

export async function requestPasswordReset(req: Request, res: Response) {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "validation_error" });

  const email = parsed.data.email.toLowerCase();
  const channel = parsed.data.channel as RecoveryChannel;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  // Do not reveal whether an email exists.
  if (!user || user.accountStatus === "terminated") {
    return res.json({ ok: true, message: "إذا كان الحساب موجوداً، سيتم إرسال رمز الاستعادة." });
  }

  // A social-only identity must not be converted into a local password account
  // through recovery. The user must continue with the linked social provider.
  if (user.authProvider !== "local" || !user.passwordHash) {
    return res.status(400).json({
      ok: false,
      error: "social_account_only",
      message: "هذا الحساب مرتبط بتسجيل دخول اجتماعي. يرجى استخدام مزود تسجيل الدخول المرتبط بالحساب.",
    });
  }

  if (channel === "whatsapp" && !user.phone) {
    return res.status(400).json({ ok: false, error: "phone_required", message: "لا يوجد رقم هاتف مرتبط بهذا الحساب لاستخدام WhatsApp." });
  }

  const otp = String(randomInt(0, 1_000_000)).padStart(OTP_LENGTH, "0");
  const otpHash = hashOtp(otp);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);

  await db.update(usersTable).set({
    passwordResetTokenHash: otpHash,
    passwordResetExpiresAt: expiresAt,
    passwordResetChannel: channel,
    passwordResetAttempts: 0,
    updatedAt: now,
  }).where(eq(usersTable.id, user.id));

  try {
    const delivery = await deliverOtp({ channel, email: user.email, phone: user.phone, otp });
    const response: Record<string, unknown> = {
      ok: true,
      message: channel === "email" ? `تم إرسال رمز التحقق إلى ${maskEmail(user.email)}.` : `تم إرسال رمز التحقق إلى ${maskPhone(user.phone ?? "")}.`,
      channel,
      expiresInSeconds: OTP_TTL_MS / 1000,
    };
    if (delivery.developmentOtp) response.developmentOtp = delivery.developmentOtp;
    return res.json(response);
  } catch (error) {
    req.log.error(error, "password recovery OTP delivery failed");
    // Clear only the OTP we just created. A newer request may already have
    // replaced it while the delivery provider was responding.
    await db.update(usersTable).set({
      passwordResetTokenHash: null,
      passwordResetExpiresAt: null,
      passwordResetChannel: null,
      passwordResetAttempts: 0,
      updatedAt: new Date(),
    }).where(and(eq(usersTable.id, user.id), eq(usersTable.passwordResetTokenHash, otpHash)));
    return res.status(503).json({ ok: false, error: "delivery_unavailable", message: "تعذر إرسال رمز الاستعادة حالياً. يرجى المحاولة لاحقاً." });
  }
}

export async function confirmPasswordReset(req: Request, res: Response) {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "validation_error" });

  const email = parsed.data.email.toLowerCase();
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt) {
    return res.status(400).json({ ok: false, error: "invalid_or_expired_otp", message: "رمز التحقق غير صحيح أو منتهي الصلاحية." });
  }

  if (user.authProvider !== "local" || !user.passwordHash) {
    return res.status(400).json({
      ok: false,
      error: "social_account_only",
      message: "هذا الحساب مرتبط بتسجيل دخول اجتماعي. يرجى استخدام مزود تسجيل الدخول المرتبط بالحساب.",
    });
  }

  if (user.passwordResetAttempts >= MAX_ATTEMPTS) {
    return res.status(429).json({ ok: false, error: "too_many_attempts", message: "تم تجاوز عدد المحاولات. اطلب رمزاً جديداً." });
  }
  if (user.passwordResetExpiresAt.getTime() < Date.now()) {
    return res.status(400).json({ ok: false, error: "expired_otp", message: "انتهت صلاحية الرمز. اطلب رمزاً جديداً." });
  }

  const expectedHash = user.passwordResetTokenHash;
  const valid = hashOtp(parsed.data.otp) === expectedHash;
  if (!valid) {
    // Atomic increment: only increment the counter if this request is still
    // validating the same active OTP. Concurrent requests cannot overwrite a
    // newer counter value with a stale `attempts + 1` value.
    const result = await db.update(usersTable)
      .set({ passwordResetAttempts: sql`${usersTable.passwordResetAttempts} + 1`, updatedAt: new Date() })
      .where(and(
        eq(usersTable.id, user.id),
        eq(usersTable.passwordResetTokenHash, expectedHash),
        lt(usersTable.passwordResetAttempts, MAX_ATTEMPTS),
      ));

    if (result.rowCount === 0) {
      return res.status(429).json({ ok: false, error: "too_many_attempts", message: "تم تجاوز عدد المحاولات. اطلب رمزاً جديداً." });
    }
    return res.status(400).json({ ok: false, error: "invalid_otp", message: "رمز التحقق غير صحيح." });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
  // The hash and expiry are part of the guard, so a stale verification request
  // cannot reset a newer password-recovery session.
  const result = await db.update(usersTable).set({
    passwordHash,
    authProvider: "local",
    passwordResetTokenHash: null,
    passwordResetExpiresAt: null,
    passwordResetChannel: null,
    passwordResetAttempts: 0,
    updatedAt: new Date(),
  }).where(and(
    eq(usersTable.id, user.id),
    eq(usersTable.passwordResetTokenHash, expectedHash),
    eq(usersTable.passwordResetExpiresAt, user.passwordResetExpiresAt),
  ));

  if (result.rowCount === 0) {
    return res.status(400).json({ ok: false, error: "invalid_or_expired_otp", message: "رمز التحقق غير صحيح أو منتهي الصلاحية." });
  }

  return res.json({ ok: true, message: "تم تغيير كلمة المرور بنجاح." });
}
