import { type NextFunction, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

/**
 * Binds local authentication to the portal selected by the user.
 * The client/lawyer role is required for every local-auth request so the
 * server never issues a JWT without a portal context.
 */
export async function enforcePortalRole(req: Request, res: Response, next: NextFunction) {
  const requestedRole = req.body?.role as string | undefined;
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

  if (!email || (requestedRole !== "client" && requestedRole !== "lawyer")) {
    return res.status(400).json({
      ok: false,
      error: "portal_role_required",
      message: "نوع البوابة مطلوب لإتمام تسجيل الدخول.",
    });
  }

  try {
    const [existing] = await db
      .select({ id: usersTable.id, role: usersTable.role })
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

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
