import { type Request, type Response } from "express";
import { createHash, randomInt } from "node:crypto";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

const requestSchema = z.object({ email: z.string().email() });
const resetSchema = z.object({
  email: z.string().email(),
  otp: z.string().regex(/^\d{6}$/),
  newPassword: z.string().min(6).max(128),
});

const RESET_TTL_MS = 10 * 60 * 1000;
const RESET_COOLDOWN_MS = 60 * 1000;

function hashCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export async function requestPasswordReset(req: Request, res: Response) {
  const parsed = requestSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "validation_error" });

  const email = parsed.data.email.trim().toLowerCase();
  const user = (await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1))[0] ?? null;

  // Do not reveal whether an account exists.
  if (!user) return res.json({ ok: true, message: "إذا كان الحساب موجوداً، فسيتم إرسال رمز استعادة كلمة المرور." });

  const now = new Date();
  if (user.passwordResetRequestedAt && now.getTime() - user.passwordResetRequestedAt.getTime() < RESET_COOLDOWN_MS) {
    return res.json({ ok: true, message: "إذا كان الحساب موجوداً، فسيتم إرسال رمز استعادة كلمة المرور." });
  }

  const otp = String(randomInt(100000, 1000000));
  await db.update(usersTable).set({
    passwordResetCodeHash: hashCode(otp),
    passwordResetExpiresAt: new Date(now.getTime() + RESET_TTL_MS),
    passwordResetRequestedAt: now,
    updatedAt: now,
  }).where(eq(usersTable.id, user.id));

  // Codespaces/development needs a deterministic way to exercise the complete flow
  // without pretending an email provider exists. Production must wire this to mail/SMS.
  if (process.env.NODE_ENV !== "production" || process.env.PASSWORD_RESET_DEV_MODE === "true") {
    req.log.info({ userId: user.id }, "password reset code generated for development");
    return res.json({ ok: true, message: "تم إنشاء رمز الاستعادة.", developmentOtp: otp });
  }

  return res.json({ ok: true, message: "إذا كان الحساب موجوداً، فسيتم إرسال رمز استعادة كلمة المرور." });
}

export async function resetPassword(req: Request, res: Response) {
  const parsed = resetSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "validation_error" });

  const email = parsed.data.email.trim().toLowerCase();
  const user = (await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1))[0] ?? null;
  if (!user) return res.status(400).json({ ok: false, error: "invalid_reset_request", message: "رمز التحقق غير صحيح أو منتهي الصلاحية." });

  if (!user.passwordResetCodeHash || !user.passwordResetExpiresAt || user.passwordResetExpiresAt.getTime() < Date.now() || hashCode(parsed.data.otp) !== user.passwordResetCodeHash) {
    return res.status(400).json({ ok: false, error: "invalid_reset_request", message: "رمز التحقق غير صحيح أو منتهي الصلاحية." });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.update(usersTable).set({
    passwordHash,
    passwordResetCodeHash: null,
    passwordResetExpiresAt: null,
    passwordResetRequestedAt: null,
    updatedAt: new Date(),
  }).where(eq(usersTable.id, user.id));

  // Password recovery never bypasses the account lifecycle:
  // pending lawyers remain pending; suspended/blocked/rejected/terminated accounts remain blocked.
  const canLoginAfterReset = user.accountStatus === "active" || user.role === "admin";
  return res.json({
    ok: true,
    passwordChanged: true,
    accountStatus: user.accountStatus,
    canLogin: canLoginAfterReset,
    message: canLoginAfterReset
      ? "تم تغيير كلمة المرور. يمكنك الآن تسجيل الدخول."
      : "تم تغيير كلمة المرور، لكن حالة الحساب لم تتغير. يجب إكمال الموافقة أو رفع الإيقاف من الإدارة قبل تسجيل الدخول.",
  });
}
