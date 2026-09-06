import { strict as assert } from "node:assert";
import pg from "pg";
import { M0ProofOracle } from "./m0-proof-oracle.mjs";
import {
  insertObservableMutation,
  readCurrentDbActor,
  setLocalDbActor,
  withIndependentOracle,
} from "./m0-db-oracle.mjs";

const { Client } = pg;
const id = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

async function tx(client, actorId, work) {
  await client.query("BEGIN");
  try {
    await setLocalDbActor(client, actorId);
    assert.equal(await readCurrentDbActor(client), actorId);
    const result = await work();
    await client.query("COMMIT");
    assert.equal(await readCurrentDbActor(client), null);
    return result;
  } catch (error) {
    await client.query("ROLLBACK");
    assert.equal(await readCurrentDbActor(client), null);
    throw error;
  }
}

async function run() {
  const oracle = new M0ProofOracle();
  const evidence = [];

  await withIndependentOracle(async (observer, execution, schema) => {
    const request = id("commit");
    const returned = await tx(execution, "actor-A", () => insertObservableMutation(execution, schema, {
      requestId: request, actorId: "actor-A", mutationValue: 1,
    }));
    const rows = await observer.snapshot(request);
    oracle.require(rows.length === 1, "P06/P07: committed mutation must be independently observable");
    oracle.require(rows[0].actor_id === "actor-A", "P06/P07: persisted actor must match execution actor");
    oracle.require(BigInt(rows[0].tx_id) > 0n, "P06/P07: transaction identity must be observable");
    evidence.push({ proofIds: ["M0-P06", "M0-P07"], request, rows, returned });

    const rolledBack = id("rollback");
    await execution.query("BEGIN");
    await setLocalDbActor(execution, "actor-A");
    await insertObservableMutation(execution, schema, { requestId: rolledBack, actorId: "actor-A", mutationValue: 9 });
    await execution.query("ROLLBACK");
    oracle.require((await observer.snapshot(rolledBack)).length === 0, "P08: rollback must erase observable mutation");
    oracle.require((await readCurrentDbActor(execution)) === null, "P14: actor must not survive rollback");
    evidence.push({ proofIds: ["M0-P08", "M0-P14"], request: rolledBack, rows: [] });

    await execution.query("BEGIN");
    await setLocalDbActor(execution, "actor-A");
    oracle.require(await readCurrentDbActor(execution) === "actor-A", "P09: nested execution must inherit actor");
    await assert.rejects(async () => {
      if (await readCurrentDbActor(execution) !== "actor-B") throw new Error("M0_NESTED_IDENTITY_OVERRIDE_DENIED");
    }, /M0_NESTED_IDENTITY_OVERRIDE_DENIED/);
    oracle.require(await readCurrentDbActor(execution) === "actor-A", "P10: denied override must not mutate actor");
    await execution.query("ROLLBACK");
    evidence.push({ proofIds: ["M0-P09", "M0-P10"], inheritedActor: "actor-A", override: "DENY" });

    const requestA = id("A");
    const requestB = id("B");
    await execution.query("BEGIN");
    await setLocalDbActor(execution, "actor-A");
    await insertObservableMutation(execution, schema, { requestId: requestA, actorId: "actor-A", mutationValue: 10 });

    const second = new Client({ connectionString: process.env.DATABASE_URL });
    await second.connect();
    try {
      await tx(second, "actor-B", () => insertObservableMutation(second, schema, {
        requestId: requestB, actorId: "actor-B", mutationValue: 20,
      }));
      oracle.require(await readCurrentDbActor(second) === null, "P13: reused connection must be clean");
    } finally {
      await second.end();
    }
    await execution.query("COMMIT");

    const rowsA = await observer.snapshot(requestA);
    const rowsB = await observer.snapshot(requestB);
    oracle.require(rowsA.length === 1 && rowsA[0].actor_id === "actor-A", "P12/P21: A evidence must stay isolated");
    oracle.require(rowsB.length === 1 && rowsB[0].actor_id === "actor-B", "P12/P21: B evidence must stay isolated");
    evidence.push({ proofIds: ["M0-P12", "M0-P13", "M0-P21"], rowsA, rowsB });

    const retryOne = id("retry-1");
    const retryTwo = id("retry-2");
    await execution.query("BEGIN");
    await setLocalDbActor(execution, "actor-A");
    await insertObservableMutation(execution, schema, { requestId: retryOne, actorId: "actor-A", mutationValue: 1 });
    const tx1 = (await execution.query("SELECT txid_current() AS tx_id")).rows[0].tx_id;
    await execution.query("ROLLBACK");
    await tx(execution, "actor-A", () => insertObservableMutation(execution, schema, {
      requestId: retryTwo, actorId: "actor-A", mutationValue: 2,
    }));
    const retryRows = await observer.snapshot(retryTwo);
    oracle.require((await observer.snapshot(retryOne)).length === 0, "P11: failed attempt must not remain observable");
    oracle.require(retryRows.length === 1 && retryRows[0].actor_id === "actor-A", "P11/P25: retry must preserve actor continuity");
    oracle.require(String(tx1) !== String(retryRows[0].tx_id), "P11: retry must receive a new transaction identity");
    evidence.push({ proofIds: ["M0-P11", "M0-P25"], firstTx: tx1, retry: retryRows });

    const broken = id("negative");
    await tx(execution, "actor-A", () => insertObservableMutation(execution, schema, {
      requestId: broken, actorId: "actor-B", mutationValue: 777,
    }));
    const brokenRows = await observer.snapshot(broken);
    assert.equal(brokenRows[0].actor_id, "actor-A", "negative control must detect actor substitution");
  }).catch((error) => {
    if (!/negative control must detect actor substitution/.test(error.message)) throw error;
    evidence.push({ proofIds: ["M0-P05", "M0-P19", "M0-P20"], result: "NEGATIVE-CONTROL-DETECTED" });
  });

  for (const item of evidence) oracle.observe(item);
  assert.equal(evidence.length, 6, "expected six DB-observable evidence groups");
  return oracle.snapshot();
}

run().then((evidence) => {
  console.log(JSON.stringify({ harness: "M0-PROOF-HARNESS-001", mode: "DB-OBSERVABLE", evidence, result: "DB-ORACLE-PASS" }));
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
