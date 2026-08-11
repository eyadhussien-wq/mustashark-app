import { type Request, type Response } from "express";
import { db, lawyerBankAccountsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { z } from "zod";

function getKey() {
  const secret = process.env.BANK_DATA_ENCRYPTION_KEY;
  if (!secret) throw new Error("BANK_DATA_ENCRYPTION_KEY is required");
  return createHash("sha256").update(secret).digest();
}

function encrypt(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function last4(iban: string) {
  return iban.slice(-4);
}

const bankAccountSchema = z.object({
  bankName: z.string().trim().min(2).max(150),
  accountHolderName: z.string().trim().min(2).max(150),
  bankCountry: z.enum(["qatar", "jordan"]),
  iban: z.string().trim().min(15).max(34).regex(/^[A-Z]{2}[0-9A-Z]+$/, "IBAN غير صالح"),
  swiftCode: z.string().trim().max(20).optional().nullable(),
  verificationDocumentKey: z.string().trim().min(1).max(500).optional().nullable(),
});

export async function upsertLawyerBankAccount(req: Request, res: Response) {
  const { authUser } = req;
  if (!authUser || authUser.role !== "lawyer") {
    return res.status(403).json({ ok: false, error: "lawyer_only" });
  }

  const parsed = bankAccountSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "validation_error", issues: parsed.error.issues });
  }

  const { bankName, accountHolderName, bankCountry, iban, swiftCode, verificationDocumentKey } = parsed.data;
  const normalizedIban = iban.replace(/\s+/g, "").toUpperCase();

  try {
    const existing = await db.query.lawyerBankAccountsTable.findFirst({
      where: eq(lawyerBankAccountsTable.lawyerId, authUser.userId),
    });

    const values = {
      bankName,
      accountHolderName,
      bankCountry,
      ibanEncrypted: encrypt(normalizedIban),
      ibanLast4: last4(normalizedIban),
      swiftCodeEncrypted: swiftCode ? encrypt(swiftCode.toUpperCase()) : null,
      verificationDocumentKey: verificationDocumentKey ?? null,
      verificationStatus: "pending" as const,
      rejectionNote: null,
      verifiedBy: null,
      verifiedAt: null,
      updatedAt: new Date(),
    };

    const row = existing
      ? (await db.update(lawyerBankAccountsTable).set(values).where(eq(lawyerBankAccountsTable.id, existing.id)).returning())[0]
      : (await db.insert(lawyerBankAccountsTable).values({ id: `bank-${Date.now()}-${randomBytes(4).toString("hex")}`, lawyerId: authUser.userId, ...values }).returning())[0];

    return res.status(existing ? 200 : 201).json({
      ok: true,
      bankAccount: {
        id: row.id,
        bankName: row.bankName,
        accountHolderName: row.accountHolderName,
        bankCountry: row.bankCountry,
        ibanLast4: row.ibanLast4,
        verificationStatus: row.verificationStatus,
        rejectionNote: row.rejectionNote,
      },
    });
  } catch (err) {
    req.log?.error?.(err, "upsertLawyerBankAccount failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

export async function getLawyerBankAccount(req: Request, res: Response) {
  const { authUser } = req;
  if (!authUser || authUser.role !== "lawyer") return res.status(403).json({ ok: false, error: "lawyer_only" });

  const row = await db.query.lawyerBankAccountsTable.findFirst({
    where: eq(lawyerBankAccountsTable.lawyerId, authUser.userId),
  });

  return res.json({
    ok: true,
    bankAccount: row
      ? { id: row.id, bankName: row.bankName, accountHolderName: row.accountHolderName, bankCountry: row.bankCountry, ibanLast4: row.ibanLast4, verificationStatus: row.verificationStatus, rejectionNote: row.rejectionNote }
      : null,
  });
}

export async function listPendingBankAccounts(req: Request, res: Response) {
  const { authUser } = req;
  if (!authUser || authUser.role !== "admin") return res.status(403).json({ ok: false, error: "admin_only" });

  const rows = await db.query.lawyerBankAccountsTable.findMany({
    where: eq(lawyerBankAccountsTable.verificationStatus, "pending"),
    orderBy: (table, { asc }) => [asc(table.createdAt)],
  });

  return res.json({ ok: true, items: rows.map((row) => ({ ...row, ibanEncrypted: undefined, swiftCodeEncrypted: undefined })) });
}

const reviewSchema = z.object({ rejectionNote: z.string().trim().max(1000).optional().nullable() });

export async function reviewBankAccount(req: Request, res: Response) {
  const { authUser } = req;
  if (!authUser || authUser.role !== "admin") return res.status(403).json({ ok: false, error: "admin_only" });

  const action = req.params.action;
  if (action !== "approve" && action !== "reject") return res.status(400).json({ ok: false, error: "invalid_action" });

  const parsed = reviewSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ ok: false, error: "validation_error", issues: parsed.error.issues });
  if (action === "reject" && !parsed.data.rejectionNote) return res.status(400).json({ ok: false, error: "rejection_note_required" });

  const [updated] = await db
    .update(lawyerBankAccountsTable)
    .set({
      verificationStatus: action === "approve" ? "verified" : "rejected",
      rejectionNote: action === "approve" ? null : parsed.data.rejectionNote,
      verifiedBy: authUser.userId,
      verifiedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(lawyerBankAccountsTable.id, String(req.params.id)), eq(lawyerBankAccountsTable.verificationStatus, "pending")))
    .returning();

  if (!updated) return res.status(404).json({ ok: false, error: "bank_account_not_found_or_already_reviewed" });
  return res.json({ ok: true, verificationStatus: updated.verificationStatus });
}
