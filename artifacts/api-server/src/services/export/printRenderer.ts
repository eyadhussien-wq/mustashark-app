import type { ExportRecord } from "./exportTypes";

const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

export const renderPrintableHtml = (
  title: string,
  records: readonly ExportRecord[],
): string => {
  const rows = records
    .map(
      (record) =>
        `<tr><th scope="row">${escapeHtml(record.label)}</th><td>${escapeHtml(record.value ?? "")}</td></tr>`,
    )
    .join("");

  return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><style>body{font-family:Arial,sans-serif;margin:32px;color:#111}h1{margin-bottom:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:10px;text-align:right;vertical-align:top}th{width:30%}@media print{body{margin:12mm}}</style></head><body><h1>${escapeHtml(title)}</h1><table><tbody>${rows}</tbody></table></body></html>`;
};
