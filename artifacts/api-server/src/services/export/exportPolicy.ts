import type { ExportAuthorization, ExportRequest, ExportResource } from "./exportTypes";

const CLIENT_ALLOWED_RESOURCES = new Set<ExportResource>([
  "case",
  "hearing",
  "decision",
  "document",
  "client_file",
]);

const LAWYER_ALLOWED_RESOURCES = new Set<ExportResource>([
  "case",
  "hearing",
  "decision",
  "document",
  "client_file",
]);

const ADMIN_ALLOWED_RESOURCES = new Set<ExportResource>([
  "case",
  "hearing",
  "decision",
  "document",
  "client_file",
]);

const roleResources = (role: ExportAuthorization["actor"]["role"]) => {
  switch (role) {
    case "client":
      return CLIENT_ALLOWED_RESOURCES;
    case "lawyer":
      return LAWYER_ALLOWED_RESOURCES;
    case "admin":
      return ADMIN_ALLOWED_RESOURCES;
  }
};

/**
 * Server-side export authorization boundary.
 *
 * This function consumes relationship facts already resolved by a trusted
 * domain/auth layer. It never queries a database and never trusts the resource
 * identifier as proof of ownership.
 */
export const authorizeExport = (
  request: ExportRequest,
  authorization: ExportAuthorization,
): void => {
  if (!authorization.actor.userId) throw new Error("UNAUTHORIZED");
  if (!request.resourceId) throw new Error("EXPORT_RESOURCE_ID_REQUIRED");
  if (!roleResources(authorization.actor.role).has(request.resource)) {
    throw new Error("EXPORT_RESOURCE_FORBIDDEN");
  }

  if (authorization.actor.role !== "admin") {
    if (!authorization.resourceOwnerVerified && !authorization.membershipVerified) {
      throw new Error("FORBIDDEN");
    }
  }

  if (request.scope === "full" && authorization.actor.role === "client") {
    throw new Error("EXPORT_FULL_SCOPE_FORBIDDEN");
  }
};
