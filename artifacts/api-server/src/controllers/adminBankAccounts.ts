import { type Request, type Response } from "express";
import { db, lawyerBankAccountsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export async function listAdminBankAccounts(req: Request, res: Response) {
  const { authUser } = req;
  if (!authUser || authUser.role !== "admin") return res.status(403).json({ ok: false, error: "admin_only" });

  const rows = await db
    .select({
      id: lawyerBankAccountsTable.id,
      lawyerId: lawyerBankAccountsTable.lawyerId,
      lawyerName: usersTable.name,
      lawyerEmail: usersTable.email,
      bankName: lawyerBankAccountsTable.bankName,
      accountHolderName: lawyerBankAccountsTable.accountHolderName,
      bankCountry: lawyerBankAccountsTable.bankCountry,
      ibanLast4: lawyerBankAccountsTable.ibanLast4,
      verificationDocumentKey: lawyerBankAccountsTable.verificationDocumentKey,
      verificationStatus: lawyerBankAccountsTable.verificationStatus,
      rejectionNote: lawyerBankAccountsTable.rejectionNote,
      createdAt: lawyerBankAccountsTable.createdAt,
      updatedAt: lawyerBankAccountsTable.updatedAt,
    })
    .from(lawyerBankAccountsTable)
    .innerJoin(usersTable, eq(usersTable.id, lawyerBankAccountsTable.lawyerId))
    .orderBy(lawyerBankAccountsTable.createdAt);

  return res.json({ ok: true, items: rows });
}
