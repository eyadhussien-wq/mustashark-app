import { Client } from "pg";
import { assertIsolatedDatabaseUrl } from "./m0-proof-oracle.mjs";

export async function withIndependentOracle(run) {
  const { host, database } = assertIsolatedDatabaseUrl();
  const connectionString = process.env.DATABASE_URL;
  const observer = new Client({ connectionString });
  const execution = new Client({ connectionString });
  await observer.connect();
  await execution.connect();

  const schema = `m0_oracle_${process.pid}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  const qualified = `"${schema.replaceAll('"', '""')}"`;

  try {
    await execution.query(`CREATE SCHEMA ${qualified}`);
    await execution.query(`CREATE TABLE ${qualified}.observations (
      id BIGSERIAL PRIMARY KEY,
      request_id TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      tx_id BIGINT NOT NULL,
      mutation_value TEXT NOT NULL,
      observed_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )`);

    const oracle = Object.freeze({
      host,
      database,
      schema,
      async snapshot(requestId) {
        const result = await observer.query(
          `SELECT request_id, actor_id, tx_id, mutation_value
             FROM ${qualified}.observations
            WHERE request_id = $1
            ORDER BY id`,
          [requestId],
        );
        return result.rows;
      },
      async countRows(requestId) {
        const result = await observer.query(
          `SELECT count(*)::int AS count
             FROM ${qualified}.observations
            WHERE request_id = $1`,
          [requestId],
        );
        return result.rows[0].count;
      },
      async insertObservableMutation(requestId, actorId, mutationValue) {
        const result = await execution.query(
          `INSERT INTO ${qualified}.observations (request_id, actor_id, tx_id, mutation_value)
           VALUES ($1, $2, txid_current(), $3)
           RETURNING tx_id`,
          [requestId, actorId, mutationValue],
        );
        return result.rows[0].tx_id;
      },
      async readCurrentDbActor() {
        const result = await execution.query("SELECT current_setting('app.m0_actor_id', true) AS actor_id");
        return result.rows[0].actor_id;
      },
      async setLocalDbActor(actorId) {
        await execution.query("SELECT set_config('app.m0_actor_id', $1, true)", [actorId]);
      },
    });

    await run(oracle, execution, schema);
  } finally {
    // The CI database is disposable and is removed with its service container.
    await execution.end();
    await observer.end();
  }
}
