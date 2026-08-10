import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { adminRolesTable } from "./adminRoles";
import { adminPermissionsTable } from "./adminPermissions";

export const adminRolePermissionsTable = pgTable(
  "admin_role_permissions",
  {
    id: text("id").primaryKey(),

    roleId: text("role_id")
      .notNull()
      .references(() => adminRolesTable.id),

    permissionId: text("permission_id")
      .notNull()
      .references(() => adminPermissionsTable.id),

    createdAt: timestamp("created_at")
      .notNull()
      .defaultNow(),
  }
);
