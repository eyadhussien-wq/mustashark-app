import {
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { usersTable } from "./users.ts";
import { representationQuotesTable } from "./representationFinance.ts";

export const agreementStatusEnum = pgEnum("agreement_status", [
  "draft",
  "prepared",
  "awaiting_confirmation",
  "confirmed",
  "superseded",
  "cancelled",
  "expired",
]);

export const agreementVersionStatusEnum = pgEnum("agreement_version_status", [
  "draft",
  "prepared",
  "published",
  "superseded",
]);

export const agreementActorRoleEnum = pgEnum("agreement_actor_role", ["client", "lawyer"]);

export const agreementsTable = pgTable(
  "agreements",