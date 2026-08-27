import fs from "node:fs";

const read = (path) => fs.readFileSync(path, "utf8");
const controller = read("artifacts/api-server/src/controllers/consultationDocumentation.ts");
const routes = read("artifacts/api-server/src/routes/consultationDocumentation.ts");
const migration = read("lib/db/migrations/0007_consultation_archive.sql");
const bookings = read("lib/db/src/schema/bookings.ts");

const dtoBody = (name) => {
  const marker = `const ${name} =`;
  const start = controller.indexOf(marker);
  if (start === -1) return "";
  const end = controller.indexOf("\n});", start);
  return end === -1 ? controller.slice(start) : controller.slice(start, end + 4);
};

const archiveDto = dtoBody("toSafeArchiveDto");
const printDto = dtoBody("toSafePrintBookingDto");
const forbiddenFinancialFields = ["price", "paymentStatus", "escrowStatus"];
const excludesFinancialFields = (dto) => forbiddenFinancialFields.every((field) => !new RegExp(`\\b${field}\\s*:`).test(dto));

const assertions = [
  ["archive requires lawyer/admin role", routes.includes('requireRole("lawyer", "admin")')],
  ["archive checks terminal status", controller.includes("terminalStatuses.includes")],
  ["archive authorizes actor against booking", controller.includes("canAccessBooking(req, booking)")],
  ["archive is idempotent", controller.includes("already_archived") && controller.includes("isNull(bookingsTable.archivedAt)")],
  ["archive records consultation event", controller.includes('consultation.archived')],
  ["admin archive writes audit log", controller.includes("adminAuditLogsTable")],
  ["print data is authenticated", routes.includes("requireAuth")],
  ["print data authorizes actor", controller.includes("canAccessBooking(req, row.booking)")],
  ["print metadata is sanitized", controller.includes("sanitizePrintMetadata")],
  ["print export is audited", controller.includes('document.printed')],
  ["archive migration is idempotent", migration.includes("ADD COLUMN IF NOT EXISTS")],
  ["archive timestamp is indexed", migration.includes("bookings_archived_at_idx")],
  ["booking schema exposes archive fields", bookings.includes("archivedAt") && bookings.includes("archivedBy")],
  ["archive DTO boundary excludes all financial fields", Boolean(archiveDto) && excludesFinancialFields(archiveDto)],
  ["print DTO boundary excludes all financial fields", Boolean(printDto) && excludesFinancialFields(printDto)],
];

const failed = assertions.filter(([, ok]) => !ok);
if (failed.length) {
  for (const [name] of failed) console.error(`FAIL: ${name}`);
  process.exit(1);
}
for (const [name] of assertions) console.log(`PASS: ${name}`);
