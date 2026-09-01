/**
 * P3.1 Neutral Lawyer OS contracts.
 *
 * These types intentionally contain no financial, marketplace, settlement,
 * wallet, escrow, or client-fund authority. They describe ownership and
 * scope contracts for the Neutral Core only.
 */

export type LawyerId = string & { readonly __brand: "LawyerId" };
export type ClientId = string & { readonly __brand: "ClientId" };
export type MatterId = string & { readonly __brand: "MatterId" };
export type DocumentId = string & { readonly __brand: "DocumentId" };

export type LawyerOsRole = "lawyer" | "client" | "admin";

export type ResourceScope =
  | { kind: "lawyer"; lawyerId: LawyerId }
  | { kind: "client"; clientId: ClientId }
  | { kind: "matter"; matterId: MatterId; lawyerId: LawyerId };

export type NeutralMatterStatus = "active" | "completed" | "archived";

export type NeutralMatter = {
  id: MatterId;
  lawyerId: LawyerId;
  clientId: ClientId;
  title: string;
  status: NeutralMatterStatus;
};

export type NeutralDocument = {
  id: DocumentId;
  lawyerId: LawyerId;
  matterId: MatterId | null;
  title: string;
  storageKey: string;
  contentHash: string | null;
};

export type LawyerOsAuditAction =
  | "read"
  | "create"
  | "update"
  | "archive"
  | "share"
  | "export";

export type LawyerOsAuditEvent = {
  actorUserId: string;
  actorRole: LawyerOsRole;
  action: LawyerOsAuditAction;
  resourceType: "client" | "matter" | "document" | "schedule" | "message";
  resourceId: string;
  occurredAt: Date;
};

export type LawyerOsExportRequest = {
  actorUserId: LawyerId;
  lawyerId: LawyerId;
  include: Array<"clients" | "matters" | "documents" | "schedule" | "messages" | "audit">;
};

/**
 * P3.1 invariant: Neutral Core authorization is ownership/scope based.
 * Callers must resolve the authenticated actor on the server before using it.
 */
export type NeutralAuthorizationContext = {
  actorUserId: string;
  actorRole: LawyerOsRole;
  scope: ResourceScope;
};
