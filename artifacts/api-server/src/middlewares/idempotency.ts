import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { idempotencyKeysTable } from "@workspace/db/schema";
import type { NextFunction, Request, Response } from "express";

const HEADER = "idempotency-key";
const MAX_KEY_LENGTH = 200;

function requestHash(req: Request) {
  return crypto.createHash("sha256").update(JSON.stringify(req.body ?? null)).digest("hex");
}

export async function requireIdempotencyKey(req: Request, res: Response, next: NextFunction) {
  const key = String(req.get(HEADER) ?? "").trim();
  if (!key || key.length > MAX_KEY_LENGTH) {
    return res.status(400).json({ ok: false, error: "idempotency_key_required", message: "A valid Idempotency-Key header is required." });
  }

  const userId = req.authUser?.id;
  if (!userId) return res.status(401).json({ ok: false, error: "unauthorized" });

  const route = req.route?.path ? String(req.route.path) : req.path;
  const method = req.method;
  const hash = requestHash(req);

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
    if (existing.completedAt && existing.responseStatus !== null) {
      if (existing.responseBody !== null) return res.status(existing.responseStatus).json(existing.responseBody);
      return res.sendStatus(existing.responseStatus);
    }
    return res.status(409).json({ ok: false, error: "idempotency_request_in_progress" });
  }

  try {
    await db.insert(idempotencyKeysTable).values({
      id: crypto.randomUUID(), userId, key, route, method, requestHash: hash,
    });
  } catch (error: any) {
    if (error?.code === "23505") {
      return res.status(409).json({ ok: false, error: "idempotency_request_in_progress" });
    }
    throw error;
  }

  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);
  let responsePersisted = false;

  const persist = async (status: number, body: unknown) => {
    if (responsePersisted) return;
    try {
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
    } catch (error) {
      console.error("Idempotency response persistence failed:", error);
    }
  };

  res.json = ((body: unknown) => {
    void persist(res.statusCode, body).then(() => originalJson(body));
    return res;
  }) as Response["json"];
  res.send = ((body?: any) => {
    void persist(res.statusCode, body).then(() => originalSend(body));
    return res;
  }) as Response["send"];

  return next();
}
