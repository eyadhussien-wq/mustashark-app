import { pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { casesTable } from "./cases";

export const caseMembershipRoleEnum = pgEnum("case_membership_role", [
  "client",
  "lawyer",
  "authorized_representative",
]);

export const caseMembershipStatusEnum = pgEnum("case_membership_status", [
  "active",
  "revoked",
]);

export const caseMembershipsTable = pgTable(
  "case_memberships",
  {
    id: text("id").primaryKey(),
    caseId: text("case_id").notNull().references(() => casesTable.id),
    userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
    role: caseMembershipRoleEnum("role").notNull(),
    status: caseMembershipStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    revokedAt: timestamp("revoked_at"),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    caseUserUnique: uniqueIndex("case_memberships_case_user_uidx").on(table.caseId, table.userId),
  }),
);

export type CaseMembership = typeof caseMembershipsTable.$inferSelect;
