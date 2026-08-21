import type { ExportActorRole, ExportRecord, ExportScope } from "./exportTypes";

/**
 * Redaction is performed server-side before rendering. UI visibility is never
 * treated as a security boundary.
 */
export const redactRecords = (
  records: readonly ExportRecord[],
  role: ExportActorRole,
  scope: ExportScope,
): ExportRecord[] => {
  return records
    .filter((record) => {
      if (record.clientVisible === false && role === "client") return false;
      if (record.sensitive && role === "client") return false;
      if (scope === "summary" && record.sensitive) return false;
      return true;
    })
    .map((record) => ({
      ...record,
      value: record.value == null ? "" : String(record.value),
    }));
};
