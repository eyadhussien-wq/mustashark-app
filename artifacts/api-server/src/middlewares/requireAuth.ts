import { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { verifyToken } from "../lib/jwt";

declare global {
  namespace Express {
    interface Request {
      authUser?: typeof usersTable.$inferSelect & { userId: string };
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<Response | void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        ok: false,
        error: "missing_or_invalid_authorization_header",
      });
    }

    const token = authHeader.slice("Bearer ".length).trim();
    if (!token) {
      return res.status(401).json({ ok: false, error: "missing_or_invalid_authorization_header" });
    }

    const payload = verifyToken(token);
    if (!payload?.userId) {
      return res.status(401).json({ ok: false, error: "invalid_token_payload" });
    }

    try {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, payload.userId))
        .limit(1);

      if (!user || user.deletedAt || user.accountStatus !== "active") {
        return res.status(403).json({
          ok: false,
          error: "unauthorized_or_suspended",
        });
      }

      req.authUser = { ...user, userId: user.id };
      return next();
    } catch (dbErr) {
      console.error("Auth DB Error:", dbErr);
      return res.status(503).json({
        ok: false,
        error: "authentication_service_unavailable",
      });
    }
  } catch (error) {
    const errorName = error instanceof Error ? error.name : "";
    if (errorName === "TokenExpiredError") {
      return res.status(401).json({ ok: false, error: "token_expired" });
    }
    if (errorName === "JsonWebTokenError") {
      return res.status(401).json({ ok: false, error: "invalid_token" });
    }
    console.error("Authentication Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
