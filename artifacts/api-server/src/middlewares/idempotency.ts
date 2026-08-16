import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { idempotencyKeysTable } from "@workspace/db/schema";
import type { NextFunction, Request, Response } from "express";

const HEADER = "idempotency-key";
const MAX_KEY_LENGTH = 200;
const RETRY_AFTER_MS = 5 * 60 * 1000;

function stableJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.keys(value as Record<string, unknown>).sort().map((key) => `${JSON.stringify(key)}:${stableJson((value as Record<string, unknown>)[key])}`).join(",")}}`;
}

function requestHash(req: Request) {
  const identity = {
    method: req.method.toUpperCase(),
    path: req.path,
    params: req.params ?? {},
    query: req.query ?? {},
    body: req.body ?? null,
  };
  return crypto.createHash("sha256").update(stableJson(identity)).digest("hex");
}

function isRetryableStatus(status: number) {
  return status >= 500;
}

export async function requireIdempotencyKey(req: Request, res: Response, next: NextFunction) {
  const key = String(req.get(HEADER) ?? "").trim();
  if (!key || key.length > MAX_KEY_LENGTH) {
    return res.status(400).json({ ok: false, error: "idempotency_key_required", message: "A valid Idempotency-Key header is required." });
  }

  const userId = req.authUser?.id;
  if (!userId) return res.status(401).json({ ok: false, error: "unauthorized" });

  const route = req.route?.path ? String(req.route.path) : req.path;
  const method = req.method.toUpperCase();
  const hash = requestHash(req);
  const now = Date.now();

  const [existing] = await db.select().from(idempotencyKeysTable).where(and(
    eq(idempotencyKeysTable.userId, userId),
    eq(idempotencyKeysTable.key, key),
    eq(idempotencyKeysTable.route, route),
    eq(idempotencyKeysTable.method, method),
  )).limit(1);

  if (existing) {
    if (existing.requestHash !== hash) {
      return res.status(409).json({ ok: false, error: "idempotency_key_reused_with_different_request" });
    }
    if (existing.completedAt && existing.responseStatus !== null && !isRetryableStatus(existing.responseStatus)) {
      if (existing.responseBody !== null) return res.status(existing.responseStatus).json(existing.responseBody);
      return res.sendStatus(existing.responseStatus);
    }
    if (!existing.completedAt && now < existing.expiresAt.getTime()) {
      return res.status(409).json({ ok: false, error: "idempotency_request_in_progress" });
    }
  }

  if (existing && (!existing.completedAt || existing.responseStatus === null || isRetryableStatus(existing.responseStatus))) {
    await db.delete(idempotencyKeysTable).where(and(
      eq(idempotencyKeysTable.userId, userId),
      eq(idempotencyKeysTable.key, key),
      eq(idempotencyKeysTable.route, route),
      eq(idempotencyKeysTable.method, method),
    ));
  }

  try {
    await db.insert(idempotencyKeysTable).values({
      id: crypto.randomUUID(),
      userId,
      key,
      route,
      method,
      requestHash: hash,
      expiresAt: new Date(Date.now() + RETRY_AFTER_MS),
    });
  } catch (error: any) {
    const code = error?.code ?? error?.cause?.code;
    if (code === "23505") {
      return res.status(409).json({ ok: false, error: "idempotency_request_in_progress" });
    }
    throw error;
  }

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  const originalEnd = res.end.bind(res);
  let responsePersisted = false;

  const persist = async (status: number, body: unknown) => {
    if (responsePersisted || isRetryableStatus(status)) return;
    await db.update(idempotencyKeysTable).set({
      responseStatus: status,
      responseBody: body as any,
      completedAt: new Date(),
    }).where(and(
      eq(idempotencyKeysTable.userId, userId),
      eq(idempotencyKeysTable.key, key),
      eq(idempotencyKeysTable.route, route),
      eq(idempotencyKeysTable.method, method),
    ));
    responsePersisted = true;
  };

  res.json = ((body: unknown) => {
    void persist(res.statusCode, body).then(() => originalJson(body)).catch((error) => {
      console.error("Idempotency response persistence failed:", error);
      originalJson(body);
    });
    return res;
  }) as Response["json"];
  res.send = ((body?: any) => {
    void persist(res.statusCode, body).then(() => originalSend(body)).catch((error) => {
      console.error("Idempotency response persistence failed:", error);
      originalSend(body);
    });
    return res;
  }) as Response["send"];
  res.end = ((...args: Parameters<Response["end"]>) => {
    if (res.statusCode >= 400) void persist(res.statusCode, args[0]).catch((error) => console.error("Idempotency response persistence failed:", error));
    return originalEnd(...args);
  }) as Response["end"];

  return next();
}
