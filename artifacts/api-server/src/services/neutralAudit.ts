import crypto from "node:crypto";
import { and, asc, desc, eq, inArray, or, sql } from "drizzle-orm";
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
export type NeutralAuditResourceType = "client" | "matter" | "document" | "schedule" | "message" | "export";
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

export const NEUTRAL_AUDIT_CHAIN_VERSION = "1";
export const NEUTRAL_AUDIT_CANONICALIZATION_VERSION = "1";

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function canonicalize(value: Record<string, unknown>): string {
  return JSON.stringify(Object.keys(value).sort().reduce<Record<string, unknown>>((result, key) => {
    result[key] = value[key];
    return result;
  }, {}));
}

export function buildNeutralAuditGenesisHash(input: {
  actorUserId: string;
  neutralCoreCommitSha: string;
  initializedAt: string;
  environmentClass: string;
}): string {
  return sha256(canonicalize({
    type: "NEUTRAL_AUDIT_GENESIS",
    chainVersion: NEUTRAL_AUDIT_CHAIN_VERSION,
    canonicalizationVersion: NEUTRAL_AUDIT_CANONICALIZATION_VERSION,
    actorUserId: input.actorUserId,
    neutralCoreCommitSha: input.neutralCoreCommitSha,
    initializedAt: input.initializedAt,
    environmentClass: input.environmentClass,
  }));
}

export function buildNeutralAuditEventHash(input: {
  id: string;
  actorUserId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  outcome: string;
  reasonCode: string | null;
  correlationId: string | null;
  metadata: Record<string, unknown> | null;
  chainVersion: string;
  canonicalizationVersion: string;
  genesisHash: string;
  previousHash: string | null;
  occurredAt: string;
}): string {
  return sha256(canonicalize(input));
}

function genesisConfig() {
  return {
    neutralCoreCommitSha: process.env.NEUTRAL_CORE_COMMIT_SHA ?? "unknown",
    environmentClass: process.env.NODE_ENV === "production" ? "production" : "non-production",
  };
}

type AuditTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function ensureNeutralAuditGenesis(transaction: AuditTransaction, actorUserId: string, actorRole: NeutralAuditRole) {
  const [existing] = await transaction.select().from(neutralAuditEventsTable).where(and(
    eq(neutralAuditEventsTable.actorUserId, actorUserId),
    eq(neutralAuditEventsTable.action, "GENESIS"),
  )).limit(1);
  if (existing) return existing;

  const initializedAt = new Date().toISOString();
  const config = genesisConfig();
  const genesisHash = buildNeutralAuditGenesisHash({ actorUserId, initializedAt, ...config });
  const id = crypto.randomUUID();
  const metadata = { initializedAt, ...config };
  const eventHash = buildNeutralAuditEventHash({
    id, actorUserId, actorRole, action: "GENESIS", resourceType: "export", resourceId: `genesis:${actorUserId}`,
    outcome: "allowed", reasonCode: null, correlationId: null, metadata,
    chainVersion: NEUTRAL_AUDIT_CHAIN_VERSION, canonicalizationVersion: NEUTRAL_AUDIT_CANONICALIZATION_VERSION,
    genesisHash, previousHash: null, occurredAt: initializedAt,
  });

  const [genesis] = await transaction.insert(neutralAuditEventsTable).values({
    id, actorUserId, actorRole, action: "GENESIS", resourceType: "export", resourceId: `genesis:${actorUserId}`,
    outcome: "allowed", reasonCode: null, correlationId: null, metadata,
    chainVersion: NEUTRAL_AUDIT_CHAIN_VERSION, canonicalizationVersion: NEUTRAL_AUDIT_CANONICALIZATION_VERSION,
    genesisHash, previousHash: null, eventHash, occurredAt: new Date(initializedAt),
  }).returning();
  return genesis;
}

/** Append-only audit API. Database migration also blocks UPDATE/DELETE. */
export async function recordNeutralAuditEvent(input: NeutralAuditInput) {
  return db.transaction(async (transaction) => {
    await transaction.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${input.actorUserId}))`);
    const genesis = await ensureNeutralAuditGenesis(transaction, input.actorUserId, input.actorRole);
    const [previous] = await transaction.select().from(neutralAuditEventsTable)
      .where(eq(neutralAuditEventsTable.actorUserId, input.actorUserId))
      .orderBy(desc(neutralAuditEventsTable.occurredAt), desc(neutralAuditEventsTable.id)).limit(1);
    const id = crypto.randomUUID();
    const occurredAt = new Date();
    const previousHash = previous?.eventHash ?? genesis.eventHash;
    const metadata = input.metadata ?? null;
    const eventHash = buildNeutralAuditEventHash({
      id, actorUserId: input.actorUserId, actorRole: input.actorRole, action: input.action,
      resourceType: input.resourceType, resourceId: input.resourceId, outcome: input.outcome,
      reasonCode: input.reasonCode ?? null, correlationId: input.correlationId ?? null, metadata,
      chainVersion: NEUTRAL_AUDIT_CHAIN_VERSION, canonicalizationVersion: NEUTRAL_AUDIT_CANONICALIZATION_VERSION,
      genesisHash: genesis.genesisHash, previousHash, occurredAt: occurredAt.toISOString(),
    });
    const [event] = await transaction.insert(neutralAuditEventsTable).values({
      id, actorUserId: input.actorUserId, actorRole: input.actorRole, action: input.action,
      resourceType: input.resourceType, resourceId: input.resourceId, outcome: input.outcome,
      reasonCode: input.reasonCode ?? null, correlationId: input.correlationId ?? null, metadata,
      chainVersion: NEUTRAL_AUDIT_CHAIN_VERSION, canonicalizationVersion: NEUTRAL_AUDIT_CANONICALIZATION_VERSION,
      genesisHash: genesis.genesisHash, previousHash, eventHash, occurredAt,
    }).returning();
    return event;
  });
}

export async function verifyNeutralAuditChain(lawyerId: string) {
  const events = await db.select().from(neutralAuditEventsTable)
    .where(eq(neutralAuditEventsTable.actorUserId, lawyerId))
    .orderBy(asc(neutralAuditEventsTable.occurredAt), asc(neutralAuditEventsTable.id));
  if (events.length === 0) return { status: "CHAIN_VALID" as const, checkedEvents: 0 };

  let previousHash: string | null = null;
  for (let index = 0; index < events.length; index += 1) {
    const event = events[index];
    const expected = buildNeutralAuditEventHash({
      id: event.id, actorUserId: event.actorUserId, actorRole: event.actorRole, action: event.action,
      resourceType: event.resourceType, resourceId: event.resourceId, outcome: event.outcome,
      reasonCode: event.reasonCode, correlationId: event.correlationId, metadata: event.metadata as Record<string, unknown> | null,
      chainVersion: event.chainVersion, canonicalizationVersion: event.canonicalizationVersion,
      genesisHash: event.genesisHash, previousHash: event.previousHash, occurredAt: event.occurredAt.toISOString(),
    });
    if ((index === 0 && (event.action !== "GENESIS" || event.previousHash !== null)) || event.previousHash !== previousHash || event.eventHash !== expected) {
      return { status: "CHAIN_BROKEN" as const, brokenEventId: event.id, checkedEvents: index + 1 };
    }
    previousHash = event.eventHash;
  }
  return { status: "CHAIN_VALID" as const, checkedEvents: events.length };
}

/** Lawyer-scoped audit stream. No admin bypass and no cross-lawyer access. */
export async function listNeutralAuditEventsForLawyer(lawyerId: string) {
  const [clientRows, matterRows, documentRows] = await Promise.all([
    db.select({ id: lawyerClientsTable.clientId }).from(lawyerClientsTable).where(eq(lawyerClientsTable.lawyerId, lawyerId)),
    db.select({ id: neutralMattersTable.id }).from(neutralMattersTable).where(eq(neutralMattersTable.lawyerId, lawyerId)),
    db.select({ id: neutralDocumentsTable.id }).from(neutralDocumentsTable).where(eq(neutralDocumentsTable.lawyerId, lawyerId)),
  ]);
  const clientIds = clientRows.map((row) => row.id);
  const matterIds = matterRows.map((row) => row.id);
  const documentIds = documentRows.map((row) => row.id);
  const ownershipPredicates = [
    eq(neutralAuditEventsTable.actorUserId, lawyerId),
    clientIds.length ? and(eq(neutralAuditEventsTable.resourceType, "client"), inArray(neutralAuditEventsTable.resourceId, clientIds)) : undefined,
    matterIds.length ? and(eq(neutralAuditEventsTable.resourceType, "matter"), inArray(neutralAuditEventsTable.resourceId, matterIds)) : undefined,
    documentIds.length ? and(eq(neutralAuditEventsTable.resourceType, "document"), inArray(neutralAuditEventsTable.resourceId, documentIds)) : undefined,
  ].filter((predicate): predicate is Exclude<typeof predicate, undefined> => Boolean(predicate));
  return db.select().from(neutralAuditEventsTable).where(or(...ownershipPredicates))
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

export async function exportNeutralLawyerData(lawyerId: string): Promise<NeutralLawyerExport> {
  const [lawyer] = await db.select({ id: usersTable.id, role: usersTable.role, accountStatus: usersTable.accountStatus, deletedAt: usersTable.deletedAt }).from(usersTable).where(eq(usersTable.id, lawyerId)).limit(1);
  if (!lawyer || lawyer.role !== "lawyer" || lawyer.accountStatus !== "active" || lawyer.deletedAt !== null) throw new Error("LAWYER_EXPORT_NOT_AUTHORIZED");
  const clients = await db.select({ id: usersTable.id, role: usersTable.role, accountStatus: usersTable.accountStatus }).from(usersTable)
    .innerJoin(lawyerClientsTable, eq(lawyerClientsTable.clientId, usersTable.id)).where(and(eq(lawyerClientsTable.lawyerId, lawyerId), eq(lawyerClientsTable.status, "active")));
  const matters = await db.select({ id: neutralMattersTable.id, clientId: neutralMattersTable.clientId, title: neutralMattersTable.title, status: neutralMattersTable.status }).from(neutralMattersTable).where(eq(neutralMattersTable.lawyerId, lawyerId));
  const documents = await db.select({ id: neutralDocumentsTable.id, matterId: neutralDocumentsTable.matterId, title: neutralDocumentsTable.title, storageKey: neutralDocumentsTable.storageKey, contentHash: neutralDocumentsTable.contentHash, status: neutralDocumentsTable.status }).from(neutralDocumentsTable).where(eq(neutralDocumentsTable.lawyerId, lawyerId));
  const documentIds = documents.map((document) => document.id);
  const documentShares = documentIds.length === 0 ? [] : await db.select({ id: neutralDocumentSharesTable.id, documentId: neutralDocumentSharesTable.documentId, clientId: neutralDocumentSharesTable.clientId, status: neutralDocumentSharesTable.status, createdAt: neutralDocumentSharesTable.createdAt, revokedAt: neutralDocumentSharesTable.revokedAt }).from(neutralDocumentSharesTable).innerJoin(neutralDocumentsTable, eq(neutralDocumentsTable.id, neutralDocumentSharesTable.documentId)).where(eq(neutralDocumentsTable.lawyerId, lawyerId));
  const audit = await listNeutralAuditEventsForLawyer(lawyerId);
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), lawyer: { id: lawyer.id, role: "lawyer" }, clients, matters, documents, documentShares, audit };
}
