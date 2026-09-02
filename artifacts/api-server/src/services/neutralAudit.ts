import crypto from "node:crypto";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  neutralAuditEventsTable,
  neutralDocumentsTable,
  neutralMattersTable,
  neutralDocumentSharesTable,
  lawyerClientsTable,
  usersTable,
} from "@workspace/db/schema";

export type NeutralAuditRole = "lawyer" | "client" | "admin";
export type NeutralAuditOutcome = "allowed" | "denied";
export type NeutralAuditResourceType =
  | "client"
  | "matter"
  | "document"
  | "schedule"
  | "message"
  | "export";

export type NeutralAuditInput = {
  actorUserId: string;
  actorRole: NeutralAuditRole;
  action: string;
  resourceType: NeutralAuditResourceType;
  resourceId: string;
  outcome: NeutralAuditOutcome;
  reasonCode?: string | null;
  correlationId?: string | null;
  metadata?: Record<string, string | number | boolean | null> | null;
};

/**
 * Audit is append-only by service contract: this module exposes insert/read
 * operations only and deliberately has no update/delete API.
 * Never place document contents, credentials, JWTs, raw tokens, or secrets in metadata.
 */
export async function recordNeutralAuditEvent(input: NeutralAuditInput) {
  const [event] = await db
    .insert(neutralAuditEventsTable)
    .values({
      id: crypto.randomUUID(),
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      outcome: input.outcome,
      reasonCode: input.reasonCode ?? null,
      correlationId: input.correlationId ?? null,
      metadata: input.metadata ?? null,
    })
    .returning();

  return event;
}

/** Lawyer-scoped audit stream. No admin bypass and no cross-lawyer access. */
export async function listNeutralAuditEventsForLawyer(lawyerId: string) {
  return db
    .select()
    .from(neutralAuditEventsTable)
    .where(and(eq(neutralAuditEventsTable.actorUserId, lawyerId), eq(neutralAuditEventsTable.actorRole, "lawyer")))
    .orderBy(asc(neutralAuditEventsTable.occurredAt), asc(neutralAuditEventsTable.id));
}

export type NeutralLawyerExport = {
  schemaVersion: 1;
  exportedAt: string;
  lawyer: { id: string; role: "lawyer" };
  clients: Array<{ id: string; role: string; accountStatus: string }>;
  matters: Array<{ id: string; clientId: string; title: string; status: string }>;
  documents: Array<{ id: string; matterId: string | null; title: string; storageKey: string; contentHash: string | null; status: string }>;
  documentShares: Array<{ id: string; documentId: string; clientId: string; status: string; createdAt: Date; revokedAt: Date | null }>;
  audit: Array<typeof neutralAuditEventsTable.$inferSelect>;
};

/**
 * Export is a data portability boundary, not a privileged admin read.
 * Only an active lawyer may export that lawyer's Neutral Core records.
 * File bytes/content are intentionally not exported by this DB-layer function.
 */
export async function exportNeutralLawyerData(lawyerId: string): Promise<NeutralLawyerExport> {
  const [lawyer] = await db
    .select({ id: usersTable.id, role: usersTable.role, accountStatus: usersTable.accountStatus, deletedAt: usersTable.deletedAt })
    .from(usersTable)
    .where(eq(usersTable.id, lawyerId))
    .limit(1);

  if (!lawyer || lawyer.role !== "lawyer" || lawyer.accountStatus !== "active" || lawyer.deletedAt !== null) {
    throw new Error("LAWYER_EXPORT_NOT_AUTHORIZED");
  }

  const clients = await db
    .select({ id: usersTable.id, role: usersTable.role, accountStatus: usersTable.accountStatus })
    .from(usersTable)
    .innerJoin(lawyerClientsTable, eq(lawyerClientsTable.clientId, usersTable.id))
    .where(and(eq(lawyerClientsTable.lawyerId, lawyerId), eq(lawyerClientsTable.status, "active")));

  const matters = await db
    .select({ id: neutralMattersTable.id, clientId: neutralMattersTable.clientId, title: neutralMattersTable.title, status: neutralMattersTable.status })
    .from(neutralMattersTable)
    .where(eq(neutralMattersTable.lawyerId, lawyerId));

  const documents = await db
    .select({
      id: neutralDocumentsTable.id,
      matterId: neutralDocumentsTable.matterId,
      title: neutralDocumentsTable.title,
      storageKey: neutralDocumentsTable.storageKey,
      contentHash: neutralDocumentsTable.contentHash,
      status: neutralDocumentsTable.status,
    })
    .from(neutralDocumentsTable)
    .where(eq(neutralDocumentsTable.lawyerId, lawyerId));

  const documentIds = documents.map((document) => document.id);
  const documentShares = documentIds.length === 0
    ? []
    : await db
        .select({
          id: neutralDocumentSharesTable.id,
          documentId: neutralDocumentSharesTable.documentId,
          clientId: neutralDocumentSharesTable.clientId,
          status: neutralDocumentSharesTable.status,
          createdAt: neutralDocumentSharesTable.createdAt,
          revokedAt: neutralDocumentSharesTable.revokedAt,
        })
        .from(neutralDocumentSharesTable)
        .innerJoin(neutralDocumentsTable, eq(neutralDocumentsTable.id, neutralDocumentSharesTable.documentId))
        .where(eq(neutralDocumentsTable.lawyerId, lawyerId));

  const audit = await db
    .select()
    .from(neutralAuditEventsTable)
    .where(eq(neutralAuditEventsTable.actorUserId, lawyerId))
    .orderBy(asc(neutralAuditEventsTable.occurredAt), asc(neutralAuditEventsTable.id));

  return {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    lawyer: { id: lawyer.id, role: "lawyer" },
    clients,
    matters,
    documents,
    documentShares,
    audit,
  };
}
