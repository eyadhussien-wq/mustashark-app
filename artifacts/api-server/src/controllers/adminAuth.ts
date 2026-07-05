import { type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { AdminLoginBody } from "@workspace/api-zod";
import { signToken } from "../lib/jwt";
import { verifyPassword } from "../lib/password";

export async function adminLogin(req: Request, res: Response) {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
  }

  const { email, password } = parsed.data;

  try {
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.email, email))
      .limit(1);

    if (!user || user.role !== "admin" || !user.passwordHash) {
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }

    if (!verifyPassword(password, user.passwordHash)) {
      return res.status(401).json({ error: "بيانات الدخول غير صحيحة" });
    }

    const token = signToken({
      userId: user.id,
      email: user.email,
      role: "admin",
      provider: "local",
    });

    req.log.info({ userId: user.id }, "admin login success");

    return res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        country: user.country ?? null,
      },
    });
  } catch (err) {
    req.log.error(err, "adminLogin failed");
    return res.status(500).json({ error: "internal_error" });
  }
}

export async function getAdminProfile(req: Request, res: Response) {
  try {
    const adminId = req.admin!.userId;
    const [user] = await db
      .select()
      .from(usersTable)
      .where(eq(usersTable.id, adminId))
      .limit(1);

    if (!user || user.role !== "admin") {
      return res.status(401).json({ error: "غير مصرح" });
    }

    return res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      country: user.country ?? null,
    });
  } catch (err) {
    req.log.error(err, "getAdminProfile failed");
    return res.status(500).json({ error: "internal_error" });
  }
}
