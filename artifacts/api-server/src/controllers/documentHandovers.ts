import { Request, Response } from "express";
import { createHash, randomInt } from "node:crypto";
import { and, desc, eq, or } from "drizzle-orm";
import { z } from "zod/v4";
import { db } from "@workspace/db";
import { documentHandoversTable, usersTable } from "@workspace/db/schema";

const createSchema = z.object({
  caseId: z.string().min(1),
  documentName: z.string().min(1).max(200),
  clientCity: z.string().max(120).optional(),
  lawyerCity: z.string().max(120).optional(),
  officeId: z.string().max(120).optional(),
  officeAddress: z.string().max(500).optional(),
  officeHours: z.string().max(300).optional(),
  officeMapUrl: z.string().url().max(1000).optional(),
  method: z.enum(["local_dispatch", "office_dropoff"]).optional(),
});

const otpSchema = z.object({ otp: z.string().regex(/^\d{4}$/) });
const statusSchema = z.object({ status: z.enum([
  "approved", "preparing", "picked_up", "in_transit", "customs_clearance",
  "delivered", "delivery_failed", "returned", "customs_hold", "cancelled",
]) });

function serialNumber() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `DOC-${date}-${randomInt(100000, 1000000)}`;
}

function receiptNumber() {
  return `RCPT-${new Date().getFullYear()}-${randomInt(100000, 1000000)}`;
}

function hashOtp(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function canAccess(userId: string, handover: { clientId: string; lawyerId: string }) {
  return handover.clientId === userId || handover.lawyerId === userId;
}

export async function createDocumentHandover(req: Request, res: Response) {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "validation_error" });

  const authUser = req.authUser!;
  if (authUser.role !== "client" && authUser.role !== "lawyer" && authUser.role !== "admin") {
    return res.status(403).json({ ok: false, error: "unauthorized" });
  }

  const { caseId, documentName, clientCity, lawyerCity, officeId, officeAddress, officeHours, officeMapUrl } = parsed.data;
  let clientId = authUser.id;
  let lawyerId = "";

  if (authUser.role === "client") {
    const requestedLawyerId = req.body.lawyerId;
    if (typeof requestedLawyerId !== "string" || !requestedLawyerId) return res.status(400).json({ ok: false, error: "lawyer_id_required" });
    lawyerId = requestedLawyerId;
  } else if (authUser.role === "lawyer") {
    const requestedClientId = req.body.clientId;
    if (typeof requestedClientId !== "string" || !requestedClientId) return res.status(400).json({ ok: false, error: "client_id_required" });
    clientId = requestedClientId;
    lawyerId = authUser.id;
  } else {
    if (typeof req.body.clientId !== "string" || typeof req.body.lawyerId !== "string") {
      return res.status(400).json({ ok: false, error: "client_id_and_lawyer_id_required" });
    }
    clientId = req.body.clientId;
    lawyerId = req.body.lawyerId;
  }

  const [client, lawyer] = await Promise.all([
    db.select().from(usersTable).where(and(eq(usersTable.id, clientId), eq(usersTable.role, "client"))).limit(1),
    db.select().from(usersTable).where(and(eq(usersTable.id, lawyerId), eq(usersTable.role, "lawyer"))).limit(1),
  ]);
  if (!client[0] || !lawyer[0]) return res.status(404).json({ ok: false, error: "party_not_found" });

  const sameCountry = client[0].country === lawyer[0].country;
  const method = sameCountry ? (parsed.data.method ?? "local_dispatch") : "international_courier";

  if (method === "office_dropoff" && !officeAddress) {
    return res.status(400).json({ ok: false, error: "office_address_required" });
  }

  const id = `handover-${Date.now()}-${randomInt(1000, 10000)}`;
  const [handover] = await db.insert(documentHandoversTable).values({
    id,
    serialNumber: serialNumber(),
    caseId,
    documentName,
    method,
    status: "requested",
    clientId,
    lawyerId,
    clientCountry: client[0].country,
    clientCity,
    lawyerCountry: lawyer[0].country,
    lawyerCity,
    officeId,
    officeAddress,
    officeHours,
    officeMapUrl,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning();

  return res.status(201).json({
    ok: true,
    handover,
    route: sameCountry ? "local" : "international",
    options: sameCountry ? ["local_dispatch", "office_dropoff"] : ["international_courier"],
    legalGuidance: !sameCountry
      ? "متطلبات التصديق والشحن تختلف حسب الدولة ونوع الوكالة. يرجى مراجعة المتطلبات الرسمية قبل الإرسال."
      : undefined,
  });
}

export async function listDocumentHandovers(req: Request, res: Response) {
  const caseId = typeof req.query.caseId === "string" ? req.query.caseId : undefined;
  const userId = req.authUser!.id;
  const filters = [or(eq(documentHandoversTable.clientId, userId), eq(documentHandoversTable.lawyerId, userId))];
  if (caseId) filters.push(eq(documentHandoversTable.caseId, caseId));
  const rows = await db.select().from(documentHandoversTable).where(and(...filters)).orderBy(desc(documentHandoversTable.createdAt));
  return res.json({ ok: true, handovers: rows });
}

export async function verifyHandoverOtp(req: Request, res: Response) {
  const parsed = otpSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_otp" });
  const id = req.params.id;
  const [handover] = await db.select().from(documentHandoversTable).where(eq(documentHandoversTable.id, id)).limit(1);
  if (!handover) return res.status(404).json({ ok: false, error: "handover_not_found" });
  if (!canAccess(req.authUser!.id, handover) || req.authUser!.id !== handover.clientId) return res.status(403).json({ ok: false, error: "unauthorized" });
  if (handover.method !== "local_dispatch") return res.status(400).json({ ok: false, error: "otp_not_required" });
  if (!handover.otpHash || !handover.otpExpiresAt || handover.otpExpiresAt.getTime() < Date.now()) return res.status(400).json({ ok: false, error: "otp_expired" });
  if (hashOtp(parsed.data.otp) !== handover.otpHash) return res.status(400).json({ ok: false, error: "invalid_otp" });
  const [updated] = await db.update(documentHandoversTable).set({ otpHash: null, otpExpiresAt: null, otpVerifiedAt: new Date(), status: "picked_up", updatedAt: new Date() }).where(eq(documentHandoversTable.id, id)).returning();
  return res.json({ ok: true, handover: updated });
}

export async function generateHandoverOtp(req: Request, res: Response) {
  const id = req.params.id;
  const [handover] = await db.select().from(documentHandoversTable).where(eq(documentHandoversTable.id, id)).limit(1);
  if (!handover) return res.status(404).json({ ok: false, error: "handover_not_found" });
  if (!canAccess(req.authUser!.id, handover) || req.authUser!.id !== handover.clientId) return res.status(403).json({ ok: false, error: "unauthorized" });
  if (handover.method !== "local_dispatch") return res.status(400).json({ ok: false, error: "otp_not_required" });
  const otp = String(randomInt(0, 10000)).padStart(4, "0");
  const [updated] = await db.update(documentHandoversTable).set({ otpHash: hashOtp(otp), otpExpiresAt: new Date(Date.now() + 15 * 60 * 1000), status: "approved", updatedAt: new Date() }).where(eq(documentHandoversTable.id, id)).returning();
  return res.json({ ok: true, handover: updated, otp: process.env.NODE_ENV === "production" ? undefined : otp });
}

export async function updateHandoverStatus(req: Request, res: Response) {
  const parsed = statusSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_status" });
  const [handover] = await db.select().from(documentHandoversTable).where(eq(documentHandoversTable.id, req.params.id)).limit(1);
  if (!handover) return res.status(404).json({ ok: false, error: "handover_not_found" });
  if (!canAccess(req.authUser!.id, handover) && req.authUser!.role !== "admin") return res.status(403).json({ ok: false, error: "unauthorized" });
  const next = parsed.data.status;
  const [updated] = await db.update(documentHandoversTable).set({ status: next, trackingStatus: next, updatedAt: new Date() }).where(eq(documentHandoversTable.id, req.params.id)).returning();
  return res.json({ ok: true, handover: updated });
}

export async function confirmHandoverReceipt(req: Request, res: Response) {
  const [handover] = await db.select().from(documentHandoversTable).where(eq(documentHandoversTable.id, req.params.id)).limit(1);
  if (!handover) return res.status(404).json({ ok: false, error: "handover_not_found" });
  if (req.authUser!.id !== handover.lawyerId) return res.status(403).json({ ok: false, error: "lawyer_confirmation_required" });
  if (handover.status !== "delivered" && handover.status !== "picked_up") return res.status(400).json({ ok: false, error: "handover_not_delivered" });
  const now = new Date();
  const [updated] = await db.update(documentHandoversTable).set({ lawyerConfirmedAt: now, receiptConfirmedAt: now, receiptId: receiptNumber(), status: "completed", updatedAt: now }).where(eq(documentHandoversTable.id, req.params.id)).returning();
  return res.json({ ok: true, handover: updated, proofOfReceipt: { receiptId: updated.receiptId, confirmedAt: updated.receiptConfirmedAt } });
}
