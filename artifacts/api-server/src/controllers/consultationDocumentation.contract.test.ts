import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const controllerPath = resolve(dirname(fileURLToPath(import.meta.url)), "consultationDocumentation.ts");
const source = readFileSync(controllerPath, "utf8");

test("T01-08 consultation documentation controller has no financial DTO fields", () => {
  assert.equal(source.includes("price:"), false);
  assert.equal(source.includes("paymentStatus:"), false);
  assert.equal(source.includes("escrowStatus:"), false);
});

test("T01-08 print metadata remains allow-listed", () => {
  const allowedKeys = ["message", "text", "content", "note", "reason", "status", "location", "fromStatus", "toStatus"];
  for (const key of allowedKeys) assert.match(source, new RegExp(`\\\"${key}\\\"`));
  assert.equal(source.includes("\\\"price\\\""), false);
  assert.equal(source.includes("\\\"paymentStatus\\\""), false);
  assert.equal(source.includes("\\\"escrowStatus\\\""), false);
});
