import { type Request, type Response, type NextFunction } from "express";
import { verifyToken, type JwtPayload } from "../lib/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      admin?: JwtPayload;
    }
  }
}

export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
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
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ error: "انتهت الجلسة، يرجى تسجيل الدخول مجدداً" });
  }
}
