import { strict as assert } from "node:assert";
import pg from "pg";
import { assertIsolatedDatabaseUrl } from "./m0-proof-oracle.mjs";

const { Client } = pg;

export async function withIndependentOracle(run) {
  const database = assertIsolatedDatabaseUrl();
  const observer = new Client({ connectionString: process.env.DATABASE_URL });
  const execution = new Client({ connectionString: process.env.DATABASE_URL });
  await observer.connect();
  await execution.connect();

  const schema = `m0_oracle_${process.pid}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  try {
    await observer.query(`CREATE SCHEMA "${schema}"`);
    await observer.query(`
      CREATE TABLE "${schema}".observations (
        id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
        request_id text NOT NULL,
        actor_id text,
        tx_id bigint,
        mutation_value integer NOT NULL DEFAULT 0,
        observed_at timestamptz NOT NULL DEFAULT clock_timestamp()
      )
    `);

    const oracle = Object.freeze({
      database,
      schema,
      async snapshot(requestId) {
        const result = await observer.query(
          `SELECT request_id, actor_id, tx_id, mutation_value
             FROM "${schema}".observations
            WHERE request_id = $1
            ORDER BY id`,
          [requestId],
        );
        return result.rows.map((row) => ({ ...row }));
      },
      async countRows() {
        const result = await observer.query(`SELECT count(*)::integer AS count FROM "${schema}".observations`);
        return result.rows[0].count;
      },
      async requireNoMutation(requestId, message) {
        const rows = await this.snapshot(requestId);
        assert.equal(rows.length, 0, message);
      },
    });

    await run(oracle, execution, schema);
  } finally {
    await observer.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
    await execution.end();
    await observer.end();
  }
}

export async function insertObservableMutation(client, schema, observation) {
  const result = await client.query(
    `INSERT INTO "${schema}".observations (request_id, actor_id, tx_id, mutation_value)
     VALUES ($1, $2, txid_current(), $3)
     RETURNING request_id, actor_id, tx_id, mutation_value`,
    [observation.requestId, observation.actorId ?? null, observation.mutationValue ?? 1],
  );
  return result.rows[0];
}

export async function readCurrentDbActor(client) {
  const result = await client.query(`SELECT current_setting('app.m0_actor_id', true) AS actor_id`);
  return result.rows[0].actor_id ?? null;
}

export async function setLocalDbActor(client, actorId) {
  await client.query(`SELECT set_config('app.m0_actor_id', $1, true)`, [actorId]);
}
