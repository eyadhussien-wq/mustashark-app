import { authorizeExport } from "./exportPolicy";
import { redactRecords } from "./redactionPolicy";
import { renderPrintableHtml } from "./printRenderer";
import type {
  ExportAuthorization,
  ExportRequest,
  ExportSnapshot,
  PreparedExport,
} from "./exportTypes";

/**
 * Unified P0 export boundary for cases, hearings, decisions, documents and
 * client files. The caller supplies an already-authorized domain snapshot.
 * This service has no database imports and no persistence side effects.
 */
export const prepareExport = (
  request: ExportRequest,
  authorization: ExportAuthorization,
  snapshot: ExportSnapshot,
): PreparedExport => {
  authorizeExport(request, authorization);

  if (snapshot.resource !== request.resource || snapshot.resourceId !== request.resourceId) {
    throw new Error("EXPORT_SNAPSHOT_MISMATCH");
  }

  const scope = request.scope ?? "summary";
  const records = redactRecords(snapshot.records, authorization.actor.role, scope);

  if (request.format !== "print" && request.format !== "html") {
    throw new Error("EXPORT_FORMAT_UNSUPPORTED");
  }

  return {
    resource: request.resource,
    resourceId: request.resourceId,
    format: request.format,
    title: snapshot.title,
    body: renderPrintableHtml(snapshot.title, records),
    contentType: "text/html; charset=utf-8",
    persisted: false,
  };
};
