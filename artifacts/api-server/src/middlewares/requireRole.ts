import { Request, Response, NextFunction } from "express";

type PortalRole = "client" | "lawyer" | "admin";

export const requireRole = (...allowedRoles: PortalRole[]) => {
  return (req: Request, res: Response, next: NextFunction): Response | void => {
    const role = req.authUser?.role as PortalRole | undefined;

    if (!role || !allowedRoles.includes(role)) {
      return res.status(403).json({
        ok: false,
        error: "forbidden_role",
      });
    }

    return next();
  };
};
