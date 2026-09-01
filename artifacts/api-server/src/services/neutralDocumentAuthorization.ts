import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  neutralDocumentSharesTable,
  neutralDocumentsTable,
  neutralMattersTable,
  usersTable,
} from "@workspace/db/schema";
import { ensureLawyerClientOwnership } from "./lawyerClientOwnership";

export type NeutralDocumentActorRole = "lawyer" | "client" | "admin";

export class NeutralDocumentAuthorizationError extends Error {
  constructor(
    public readonly code:
      | "DOCUMENT_NOT_FOUND"
      | "DOCUMENT_NOT_ACCESSIBLE"
      | "LAWYER_NOT_ACTIVE"
      | "CLIENT_NOT_ACTIVE"
      | "MATTER_NOT_OWNED"
      | "RELATIONSHIP_NOT_ACTIVE"
      | "SHARE_NOT_ACTIVE"
      | "CLIENT_ROLE_REQUIRED"
      | "LAWYER_ROLE_REQUIRED"
      | "ADMIN_ACCESS_DENIED",
  ) {
    super(code);
  }
}

async function requireActiveUser(userId: string, role: "lawyer" | "client") {
  const [user] = await db
    .select({ id: usersTable.id, role: usersTable.role, accountStatus: usersTable.accountStatus, deletedAt: usersTable.deletedAt })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user || user.role !== role) {
    throw new NeutralDocumentAuthorizationError(role === "lawyer" ? "LAWYER_ROLE_REQUIRED" : "CLIENT_ROLE_REQUIRED");
  }
  if (user.accountStatus !== "active" || user.deletedAt !== null) {
    throw new NeutralDocumentAuthorizationError(role === "lawyer" ? "LAWYER_NOT_ACTIVE" : "CLIENT_NOT_ACTIVE");
  }
  return user;
}

async function requireLawyerOwnedDocument(lawyerId: string, documentId: string) {
  await requireActiveUser(lawyerId, "lawyer");

  const [document] = await db
    .select()
    .from(neutralDocumentsTable)
    .where(and(eq(neutralDocumentsTable.id, documentId), eq(neutralDocumentsTable.lawyerId, lawyerId)))
    .limit(1);

  if (!document) throw new NeutralDocumentAuthorizationError("DOCUMENT_NOT_FOUND");

  if (document.matterId) {
    const [matter] = await db
      .select({ id: neutralMattersTable.id, lawyerId: neutralMattersTable.lawyerId, status: neutralMattersTable.status })
      .from(neutralMattersTable)
      .where(eq(neutralMattersTable.id, document.matterId))
      .limit(1);
    if (!matter || matter.lawyerId !== lawyerId) {
      throw new NeutralDocumentAuthorizationError("MATTER_NOT_OWNED");
    }
  }

  return document;
}

/**
 * Lawyer-side authorization. The caller supplies only the authenticated
 * actor and resource ID; ownership is always resolved server-side.
 */
export async function getNeutralDocumentForLawyer(lawyerId: string, documentId: string) {
  return requireLawyerOwnedDocument(lawyerId, documentId);
}

/**
 * Client-side authorization requires all three boundaries:
 * active client, active Lawyer ↔ Client relationship, and an explicit active
 * document share. No documentId/clientId supplied by the client is treated as
 * proof of access.
 */
export async function getNeutralDocumentForClient(clientId: string, documentId: string) {
  await requireActiveUser(clientId, "client");

  const [document] = await db
    .select()
    .from(neutralDocumentsTable)
    .where(eq(neutralDocumentsTable.id, documentId))
    .limit(1);
  if (!document) throw new NeutralDocumentAuthorizationError("DOCUMENT_NOT_FOUND");

  try {
    await ensureLawyerClientOwnership(document.lawyerId, clientId);
  } catch {
    throw new NeutralDocumentAuthorizationError("RELATIONSHIP_NOT_ACTIVE");
  }

  const [share] = await db
    .select({ id: neutralDocumentSharesTable.id, status: neutralDocumentSharesTable.status })
    .from(neutralDocumentSharesTable)
    .where(
      and(
        eq(neutralDocumentSharesTable.documentId, documentId),
        eq(neutralDocumentSharesTable.clientId, clientId),
        eq(neutralDocumentSharesTable.status, "active"),
      ),
    )
    .limit(1);

  if (!share) throw new NeutralDocumentAuthorizationError("SHARE_NOT_ACTIVE");

  if (document.matterId) {
    const [matter] = await db
      .select({ id: neutralMattersTable.id, clientId: neutralMattersTable.clientId, lawyerId: neutralMattersTable.lawyerId })
      .from(neutralMattersTable)
      .where(eq(neutralMattersTable.id, document.matterId))
      .limit(1);
    if (!matter || matter.clientId !== clientId || matter.lawyerId !== document.lawyerId) {
      throw new NeutralDocumentAuthorizationError("DOCUMENT_NOT_ACCESSIBLE");
    }
  }

  return document;
}

/** Admin has no implicit confidential-document bypass in Neutral Core. */
export async function getNeutralDocumentForAdmin(_adminId: string, _documentId: string): Promise<never> {
  throw new NeutralDocumentAuthorizationError("ADMIN_ACCESS_DENIED");
}

/** Create is lawyer-owned and cannot be redirected by client-controlled IDs. */
export async function createNeutralDocument(input: {
  id: string;
  lawyerId: string;
  matterId?: string | null;
  title: string;
  storageKey: string;
  contentHash?: string | null;
}) {
  await requireActiveUser(input.lawyerId, "lawyer");

  if (input.matterId) {
    const [matter] = await db
      .select({ id: neutralMattersTable.id, lawyerId: neutralMattersTable.lawyerId })
      .from(neutralMattersTable)
      .where(eq(neutralMattersTable.id, input.matterId))
      .limit(1);
    if (!matter || matter.lawyerId !== input.lawyerId) {
      throw new NeutralDocumentAuthorizationError("MATTER_NOT_OWNED");
    }
  }

  const [document] = await db
    .insert(neutralDocumentsTable)
    .values({
      id: input.id,
      lawyerId: input.lawyerId,
      matterId: input.matterId ?? null,
      title: input.title,
      storageKey: input.storageKey,
      contentHash: input.contentHash ?? null,
      status: "draft",
    })
    .returning();

  return document;
}

export async function shareNeutralDocument(input: { lawyerId: string; documentId: string; clientId: string; shareId: string }) {
  const document = await requireLawyerOwnedDocument(input.lawyerId, input.documentId);
  await ensureLawyerClientOwnership(input.lawyerId, input.clientId);

  const [share] = await db
    .insert(neutralDocumentSharesTable)
    .values({ id: input.shareId, documentId: document.id, clientId: input.clientId, status: "active" })
    .returning();
  return share;
}

export async function revokeNeutralDocumentShare(input: { lawyerId: string; documentId: string; clientId: string }) {
  const document = await requireLawyerOwnedDocument(input.lawyerId, input.documentId);

  const [share] = await db
    .update(neutralDocumentSharesTable)
    .set({ status: "revoked", revokedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(neutralDocumentSharesTable.documentId, document.id),
        eq(neutralDocumentSharesTable.clientId, input.clientId),
        eq(neutralDocumentSharesTable.status, "active"),
      ),
    )
    .returning();

  if (!share) throw new NeutralDocumentAuthorizationError("SHARE_NOT_ACTIVE");
  return share;
}
