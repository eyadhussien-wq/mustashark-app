import { type NextFunction, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

/**
 * Enforces the portal selected by the client before local-auth can issue a JWT.
 * Registration is still allowed for new emails; the role check only applies
 * when the email already belongs to an existing user.
 */
export async function enforcePortalRole(req: Request, res: Response, next: NextFunction) {
  const requestedRole = req.body?.role as string | undefined;
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

  if (!requestedRole || !email) return next();
  if (requestedRole !== "client" && requestedRole !== "lawyer") return next();

  try {
    const rows = await db
      .select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    const existing = rows[0];
    if (!existing || existing.role === "admin" || existing.role === requestedRole) {
      return next();
    }

    if (existing.role === "lawyer" && requestedRole === "client") {
      return res.status(403).json({
        ok: false,
        error: "role_mismatch",
        message: "عذراً، هذا الحساب مسجل كمحامٍ. يرجى الدخول من بوابة المحامين.",
      });
    }

    return res.status(403).json({
      ok: false,
      error: "role_mismatch",
      message: "عذراً، هذا الحساب مسجل كعميل. يرجى الدخول من بوابة العملاء.",
    });
  } catch (error) {
    req.log.error(error, "portal role check failed");
    return res.status(500).json({
      ok: false,
      error: "internal_error",
      message: "تعذر التحقق من نوع الحساب. يرجى المحاولة مجدداً.",
    });
  }
}
