import { Request, Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import crypto from "node:crypto";
import { z } from "zod";
import { db } from "@workspace/db";
import { bookingsTable, paymentProofsTable, usersTable } from "@workspace/db/schema";

const submitPaymentProofSchema = z.object({
  amount: z.coerce.number().positive().finite(),
  // Kept for backward-compatible clients, but never trusted by the server.
  currency: z.string().trim().min(1).max(8),
  method: z.enum(["bank_transfer", "western_union", "other"]),
  proofUri: z.string().trim().min(1).max(2000),
  reference: z.string().trim().max(200).optional(),
  note: z.string().trim().max(1000).optional(),
});

const CLOSED_BOOKING_STATUSES = [
  "rejected",
  "completed",
  "cancelled_by_client",
  "cancelled_by_lawyer",
  "no_show_client",
  "no_show_lawyer",
  "refunded_absent",
] as const;

function currencyForCountry(country: "qatar" | "jordan" | null | undefined) {
  if (country === "qatar") return "QAR";
  if (country === "jordan") return "JOD";
  return null;
}

async function getBookingForUser(bookingId: string, userId: string, role: string) {
  const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
  if (!booking) return { booking: null, forbidden: false };
  if (role === "admin" || booking.clientId === userId || booking.lawyerId === userId) return { booking, forbidden: false };
  return { booking: null, forbidden: true };
}

export const listPaymentProofs = async (req: Request, res: Response) => {
  try {
    const bookingId = String(req.params.id ?? "");
    const authUser = req.authUser!;
    const access = await getBookingForUser(bookingId, authUser.id, authUser.role);
    if (access.forbidden) return res.status(403).json({ ok: false, error: "unauthorized_access" });
    if (!access.booking) return res.status(404).json({ ok: false, error: "booking_not_found" });

    const proofs = await db.select().from(paymentProofsTable).where(eq(paymentProofsTable.bookingId, bookingId));
    return res.json({ ok: true, proofs });
  } catch (error) {
    console.error("List Payment Proofs Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const submitPaymentProof = async (req: Request, res: Response) => {
  try {
    const parsed = submitPaymentProofSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_input", details: parsed.error.flatten() });

    const authUser = req.authUser!;
    const bookingId = String(req.params.id ?? "");
    if (authUser.role !== "client") return res.status(403).json({ ok: false, error: "client_only" });

    const result = await db.transaction(async (tx) => {
      // Serialize payment submissions for the same booking before calculating its remaining balance.
      await tx.execute(sql`SELECT id FROM bookings WHERE id = ${bookingId} FOR UPDATE`);

      const [booking] = await tx.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
      if (!booking) return { kind: "not_found" as const };
      if (booking.clientId !== authUser.id) return { kind: "forbidden" as const };
      if (CLOSED_BOOKING_STATUSES.includes(booking.status as (typeof CLOSED_BOOKING_STATUSES)[number]) || booking.paymentStatus === "paid") {
        return { kind: "closed" as const };
      }

      const [client] = await tx.select({ country: usersTable.country }).from(usersTable).where(eq(usersTable.id, authUser.id)).limit(1);
      const authoritativeCurrency = currencyForCountry(client?.country);
      if (!authoritativeCurrency) return { kind: "currency_not_configured" as const };

      const [totals] = await tx.select({
        submitted: sql<string>`coalesce(sum(case when ${paymentProofsTable.status} = 'submitted' then ${paymentProofsTable.amount} else 0 end), 0)`,
        confirmed: sql<string>`coalesce(sum(case when ${paymentProofsTable.status} = 'confirmed' then ${paymentProofsTable.amount} else 0 end), 0)`,
      }).from(paymentProofsTable).where(eq(paymentProofsTable.bookingId, bookingId));

      const alreadyAccounted = Number(totals?.submitted ?? 0) + Number(totals?.confirmed ?? 0);
      const requested = parsed.data.amount;
      const remaining = Math.max(0, Number(booking.price) - alreadyAccounted);
      if (requested > remaining + 0.0001) return { kind: "exceeds_balance" as const, remaining };

      const [proof] = await tx.insert(paymentProofsTable).values({
        id: crypto.randomUUID(),
        bookingId,
        clientId: authUser.id,
        amount: requested.toFixed(2),
        currency: authoritativeCurrency,
        channel: "external",
        method: parsed.data.method,
        proofUri: parsed.data.proofUri,
        reference: parsed.data.reference || null,
        note: parsed.data.note || null,
        status: "submitted",
      }).returning();

      return { kind: "ok" as const, proof };
    });

    if (result.kind === "not_found") return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (result.kind === "forbidden") return res.status(403).json({ ok: false, error: "unauthorized_access" });
    if (result.kind === "closed") return res.status(409).json({ ok: false, error: "consultation_closed" });
    if (result.kind === "currency_not_configured") return res.status(409).json({ ok: false, error: "payment_currency_not_configured" });
    if (result.kind === "exceeds_balance") return res.status(409).json({ ok: false, error: "amount_exceeds_remaining_balance", remaining: result.remaining });

    return res.status(201).json({
      ok: true,
      proof: result.proof,
      message: "تم إرسال إثبات الدفع وبانتظار تأكيد المحامي.",
    });
  } catch (error) {
    console.error("Submit Payment Proof Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const confirmPaymentProof = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    if (authUser.role !== "lawyer" && authUser.role !== "admin") return res.status(403).json({ ok: false, error: "lawyer_or_admin_only" });

    const bookingId = String(req.params.id ?? "");
    const proofId = String(req.params.proofId ?? "");
    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`SELECT id FROM bookings WHERE id = ${bookingId} FOR UPDATE`);

      const [booking] = await tx.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
      if (!booking) return { kind: "not_found" as const };
      if (authUser.role === "lawyer" && booking.lawyerId !== authUser.id) return { kind: "forbidden" as const };
      if (CLOSED_BOOKING_STATUSES.includes(booking.status as (typeof CLOSED_BOOKING_STATUSES)[number]) || booking.paymentStatus === "paid") {
        return { kind: "closed" as const };
      }

      const [proof] = await tx.select().from(paymentProofsTable).where(and(eq(paymentProofsTable.id, proofId), eq(paymentProofsTable.bookingId, bookingId))).limit(1);
      if (!proof) return { kind: "proof_not_found" as const };
      if (proof.status !== "submitted") return { kind: "already_reviewed" as const };

      const [updatedProof] = await tx.update(paymentProofsTable)
        .set({ status: "confirmed", reviewedBy: authUser.id, reviewedAt: new Date(), updatedAt: new Date() })
        .where(and(eq(paymentProofsTable.id, proofId), eq(paymentProofsTable.status, "submitted")))
        .returning();
      if (!updatedProof) return { kind: "already_reviewed" as const };

      const [totals] = await tx.select({
        confirmed: sql<string>`coalesce(sum(${paymentProofsTable.amount}), 0)`,
      }).from(paymentProofsTable).where(and(eq(paymentProofsTable.bookingId, bookingId), eq(paymentProofsTable.status, "confirmed")));
      const fullyPaid = Number(totals?.confirmed ?? 0) >= Number(booking.price) - 0.0001;
      const [updatedBooking] = fullyPaid
        ? await tx.update(bookingsTable).set({ paymentStatus: "paid", updatedAt: new Date() }).where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.paymentStatus, "pending"))).returning()
        : [booking];

      return { kind: "ok" as const, proof: updatedProof, booking: updatedBooking ?? booking };
    });

    if (result.kind === "not_found") return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (result.kind === "forbidden") return res.status(403).json({ ok: false, error: "unauthorized_action" });
    if (result.kind === "closed") return res.status(409).json({ ok: false, error: "consultation_closed" });
    if (result.kind === "proof_not_found") return res.status(404).json({ ok: false, error: "payment_proof_not_found" });
    if (result.kind === "already_reviewed") return res.status(409).json({ ok: false, error: "payment_proof_already_reviewed" });

    return res.json({ ok: true, proof: result.proof, booking: result.booking, message: "تم تأكيد استلام الدفعة." });
  } catch (error) {
    console.error("Confirm Payment Proof Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const rejectPaymentProof = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    if (authUser.role !== "lawyer" && authUser.role !== "admin") return res.status(403).json({ ok: false, error: "lawyer_or_admin_only" });

    const bookingId = String(req.params.id ?? "");
    const proofId = String(req.params.proofId ?? "");
    const rejectionReason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
    if (!rejectionReason) return res.status(400).json({ ok: false, error: "rejection_reason_required" });

    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (!booking) return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (authUser.role === "lawyer" && booking.lawyerId !== authUser.id) return res.status(403).json({ ok: false, error: "unauthorized_action" });
    if (CLOSED_BOOKING_STATUSES.includes(booking.status as (typeof CLOSED_BOOKING_STATUSES)[number]) || booking.paymentStatus === "paid") {
      return res.status(409).json({ ok: false, error: "consultation_closed" });
    }

    const [updatedProof] = await db.update(paymentProofsTable).set({
      status: "rejected",
      rejectionReason,
      reviewedBy: authUser.id,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    }).where(and(
      eq(paymentProofsTable.id, proofId),
      eq(paymentProofsTable.bookingId, bookingId),
      eq(paymentProofsTable.status, "submitted"),
    )).returning();
    if (!updatedProof) return res.status(404).json({ ok: false, error: "payment_proof_not_found_or_already_reviewed" });

    return res.json({ ok: true, proof: updatedProof, message: "تم رفض إثبات الدفع. يرجى مراجعة سبب الرفض مع العميل." });
  } catch (error) {
    console.error("Reject Payment Proof Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
