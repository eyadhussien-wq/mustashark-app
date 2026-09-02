import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import {
  buildNeutralAuditEventHash,
  recordNeutralAuditCompensatingEntry,
  recordNeutralAuditEvent,
  verifyNeutralAuditChain,
  verifyNeutralAuditChainWithAlert,
} from "./neutralAudit";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for neutral audit chain tests`);
  return value;
}

const databaseUrl = requireEnv("DATABASE_URL");
const lawyerId = "ci-audit-lawyer";
const parsedDatabaseUrl = new URL(databaseUrl);
if (parsedDatabaseUrl.hostname !== "localhost" && parsedDatabaseUrl.hostname !== "127.0.0.1") throw new Error("Neutral audit chain tests require a localhost-only database target");
if (!/(^|[-_])(test|ephemeral)([-_]|$)/i.test(parsedDatabaseUrl.pathname.replace(/^\//, ""))) throw new Error("Neutral audit chain tests require an explicitly test/ephemeral database name");
function sqlLiteral(value: string) { return `'${value.replaceAll("'", "''")}'`; }
function psql(query: string) { return execFileSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-At", "-c", query], { encoding: "utf8" }).trim(); }
function readEvents() {
  const rows = psql(`SELECT id, action, target_event_id, event_hash, previous_hash FROM neutral_audit_events WHERE actor_user_id = ${sqlLiteral(lawyerId)} ORDER BY occurred_at ASC, id ASC;`);
  return rows.split("\n").filter(Boolean).map((row) => { const [id, action, targetEventId, eventHash, previousHash] = row.split("|"); return { id, action, targetEventId: targetEventId || null, eventHash, previousHash: previousHash || null }; });
}
function readLatestEvent() { const event = readEvents().at(-1); assert.ok(event, "expected an audit event"); return event; }

test("audit chain is valid before tampering", async () => {
  const event = await recordNeutralAuditEvent({ actorUserId: lawyerId, actorRole: "lawyer", action: "DOCUMENT_READ", resourceType: "document", resourceId: "ci-audit-document", outcome: "allowed", metadata: { test: true, nested: { z: 1, a: "stable" } } });
  const result = await verifyNeutralAuditChain(lawyerId);
  assert.equal(result.status, "CHAIN_VALID"); assert.ok(result.checkedEvents >= 2); assert.equal(event.targetEventId, null);
});

test("database immutability blocks a direct historical mutation", () => {
  const event = readLatestEvent();
  assert.throws(() => psql(`UPDATE neutral_audit_events SET event_hash = ${sqlLiteral("tampered")} WHERE id = ${sqlLiteral(event.id)};`), /neutral_audit_events is immutable/);
  assert.equal(readLatestEvent().eventHash, event.eventHash);
});

test("compensating entry appends without rewriting the historical event", async () => {
  const original = readLatestEvent();
  const correction = await recordNeutralAuditCompensatingEntry({ actorUserId: lawyerId, actorRole: "lawyer", targetEventId: original.id, resourceType: "document", resourceId: "ci-audit-document", reasonCode: "CORRECTION_NOTE", metadata: { explanation: "historical event remains unchanged" } });
  assert.equal(correction.action, "AUDIT_CORRECTION_NOTED"); assert.equal(correction.targetEventId, original.id);
  assert.equal((correction.metadata as Record<string, unknown>).correctionSemantics, "historical_event_unchanged");
  const persistedOriginal = readEvents().find((event) => event.id === original.id);
  assert.equal(persistedOriginal?.eventHash, original.eventHash); assert.equal(readLatestEvent().id, correction.id);
  assert.equal((await verifyNeutralAuditChain(lawyerId)).status, "CHAIN_VALID");
});

test("compensating entry cannot target another lawyer's audit event", async () => {
  const otherLawyerId = "ci-audit-lawyer-other";
  psql(`INSERT INTO users (id, name, email, role, auth_provider, account_status, litigation_tier, created_at, updated_at) VALUES (${sqlLiteral(otherLawyerId)}, 'Other Audit Lawyer', 'other-audit-lawyer@mustashark.com', 'lawyer', 'local', 'active', 'general', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;`);
  const foreignEvent = await recordNeutralAuditEvent({ actorUserId: otherLawyerId, actorRole: "lawyer", action: "DOCUMENT_READ", resourceType: "document", resourceId: "foreign-document", outcome: "allowed" });
  await assert.rejects(() => recordNeutralAuditCompensatingEntry({ actorUserId: lawyerId, actorRole: "lawyer", targetEventId: foreignEvent.id, resourceType: "document", resourceId: "foreign-document", reasonCode: "CROSS_ACTOR_COMPENSATION" }), /AUDIT_COMPENSATION_TARGET_NOT_FOUND/);
});

test("verifier detects a broken historical hash in an isolated tamper simulation", async () => {
  const event = readLatestEvent();
  assert.equal(psql("SELECT count(*) FROM pg_trigger WHERE tgname = 'neutral_audit_events_immutable_trigger' AND tgenabled = 'O';"), "1");
  psql("ALTER TABLE neutral_audit_events DISABLE TRIGGER neutral_audit_events_immutable_trigger;");
  try { psql(`UPDATE neutral_audit_events SET event_hash = ${sqlLiteral("tampered-hash")} WHERE id = ${sqlLiteral(event.id)};`); const result = await verifyNeutralAuditChain(lawyerId); assert.equal(result.status, "CHAIN_BROKEN"); assert.equal(result.brokenEventId, event.id); }
  finally { psql("ALTER TABLE neutral_audit_events ENABLE TRIGGER neutral_audit_events_immutable_trigger;"); }
});

test("integrity hook emits a durable security alert and does not auto-isolate", async () => {
  const event = readLatestEvent(); psql("ALTER TABLE neutral_audit_events DISABLE TRIGGER neutral_audit_events_immutable_trigger;");
  try {
    psql(`UPDATE neutral_audit_events SET event_hash = ${sqlLiteral("tampered-for-alert")} WHERE id = ${sqlLiteral(event.id)};`);
    const result = await verifyNeutralAuditChainWithAlert(lawyerId, "ci-integrity-correlation");
    assert.equal(result.status, "CHAIN_BROKEN"); assert.equal(result.securitySignal, "SECURITY_INTEGRITY_VIOLATION"); assert.equal(result.isolationPolicy, "REVIEW_AND_CONTROLLED_ISOLATION"); assert.ok(result.alertId);
    const alert = psql(`SELECT alert_type, severity, status, reason_code, correlation_id FROM neutral_security_alerts WHERE id = ${sqlLiteral(result.alertId)};`);
    assert.equal(alert, "SECURITY_INTEGRITY_VIOLATION|critical|open|NEUTRAL_AUDIT_CHAIN_BROKEN|ci-integrity-correlation");
  } finally { psql("ALTER TABLE neutral_audit_events ENABLE TRIGGER neutral_audit_events_immutable_trigger;"); }
});

test("previousHash tampering is detected as the first broken event", async () => {
  const cleanActorId = "ci-audit-previous-hash";
  psql(`INSERT INTO users (id, name, email, role, auth_provider, account_status, litigation_tier, created_at, updated_at) VALUES (${sqlLiteral(cleanActorId)}, 'Previous Hash Lawyer', 'previous-hash@mustashark.com', 'lawyer', 'local', 'active', 'general', NOW(), NOW()) ON CONFLICT (id) DO NOTHING;`);
  const first = await recordNeutralAuditEvent({ actorUserId: cleanActorId, actorRole: "lawyer", action: "DOCUMENT_READ", resourceType: "document", resourceId: "previous-hash-document", outcome: "allowed" });
  const second = await recordNeutralAuditEvent({ actorUserId: cleanActorId, actorRole: "lawyer", action: "DOCUMENT_READ", resourceType: "document", resourceId: "previous-hash-document", outcome: "allowed" });
  assert.equal((await verifyNeutralAuditChain(cleanActorId)).status, "CHAIN_VALID");
  psql("ALTER TABLE neutral_audit_events DISABLE TRIGGER neutral_audit_events_immutable_trigger;");
  try { psql(`UPDATE neutral_audit_events SET previous_hash = ${sqlLiteral("tampered-previous-hash")} WHERE id = ${sqlLiteral(second.id)};`); const result = await verifyNeutralAuditChain(cleanActorId); assert.equal(result.status, "CHAIN_BROKEN"); assert.equal(result.brokenEventId, second.id); assert.notEqual(result.brokenEventId, first.id); }
  finally { psql("ALTER TABLE neutral_audit_events ENABLE TRIGGER neutral_audit_events_immutable_trigger;"); }
});

test("event hash is deterministic for identical canonical payloads", () => {
  const input = { id: "deterministic-id", actorUserId: lawyerId, actorRole: "lawyer", action: "DOCUMENT_READ", resourceType: "document", resourceId: "ci-audit-document", outcome: "allowed", reasonCode: null, correlationId: null, metadata: { z: true, nested: { b: 2, a: 1 }, a: "stable" }, targetEventId: null, chainVersion: "1", canonicalizationVersion: "1", genesisHash: "genesis", previousHash: "previous", occurredAt: "2026-09-02T00:00:00.000Z" };
  assert.equal(buildNeutralAuditEventHash(input), buildNeutralAuditEventHash({ ...input }));
});

console.log("NEUTRAL AUDIT COMPENSATING + INTEGRITY ALERT SMOKE TESTS PASSED");
