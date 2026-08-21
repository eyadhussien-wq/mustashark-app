export type ExportActorRole = "client" | "lawyer" | "admin";

export type ExportResource =
  | "case"
  | "hearing"
  | "decision"
  | "document"
  | "client_file";

export type ExportFormat = "print" | "html";

export type ExportScope = "summary" | "full";

export type ExportActor = {
  userId: string;
  role: ExportActorRole;
};

/** Trusted relationship facts must be resolved by the caller's auth/domain layer. */
export type ExportAuthorization = {
  actor: ExportActor;
  resourceOwnerVerified: boolean;
  membershipVerified: boolean;
};

export type ExportRecord = {
  label: string;
  value: string | null | undefined;
  sensitive?: boolean;
  clientVisible?: boolean;
};

export type ExportSnapshot = {
  resource: ExportResource;
  resourceId: string;
  title: string;
  records: readonly ExportRecord[];
};

export type ExportRequest = {
  resource: ExportResource;
  resourceId: string;
  format: ExportFormat;
  scope?: ExportScope;
};

export type PreparedExport = {
  resource: ExportResource;
  resourceId: string;
  format: ExportFormat;
  title: string;
  body: string;
  contentType: "text/html; charset=utf-8";
  persisted: false;
};
