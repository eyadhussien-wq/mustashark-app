import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const bankAccountVerificationStatusEnum = pgEnum(
  "bank_account_verification_status",
  ["not_submitted", "pending", "verified", "rejected", "suspended"],
);

export const lawyerBankAccountsTable = pgTable("lawyer_bank_accounts", {
  id: text("id").primaryKey(),
  lawyerId: text("lawyer_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),
  bankName: text("bank_name").notNull(),
  accountHolderName: text("account_holder_name").notNull(),
  bankCountry: text("bank_country").notNull(),
  ibanEncrypted: text("iban_encrypted").notNull(),
  ibanLast4: text("iban_last4").notNull(),
  swiftCodeEncrypted: text("swift_code_encrypted"),
  verificationDocumentKey: text("verification_document_key"),
  verificationStatus: bankAccountVerificationStatusEnum("verification_status")
    .notNull()
    .default("pending"),
  rejectionNote: text("rejection_note"),
  verifiedBy: text("verified_by").references(() => usersTable.id),
  verifiedAt: timestamp("verified_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type LawyerBankAccount = typeof lawyerBankAccountsTable.$inferSelect;
export type InsertLawyerBankAccount =
  typeof lawyerBankAccountsTable.$inferInsert;
