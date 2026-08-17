import { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import { representationQuoteRequestsTable, usersTable } from "@workspace/db/schema";
import { createRepresentationQuoteRequestSchema } from "@workspace/api-zod";
import {
  claimRepresentationQuoteRequestIdempotency,
  requireAuthenticatedClientId,
} from "../lib/representationQuoteRequestGuards";
import { persistIdempotencyResponse } from "../lib/transactionalIdempotency";

function mapRequestError(error: unknown): { status: number; code: string } | null {
  if (!(error instanceof Error)) return null;

  switch (error.message) {
    case "IDEMPOTENCY_KEY_REQUIRED":
      return { status: 400, code: "idempotency_key_required" };
    case "IDEMPOTENCY_REQUEST_MISMATCH":
      return { status: 409, code: "idempotency_request_mismatch" };
    case "IDEMPOTENCY_REQUEST_IN_PROGRESS":
      return { status: 409, code: "idempotency_request_in_progress" };
    case "IDEMPOTENCY_CLAIM_FAILED":
      return { status: 409, code: "idempotency_claim_failed" };
    default:
      return null;
  }
}

function createSerialNumber(): string {
  return `RQR-${randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`;
}

export async function createRepresentationQuoteRequest(req: Request, res: Response) {
  let clientId: string;
  try {
    clientId = requireAuthenticatedClientId(req);
  } catch (error) {
    if (error instanceof Error && error.message === "AUTHENTICATION_REQUIRED") {
      return res.status(401).json({ ok: false, error: "authentication_required" });
    }
    if (error instanceof Error && error.message === "CLIENT_ROLE_REQUIRED") {
      return res.status(403).json({ ok: false, error: "client_role_required" });
    }
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }

  const parsed = createRepresentationQuoteRequestSchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "invalid_representation_quote_request",
      issues: parsed.error.issues,
    });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const idempotency = await claimRepresentationQuoteRequestIdempotency(tx, req, clientId);
      if (idempotency.replay) return idempotency;

      if (parsed.data.lawyerId) {
        const [lawyer] = await tx
          .select({ id: usersTable.id })
          .from(usersTable)
          .where(
            and(
              eq(usersTable.id, parsed.data.lawyerId),
              eq(usersTable.role, "lawyer"),
              eq(usersTable.accountStatus, "active"),
            ),
          )
          .limit(1);

        if (!lawyer) {
          return { validationError: "lawyer_not_found_or_unavailable" as const };
        }
      }

      const now = new Date();
      const id = randomUUID();
      const serialNumber = createSerialNumber();

      const [created] = await tx
        .insert(representationQuoteRequestsTable)
        .values({
          id,
          serialNumber,
          clientId,
          lawyerId: parsed.data.lawyerId ?? null,
          title: parsed.data.title,
          description: parsed.data.description ?? null,
          status: "submitted",
          createdAt: now,
          updatedAt: now,
          submittedAt: now,
        })
        .returning();

      const responseBody = { ok: true, request: created };
      await persistIdempotencyResponse(tx, req, clientId, 201, responseBody);
      return { replay: false as const, status: 201, body: responseBody };
    });

    if ("validationError" in result) {
      return res.status(404).json({ ok: false, error: result.validationError });
    }

    if (result.replay) {
      return res.status(result.status).json(result.body);
    }

    return res.status(result.status).json(result.body);
  } catch (error) {
    const mapped = mapRequestError(error);
    if (mapped) {
      return res.status(mapped.status).json({ ok: false, error: mapped.code });
    }

    console.error("Representation Quote Request Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}
