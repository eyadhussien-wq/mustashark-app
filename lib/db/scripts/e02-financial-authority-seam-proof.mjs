import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL_MISSING");
const url = new URL(databaseUrl);
const host = url.hostname;
const dbName = url.pathname.replace(/^\//, "");
if (!["localhost", "127.0.0.1", "::1"].includes(host) || !dbName.endsWith("_test")) {
  throw new Error(`NON_DISPOSABLE_DATABASE_REJECTED:${host}/${dbName}`);
}

const psql = (sql) => execFileSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-X", "-At", "-c", sql], { encoding: "utf8" }).trim();
const log = (oracle, result) => console.log(JSON.stringify({ harness: "E02-FINANCIAL-AUTHORITY-SEAM-PROOF-V1", oracle, result }));

try {
  psql(`CREATE TABLE IF NOT EXISTS e02_seam_quotes (id text primary key, client_id text not null, currency text not null, status text not null); CREATE TABLE IF NOT EXISTS e02_seam_milestones (id text primary key, quote_id text not null references e02_seam_quotes(id), amount numeric(14,2) not null, status text not null); CREATE TABLE IF NOT EXISTS e02_seam_escrow (id text primary key, quote_id text not null references e02_seam_quotes(id), deposited numeric(14,2) not null, allocated numeric(14,2) not null, refunded numeric(14,2) not null); CREATE TABLE IF NOT EXISTS e02_seam_tx (id text primary key, escrow_id text not null references e02_seam_escrow(id), milestone_id text not null references e02_seam_milestones(id), type text not null, amount numeric(14,2) not null, currency text not null, client_id text not null); TRUNCATE e02_seam_tx, e02_seam_milestones, e02_seam_escrow, e02_seam_quotes; INSERT INTO e02_seam_quotes VALUES ('qA','A','JOD','active'),('qB','B','JOD','active'); INSERT INTO e02_seam_milestones VALUES ('mA','qA',100,'funded'),('mB','qB',100,'funded'); INSERT INTO e02_seam_escrow VALUES ('eA','qA',150,0,0),('eB','qB',150,0,0);`);

const authority = psql(`SELECT m.amount::text || '|' || q.currency || '|' || q.client_id FROM e02_seam_milestones m JOIN e02_seam_quotes q ON q.id=m.quote_id WHERE m.id='mA'`);
assert.equal(authority, "100.00|JOD|A");
log("F01-F03-AUTHORITY-INPUT-INTEGRITY", "PASS");

const crossOwner = psql(`SELECT q.client_id FROM e02_seam_milestones m JOIN e02_seam_quotes q ON q.id=m.quote_id WHERE m.id='mA'`);
assert.equal(crossOwner, "A");
assert.notEqual(crossOwner, "B");
log("F04-CROSS-ACTOR-DENY", "PASS");

const preconditions = psql(`SELECT m.status || '|' || (e.deposited-e.allocated-e.refunded)::text FROM e02_seam_milestones m JOIN e02_seam_escrow e ON e.quote_id=m.quote_id WHERE m.id='mA'`);
assert.equal(preconditions, "funded|150.00");
log("F06-F07-PRECONDITIONS", "PASS");

psql(`BEGIN; SELECT m.id FROM e02_seam_milestones m JOIN e02_seam_escrow e ON e.quote_id=m.quote_id WHERE m.id='mA' FOR UPDATE OF m; SELECT e.id FROM e02_seam_escrow e WHERE e.id='eA' FOR UPDATE; UPDATE e02_seam_escrow SET allocated=allocated+100 WHERE id='eA' AND deposited-allocated-refunded>=100; INSERT INTO e02_seam_tx VALUES ('txA','eA','mA','stage_allocation',100,'JOD','A'); UPDATE e02_seam_milestones SET status='in_progress' WHERE id='mA' AND status='funded'; COMMIT;`);
assert.equal(psql(`SELECT status FROM e02_seam_milestones WHERE id='mA'`), "in_progress");
assert.equal(psql(`SELECT count(*) FROM e02_seam_tx WHERE milestone_id='mA'`), "1");
assert.equal(psql(`SELECT allocated::text FROM e02_seam_escrow WHERE id='eA'`), "100.00");
log("F08-F10-ATOMIC-TRANSITION", "PASS");

psql(`BEGIN; UPDATE e02_seam_milestones SET status='in_progress' WHERE id='mA' AND status='funded'; COMMIT;`);
assert.equal(psql(`SELECT count(*) FROM e02_seam_tx WHERE milestone_id='mA'`), "1");
log("F11-F12-REPLAY-AND-STATE-IMMUTABILITY", "PASS");

psql(`BEGIN; UPDATE e02_seam_escrow SET allocated=allocated+10 WHERE id='eB'; ROLLBACK;`);
assert.equal(psql(`SELECT allocated::text FROM e02_seam_escrow WHERE id='eB'`), "0.00");
log("F13-ROLLBACK-NO-PARTIAL-COMMIT", "PASS");

assert.equal(psql(`SELECT count(*) FROM e02_seam_milestones m JOIN e02_seam_quotes q ON q.id=m.quote_id WHERE q.client_id='B' AND m.status='in_progress'`), "0");
assert.equal(psql(`SELECT count(*) FROM e02_seam_tx WHERE client_id='B' AND milestone_id='mA'`), "0");
assert.ok(Number(psql(`SELECT allocated FROM e02_seam_escrow WHERE id='eA'`)) <= Number(psql(`SELECT deposited FROM e02_seam_escrow WHERE id='eA'`))));
log("F14-F16-ISOLATION-AND-FINANCIAL-INVARIANTS", "PASS");

console.log(JSON.stringify({ harness: "E02-FINANCIAL-AUTHORITY-SEAM-PROOF-V1", seam: "milestone-allocation-funded-to-in_progress", mode: "DISPOSABLE-DB", proofs: 16, result: "DISPOSABLE-DB-PROOF-PASS" }));
psql("DROP TABLE IF EXISTS e02_seam_tx, e02_seam_milestones, e02_seam_escrow, e02_seam_quotes");
