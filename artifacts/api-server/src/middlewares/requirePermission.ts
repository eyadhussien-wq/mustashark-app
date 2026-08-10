import { Request, Response, NextFunction } from "express";
import { eq, and } from "drizzle-orm";
import { db } from "@workspace/db";
import { adminPermissionsTable } from "@workspace/db/schema/adminPermissions";
import { adminRolePermissionsTable } from "@workspace/db/schema/adminRolePermissions";

export const requirePermission = (permissionKey: string) => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const user = req.authUser;

      if (!user) {
        return res.status(401).json({
          ok: false,
          error: "authentication_required",
        });
      }

      if (!user.adminRoleId) {
        return res.status(403).json({
          ok: false,
          error: "admin_role_required",
        });
      }

      const permissions = await db
        .select({
          key: adminPermissionsTable.key,
        })
        .from(adminRolePermissionsTable)
        .innerJoin(
          adminPermissionsTable,
          eq(
            adminRolePermissionsTable.permissionId,
            adminPermissionsTable.id,
          ),
        )
        .where(
          and(
            eq(
              adminRolePermissionsTable.roleId,
              user.adminRoleId,
            ),
            eq(
              adminPermissionsTable.key,
              permissionKey,
            ),
          ),
        )
        .limit(1);

      if (!permissions.length) {
        return res.status(403).json({
          ok: false,
          error: "permission_denied",
          permission: permissionKey,
        });
      }

      return next();
    } catch (error) {
      console.error("Permission middleware error:", error);

      return res.status(500).json({
        ok: false,
        error: "permission_check_failed",
      });
    }
  };
};
