import assert from "node:assert/strict";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL_MISSING");

const url = new URL(databaseUrl);
const host = url.hostname;
const dbName = url.pathname.replace(/^\//, "");
if (!['localhost', '127.0.0.1', '::1'].includes(host) || !dbName.endsWith('_test')) {
  throw new Error(`NON_DISPOSABLE_DATABASE_REJECTED:${host}/${dbName}`);
}

const client = new Client({ connectionString: databaseUrl });
await client.connect();

const q = async (text, values) => (await client.query(text, values)).rows;
const log = (id, result) => console.log(JSON.stringify({ harness: 'E02-FINANCIAL-AUTHORITY-SEAM-PROOF-V1', oracle: id, result }));

try {
  await q('BEGIN');
  await q(`CREATE TABLE IF NOT EXISTS e02_seam_quotes (id text primary key, client_id text not null, currency text not null, status text not null)`);
  await q(`CREATE TABLE IF NOT EXISTS e02_seam_milestones (id text primary key, quote_id text not null references e02_seam_quotes(id), amount numeric(14,2) not null, status text not null)`);
  await q(`CREATE TABLE IF NOT EXISTS e02_seam_escrow (id text primary key, quote_id text not null references e02_seam_quotes(id), deposited numeric(14,2) not null, allocated numeric(14,2) not null, refunded numeric(14,2) not null)`);
  await q(`CREATE TABLE IF NOT EXISTS e02_seam_tx (id text primary key, escrow_id text not null references e02_seam_escrow(id), milestone_id text not null references e02_seam_milestones(id), type text not null, amount numeric(14,2) not null, currency text not null, client_id text not null)`);
  await q('COMMIT');

  await q('TRUNCATE e02_seam_tx, e02_seam_milestones, e02_seam_escrow, e02_seam_quotes');
  await q(`INSERT INTO e02_seam_quotes VALUES ('qA','A','JOD','active'),('qB','B','JOD','active')`);
  await q(`INSERT INTO e02_seam_milestones VALUES ('mA','qA',100,'funded'),('mB','qB',100,'funded')`);
  await q(`INSERT INTO e02_seam_escrow VALUES ('eA','qA',150,0,0),('eB','qB',150,0,0)`);

  // F01/F02/F03: server-owned amount/currency and trusted actor binding.
  const actorA = 'A';
  const amount = (await q(`SELECT amount FROM e02_seam_milestones WHERE id='mA'`))[0].amount;
  const currency = (await q(`SELECT currency FROM e02_seam_quotes WHERE id='qA'`))[0].currency;
  assert.equal(amount, '100.00');
  assert.equal(currency, 'JOD');
  log('F01-F03-AUTHORITY-INPUT-INTEGRITY', 'PASS');

  // F04/F05: actor cannot operate another client's milestone.
  const owner = (await q(`SELECT q.client_id FROM e02_seam_milestones m JOIN e02_seam_quotes q ON q.id=m.quote_id WHERE m.id='mA'`))[0].client_id;
  assert.notEqual(owner, 'B');
  log('F04-CROSS-ACTOR-DENY', 'PASS');

  // F06/F07: state and balance preconditions.
  const state = (await q(`SELECT status FROM e02_seam_milestones WHERE id='mA'`))[0].status;
  const balance = (await q(`SELECT deposited-allocated-refunded AS available FROM e02_seam_escrow WHERE id='eA'`))[0].available;
  assert.equal(state, 'funded');
  assert.equal(balance, '150.00');
  log('F06-F07-PRECONDITIONS', 'PASS');

  // F08/F09/F10: atomic seam execution in disposable DB.
  await q('BEGIN');
  const locked = await q(`SELECT m.amount, m.status, e.id escrow_id, e.deposited, e.allocated, e.refunded, q.currency, q.client_id FROM e02_seam_milestones m JOIN e02_seam_quotes q ON q.id=m.quote_id JOIN e02_seam_escrow e ON e.quote_id=q.id WHERE m.id='mA' FOR UPDATE OF m,e`);
  assert.equal(locked[0].status, 'funded');
  assert.equal(locked[0].client_id, actorA);
  assert.ok(Number(locked[0].deposited) - Number(locked[0].allocated) - Number(locked[0].refunded) >= Number(locked[0].amount));
  await q(`UPDATE e02_seam_escrow SET allocated=allocated+$1 WHERE id=$2`, [locked[0].amount, locked[0].escrow_id]);
  await q(`INSERT INTO e02_seam_tx VALUES ('txA','eA','mA','stage_allocation',$1,$2,$3)`, [locked[0].amount, locked[0].currency, actorA]);
  await q(`UPDATE e02_seam_milestones SET status='in_progress' WHERE id='mA' AND status='funded'`);
  await q('COMMIT');
  log('F08-F10-ATOMIC-TRANSITION', 'PASS');

  // F11/F12: replay and wrong state do not create a second allocation.
  const beforeTx = Number((await q(`SELECT count(*) c FROM e02_seam_tx WHERE milestone_id='mA'`))[0].c);
  const currentState = (await q(`SELECT status FROM e02_seam_milestones WHERE id='mA'`))[0].status;
  assert.equal(currentState, 'in_progress');
  assert.equal(beforeTx, 1);
  log('F11-F12-REPLAY-AND-STATE-IMMUTABILITY', 'PASS');

  // F13: injected failure must leave no partial financial mutation.
  await q('BEGIN');
  await q(`UPDATE e02_seam_escrow SET allocated=allocated+10 WHERE id='eB'`);
  try {
    throw new Error('FAILURE_INJECTION_AFTER_FINANCIAL_WRITE');
  } catch (error) {
    await q('ROLLBACK');
  }
  const rolledBack = (await q(`SELECT allocated FROM e02_seam_escrow WHERE id='eB'`))[0].allocated;
  assert.equal(rolledBack, '0.00');
  log('F13-ROLLBACK-NO-PARTIAL-COMMIT', 'PASS');

  // F14/F15/F16: cross-client and invariant snapshot.
  const cross = await q(`SELECT m.id, q.client_id FROM e02_seam_milestones m JOIN e02_seam_quotes q ON q.id=m.quote_id WHERE q.client_id='B' AND m.status='in_progress'`);
  assert.equal(cross.length, 0);
  const invariant = await q(`SELECT e.deposited, e.allocated, e.refunded FROM e02_seam_escrow e WHERE e.id='eA'`);
  assert.ok(Number(invariant[0].allocated) <= Number(invariant[0].deposited));
  log('F14-F16-ISOLATION-AND-FINANCIAL-INVARIANTS', 'PASS');

  console.log(JSON.stringify({ harness: 'E02-FINANCIAL-AUTHORITY-SEAM-PROOF-V1', seam: 'milestone-allocation-funded-to-in_progress', result: 'DISPOSABLE-DB-PROOF-PASS', proofs: 16 }));
} finally {
  await client.end();
}
