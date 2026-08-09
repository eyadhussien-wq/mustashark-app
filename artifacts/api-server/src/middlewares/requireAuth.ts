import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";

declare global {
  namespace Express {
    interface Request {
      authUser?: typeof usersTable.$inferSelect & { userId: string };
    }
  }
}

interface JwtPayload {
  userId: string;
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

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error(
        "CRITICAL: JWT_SECRET is not configured in environment variables.",
      );
      return res.status(500).json({
        ok: false,
        error: "authentication_configuration_error",
      });
    }

    const payload = jwt.verify(token, secret) as JwtPayload;

    if (!payload || !payload.userId) {
      return res
        .status(401)
        .json({ ok: false, error: "invalid_token_payload" });
    }

    try {
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, payload.userId))
        .limit(1);

      if (!user || user.deletedAt || user.accountStatus !== "active") {
        return res
          .status(403)
          .json({ ok: false, error: "unauthorized_or_suspended" });
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
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ ok: false, error: "token_expired" });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ ok: false, error: "invalid_token" });
    }
    console.error("Authentication Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
