import { type Request, type Response, type NextFunction } from "express";
import { verifyToken, type JwtPayload } from "../lib/jwt";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      authUser?: JwtPayload;
    }
  }
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    res.status(401).json({ ok: false, error: "غير مصرح" });
    return;
  }

  const token = header.slice("Bearer ".length).trim();

  let payload: JwtPayload;
  try {
    payload = verifyToken(token);
  } catch {
    res
      .status(401)
      .json({ ok: false, error: "انتهت الجلسة، يرجى تسجيل الدخول مجدداً" });
    return;
  }

  // Validate current account status — reject soft-deleted/terminated accounts
  // even if their JWT is still cryptographically valid.
  try {
    const [row] = await db
      .select({
        deletedAt: usersTable.deletedAt,
        accountStatus: usersTable.accountStatus,
      })
      .from(usersTable)
      .where(eq(usersTable.id, payload.userId))
      .limit(1);

    if (!row) {
      res.status(401).json({ ok: false, error: "الحساب غير موجود" });
      return;
    }

    if (row.deletedAt !== null) {
      res.status(401).json({
        ok: false,
        error:
          "تم جدولة حذف حسابك. يرجى تسجيل الدخول مجدداً لاسترداده خلال فترة السماح.",
      });
      return;
    }

    if (row.accountStatus === "terminated") {
      res
        .status(401)
        .json({ ok: false, error: "تم إنهاء حسابك ولا يمكن الوصول إليه" });
      return;
    }
  } catch (dbErr) {
    // DB unreachable — fail open (log and proceed) so the middleware does not
    // take down all authenticated endpoints during a transient DB outage.
    req.log?.warn({ err: dbErr }, "requireAuth: DB status check failed, proceeding");
  }

  req.authUser = payload;
  next();
}
