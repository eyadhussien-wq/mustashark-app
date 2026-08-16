import crypto from "crypto";
import type { Request } from "express";
import { and, eq } from "drizzle-orm";
import { idempotencyKeysTable } from "@workspace/db/schema";

const MAX_KEY_LENGTH = 200;
const RETRY_AFTER_MS = 5 * 60 * 1000;

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
}

export function getIdempotencyKey(req: Request): string {
  const key = String(req.get("idempotency-key") ?? "").trim();
  if (!key || key.length > MAX_KEY_LENGTH) throw new Error("IDEMPOTENCY_KEY_REQUIRED");
  return key;
}

export function getRequestHash(req: Request): string {
  const identity = {
    method: req.method.toUpperCase(),
    path: req.path,
    params: req.params ?? {},
    query: req.query ?? {},
    body: req.body ?? null,
  };
  return crypto.createHash("sha256").update(stableJson(identity)).digest("hex");
}

export type IdempotencyResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; key: string; route: string; method: string; requestHash: string };

/**
 * Claims an idempotency key inside the caller's transaction. PostgreSQL's
 * unique constraint serializes concurrent claims; ON CONFLICT avoids aborting
 * the transaction so the existing row can then be locked and replayed.
 */
export async function claimIdempotency(
  tx: any,
  req: Request,
  userId: string,
): Promise<IdempotencyResult> {
  const key = getIdempotencyKey(req);
  const route = req.route?.path ? String(req.route.path) : req.path;
  const method = req.method.toUpperCase();
  const requestHash = getRequestHash(req);
  const expiresAt = new Date(Date.now() + RETRY_AFTER_MS);

  await tx
    .insert(idempotencyKeysTable)
    .values({
      id: crypto.randomUUID(),
      userId,
      key,
      route,
      method,
      requestHash,
      expiresAt,
    })
    .onConflictDoNothing({
      target: [
        idempotencyKeysTable.userId,
        idempotencyKeysTable.key,
        idempotencyKeysTable.route,
        idempotencyKeysTable.method,
      ],
    });

  const [existing] = await tx
    .select()
    .from(idempotencyKeysTable)
    .where(and(
      eq(idempotencyKeysTable.userId, userId),
      eq(idempotencyKeysTable.key, key),
      eq(idempotencyKeysTable.route, route),
      eq(idempotencyKeysTable.method, method),
    ))
    .limit(1)
    .for("update");

  if (!existing) throw new Error("IDEMPOTENCY_CLAIM_FAILED");
  if (existing.requestHash !== requestHash) throw new Error("IDEMPOTENCY_REQUEST_MISMATCH");
  if (existing.responseStatus !== null && existing.completedAt && existing.responseBody !== null) {
    return { replay: true, status: existing.responseStatus, body: existing.responseBody };
  }
  if (existing.expiresAt.getTime() > Date.now()) throw new Error("IDEMPOTENCY_REQUEST_IN_PROGRESS");

  await tx.delete(idempotencyKeysTable).where(eq(idempotencyKeysTable.id, existing.id));
  await tx
    .insert(idempotencyKeysTable)
    .values({
      id: crypto.randomUUID(),
      userId,
      key,
      route,
      method,
      requestHash,
      expiresAt,
    });
  return { replay: false, key, route, method, requestHash };
}

export async function persistIdempotencyResponse(
  tx: any,
  req: Request,
  userId: string,
  status: number,
  body: unknown,
) {
  const key = getIdempotencyKey(req);
  const route = req.route?.path ? String(req.route.path) : req.path;
  const method = req.method.toUpperCase();
  await tx.update(idempotencyKeysTable).set({
    responseStatus: status,
    responseBody: body as any,
    completedAt: new Date(),
  }).where(and(
    eq(idempotencyKeysTable.userId, userId),
    eq(idempotencyKeysTable.key, key),
    eq(idempotencyKeysTable.route, route),
    eq(idempotencyKeysTable.method, method),
  ));
}
