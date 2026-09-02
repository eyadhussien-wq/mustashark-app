import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  neutralDocumentSharesTable,
  neutralDocumentsTable,
  neutralMattersTable,
  usersTable,
} from "@workspace/db/schema";
import { ensureLawyerClientOwnership, LawyerClientOwnershipError } from "./lawyerClientOwnership";
import { recordNeutralAuthorizationDenied } from "./neutralAuthorizationAudit";

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
      | "ADMIN_ACCESS_DENIED"
      | "AUTHORIZATION_AUDIT_FAILURE",
  ) {
    super(code);
  }
}

export type NeutralDocumentClientAccessState = {
  clientActive: boolean;
  relationshipActive: boolean;
  shareActive: boolean;
  documentStatus: "draft" | "active" | "archived";
  matterMatchesClientAndLawyer: boolean;
};

/** Pure policy gate used by the DB-backed service and contract tests. */
export function assertNeutralDocumentClientAccess(state: NeutralDocumentClientAccessState): void {
  if (!state.clientActive) throw new NeutralDocumentAuthorizationError("CLIENT_NOT_ACTIVE");
  if (!state.relationshipActive) throw new NeutralDocumentAuthorizationError("RELATIONSHIP_NOT_ACTIVE");
  if (!state.shareActive) throw new NeutralDocumentAuthorizationError("SHARE_NOT_ACTIVE");
  if (state.documentStatus === "archived") throw new NeutralDocumentAuthorizationError("DOCUMENT_NOT_ACCESSIBLE");
  if (!state.matterMatchesClientAndLawyer) {
    throw new NeutralDocumentAuthorizationError("DOCUMENT_NOT_ACCESSIBLE");
  }
}

async function denyDocumentAuthorization(input: {
  actorUserId: string;
  actorRole: NeutralDocumentActorRole;
  documentId: string;
  reasonCode: string;
  errorCode: NeutralDocumentAuthorizationError["code"];
  correlationId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<never> {
  try {
    await recordNeutralAuthorizationDenied({
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      action: "read",
      resourceType: "document",
      resourceId: input.documentId,
      reasonCode: input.reasonCode,
      correlationId: input.correlationId ?? null,
      metadata: input.metadata ?? null,
    });
  } catch (error) {
    console.error("Neutral authorization denial audit failure:", error);
    throw new NeutralDocumentAuthorizationError("AUTHORIZATION_AUDIT_FAILURE");
  }
  throw new NeutralDocumentAuthorizationError(input.errorCode);
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

  if (!document) {
    return denyDocumentAuthorization({
      actorUserId: lawyerId,
      actorRole: "lawyer",
      documentId,
      reasonCode: "RESOURCE_NOT_ACCESSIBLE",
      errorCode: "DOCUMENT_NOT_FOUND",
    });
  }

  if (document.matterId) {
    const [matter] = await db
      .select({ id: neutralMattersTable.id, lawyerId: neutralMattersTable.lawyerId, status: neutralMattersTable.status })
      .from(neutralMattersTable)
      .where(eq(neutralMattersTable.id, document.matterId))
      .limit(1);
    if (!matter || matter.lawyerId !== lawyerId) {
      return denyDocumentAuthorization({
        actorUserId: lawyerId,
        actorRole: "lawyer",
        documentId,
        reasonCode: "RESOURCE_MATTER_SCOPE_MISMATCH",
        errorCode: "MATTER_NOT_OWNED",
      });
    }
    if (matter.status === "archived") {
      return denyDocumentAuthorization({
        actorUserId: lawyerId,
        actorRole: "lawyer",
        documentId,
        reasonCode: "MATTER_ARCHIVED",
        errorCode: "DOCUMENT_NOT_ACCESSIBLE",
      });
    }
  }

  return document;
}

/** Lawyer-side authorization is ownership based and resolved server-side. */
export async function getNeutralDocumentForLawyer(lawyerId: string, documentId: string) {
  return requireLawyerOwnedDocument(lawyerId, documentId);
}

/** Client-side authorization requires active identity, active relationship, explicit share, and matching matter scope. */
export async function getNeutralDocumentForClient(clientId: string, documentId: string) {
  const client = await requireActiveUser(clientId, "client");

  const [document] = await db
    .select()
    .from(neutralDocumentsTable)
    .where(eq(neutralDocumentsTable.id, documentId))
    .limit(1);
  if (!document) {
    return denyDocumentAuthorization({
      actorUserId: clientId,
      actorRole: "client",
      documentId,
      reasonCode: "RESOURCE_NOT_ACCESSIBLE",
      errorCode: "DOCUMENT_NOT_FOUND",
    });
  }

  let relationshipActive = true;
  try {
    await ensureLawyerClientOwnership(document.lawyerId, client.id);
  } catch (error) {
    if (!(error instanceof LawyerClientOwnershipError)) throw error;
    relationshipActive = false;
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

  let matterMatchesClientAndLawyer = true;
  let matterStatus: "active" | "completed" | "archived" | null = null;
  if (document.matterId) {
    const [matter] = await db
      .select({ clientId: neutralMattersTable.clientId, lawyerId: neutralMattersTable.lawyerId, status: neutralMattersTable.status })
      .from(neutralMattersTable)
      .where(eq(neutralMattersTable.id, document.matterId))
      .limit(1);
    matterStatus = matter?.status ?? null;
    matterMatchesClientAndLawyer = Boolean(
      matter && matter.clientId === clientId && matter.lawyerId === document.lawyerId,
    );
  }

  if (matterStatus === "archived") {
    return denyDocumentAuthorization({
      actorUserId: clientId,
      actorRole: "client",
      documentId,
      reasonCode: "MATTER_ARCHIVED",
      errorCode: "DOCUMENT_NOT_ACCESSIBLE",
      metadata: { matterStatus },
    });
  }

  try {
    assertNeutralDocumentClientAccess({
      clientActive: client.accountStatus === "active" && client.deletedAt === null,
      relationshipActive,
      shareActive: Boolean(share),
      documentStatus: document.status,
      matterMatchesClientAndLawyer,
    });
  } catch (error) {
    if (!(error instanceof NeutralDocumentAuthorizationError)) throw error;
    return denyDocumentAuthorization({
      actorUserId: clientId,
      actorRole: "client",
      documentId,
      reasonCode: error.code === "RELATIONSHIP_NOT_ACTIVE"
        ? "RELATIONSHIP_NOT_ACTIVE"
        : error.code === "SHARE_NOT_ACTIVE"
          ? "SHARE_NOT_ACTIVE"
          : error.code,
      errorCode: error.code,
      metadata: matterStatus ? { matterStatus } : null,
    });
  }

  return document;
}

/** Admin has no implicit confidential-document bypass in Neutral Core. */
export async function getNeutralDocumentForAdmin(adminId: string, documentId: string): Promise<never> {
  return denyDocumentAuthorization({
    actorUserId: adminId,
    actorRole: "admin",
    documentId,
    reasonCode: "ADMIN_CONFIDENTIAL_ACCESS_DENIED",
    errorCode: "ADMIN_ACCESS_DENIED",
  });
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
      .select({ id: neutralMattersTable.id, lawyerId: neutralMattersTable.lawyerId, status: neutralMattersTable.status })
      .from(neutralMattersTable)
      .where(eq(neutralMattersTable.id, input.matterId))
      .limit(1);
    if (!matter || matter.lawyerId !== input.lawyerId) {
      return denyDocumentAuthorization({
        actorUserId: input.lawyerId,
        actorRole: "lawyer",
        documentId: input.id,
        reasonCode: "RESOURCE_MATTER_SCOPE_MISMATCH",
        errorCode: "MATTER_NOT_OWNED",
      });
    }
    if (matter.status === "archived") {
      return denyDocumentAuthorization({
        actorUserId: input.lawyerId,
        actorRole: "lawyer",
        documentId: input.id,
        reasonCode: "MATTER_ARCHIVED",
        errorCode: "DOCUMENT_NOT_ACCESSIBLE",
      });
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
  try {
    await ensureLawyerClientOwnership(input.lawyerId, input.clientId);
  } catch (error) {
    if (!(error instanceof LawyerClientOwnershipError)) throw error;
    return denyDocumentAuthorization({
      actorUserId: input.lawyerId,
      actorRole: "lawyer",
      documentId: input.documentId,
      reasonCode: "RELATIONSHIP_NOT_ACTIVE",
      errorCode: "RELATIONSHIP_NOT_ACTIVE",
      metadata: { clientId: input.clientId },
    });
  }

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

  if (!share) {
    return denyDocumentAuthorization({
      actorUserId: input.lawyerId,
      actorRole: "lawyer",
      documentId: input.documentId,
      reasonCode: "SHARE_NOT_ACTIVE",
      errorCode: "SHARE_NOT_ACTIVE",
      metadata: { clientId: input.clientId },
    });
  }
  return share;
}
