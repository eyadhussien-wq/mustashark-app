import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import {
  buildNeutralAuditEventHash,
  recordNeutralAuditEvent,
  verifyNeutralAuditChain,
} from "./neutralAudit";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required for neutral audit chain tests`);
  return value;
}

const databaseUrl = requireEnv("DATABASE_URL");
const lawyerId = "ci-audit-lawyer";

const parsedDatabaseUrl = new URL(databaseUrl);
if (parsedDatabaseUrl.hostname !== "localhost" && parsedDatabaseUrl.hostname !== "127.0.0.1") {
  throw new Error("Neutral audit chain tests require a localhost-only database target");
}
if (!/(^|[-_])(test|ephemeral)([-_]|$)/i.test(parsedDatabaseUrl.pathname.replace(/^\//, ""))) {
  throw new Error("Neutral audit chain tests require an explicitly test/ephemeral database name");
}

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function psql(query: string) {
  return execFileSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-At", "-c", query], { encoding: "utf8" }).trim();
}

function readLatestEvent() {
  const row = psql(`SELECT id, event_hash, previous_hash FROM neutral_audit_events WHERE actor_user_id = ${sqlLiteral(lawyerId)} ORDER BY occurred_at DESC, id DESC LIMIT 1;`);
  const [id, eventHash, previousHash] = row.split("|");
  assert.ok(id && eventHash, "expected an audit event");
  return { id, eventHash, previousHash: previousHash || null };
}

test("audit chain is valid before tampering", async () => {
  await recordNeutralAuditEvent({
    actorUserId: lawyerId,
    actorRole: "lawyer",
    action: "DOCUMENT_READ",
    resourceType: "document",
    resourceId: "ci-audit-document",
    outcome: "allowed",
    metadata: { test: true },
  });

  const result = await verifyNeutralAuditChain(lawyerId);
  assert.equal(result.status, "CHAIN_VALID");
  assert.ok(result.checkedEvents >= 2);
});

test("database immutability blocks a direct historical mutation", () => {
  const event = readLatestEvent();
  assert.throws(
    () => psql(`UPDATE neutral_audit_events SET event_hash = ${sqlLiteral("tampered")} WHERE id = ${sqlLiteral(event.id)};`),
    /neutral_audit_events is immutable/,
  );
  assert.equal(readLatestEvent().eventHash, event.eventHash);
});

test("verifier detects a broken historical hash in an isolated tamper simulation", async () => {
  const event = readLatestEvent();
  const originalTriggerState = psql("SELECT count(*) FROM pg_trigger WHERE tgname = 'neutral_audit_events_immutable_trigger' AND tgenabled = 'O';");
  assert.equal(originalTriggerState, "1");

  psql("ALTER TABLE neutral_audit_events DISABLE TRIGGER neutral_audit_events_immutable_trigger;");
  try {
    psql(`UPDATE neutral_audit_events SET event_hash = ${sqlLiteral("tampered-hash")} WHERE id = ${sqlLiteral(event.id)};`);
    const result = await verifyNeutralAuditChain(lawyerId);
    assert.equal(result.status, "CHAIN_BROKEN");
    assert.equal(result.brokenEventId, event.id);
  } finally {
    psql("ALTER TABLE neutral_audit_events ENABLE TRIGGER neutral_audit_events_immutable_trigger;");
  }
});

test("event hash is deterministic for identical canonical payloads", () => {
  const input = {
    id: "deterministic-id",
    actorUserId: lawyerId,
    actorRole: "lawyer",
    action: "DOCUMENT_READ",
    resourceType: "document",
    resourceId: "ci-audit-document",
    outcome: "allowed",
    reasonCode: null,
    correlationId: null,
    metadata: { z: true, a: "stable" },
    chainVersion: "1",
    canonicalizationVersion: "1",
    genesisHash: "genesis",
    previousHash: "previous",
    occurredAt: "2026-09-02T00:00:00.000Z",
  };
  assert.equal(buildNeutralAuditEventHash(input), buildNeutralAuditEventHash({ ...input }));
});

console.log("NEUTRAL AUDIT CHAIN VERIFICATION SMOKE TESTS PASSED");
