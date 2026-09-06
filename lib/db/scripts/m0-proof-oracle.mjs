import { strict as assert } from "node:assert";

export class M0ProofOracle {
  #evidence = [];

  observe(evidence) {
    this.#evidence.push(Object.freeze({ ...evidence }));
  }

  snapshot() {
    return this.#evidence.slice();
  }

  require(condition, message) {
    assert.equal(condition, true, message);
  }

  requireDenied(result, message) {
    this.require(result === "DENY", message);
  }

  requireNoMutation(before, after, message) {
    this.require(before === after, message);
  }
}

export function assertIsolatedDatabaseUrl(rawUrl = process.env.DATABASE_URL) {
  if (!rawUrl) throw new Error("M0_HARNESS_DATABASE_URL_MISSING");

  const url = new URL(rawUrl);
  const host = url.hostname.toLowerCase();
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  const localHost = host === "localhost" || host === "127.0.0.1" || host === "::1";

  if (!localHost || !database.endsWith("_test")) {
    throw new Error("M0_HARNESS_REFUSES_NON_ISOLATED_DATABASE");
  }

  return { host, database };
}
