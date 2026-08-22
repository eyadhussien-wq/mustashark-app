import { type Request, type Response, type NextFunction } from "express";
import { verifyToken, type JwtPayload } from "../lib/jwt";
import { db, usersTable } from "@workspace/db";
import { and, eq } from "drizzle-orm";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: JwtPayload;
    }
  }
}

export async function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  try {
    const payload = verifyToken(token);
    if (payload.role !== "admin") {
      res.status(401).json({ error: "غير مصرح" });
      return;
    }

    // Fail closed against stale admin JWTs: authorization is granted only when
    // the current DB record still exists, is an admin, is not soft-deleted, and
    // remains in an active account state.
    const [adminUser] = await db
      .select({
        id: usersTable.id,
        role: usersTable.role,
        accountStatus: usersTable.accountStatus,
        deletedAt: usersTable.deletedAt,
      })
      .from(usersTable)
      .where(
        and(
          eq(usersTable.id, payload.userId),
          eq(usersTable.role, "admin"),
          eq(usersTable.accountStatus, "active"),
        ),
      )
      .limit(1);

    if (!adminUser || adminUser.deletedAt) {
      res
        .status(401)
        .json({ error: "انتهت صلاحية الحساب أو تم إلغاء الصلاحية" });
      return;
    }

    req.admin = payload;
    next();
  } catch (err) {
    // Fail-Closed: If DB query fails or token verification fails, reject request.
    if (err instanceof Error && err.message.includes("Token")) {
      res.status(401).json({ error: "انتهت الجلسة، يرجى تسجيل الدخول مجدداً" });
      return;
    }

    req.log?.error(err, "requireAdmin database verification failed");
    res.status(500).json({ error: "internal_error" });
  }
}
