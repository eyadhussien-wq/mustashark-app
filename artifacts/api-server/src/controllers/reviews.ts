import { type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, lawyerReviewsTable, bookingsTable } from "@workspace/db";
import { eq, and, desc, sql } from "drizzle-orm";
import { z } from "zod";

// ── POST /api/reviews ─────────────────────────────────────────────────────────

const submitReviewSchema = z.object({
  consultationId: z.string().min(1),
  lawyerId: z.string().min(1),
  stars: z.number().int().min(1).max(5),
  // comment intentionally excluded — text reviews off by default
});

export async function submitReview(req: Request, res: Response) {
  const { authUser } = req;
  if (!authUser || !authUser.userId || authUser.role !== "client") {
    return res.status(403).json({ ok: false, error: "clients_only" });
  }
  const userId = authUser.userId;

  const parsed = submitReviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "validation_error",
      issues: parsed.error.issues,
    });
  }

  const { consultationId, lawyerId, stars } = parsed.data;

  try {
    // 1. Verify that the consultation/booking actually exists, belongs to this client,
    // involves this lawyer, and is strictly in "completed" status.
    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, consultationId))
      .limit(1);

    if (!booking) {
      return res
        .status(404)
        .json({ ok: false, error: "consultation_not_found" });
    }

    if (booking.clientId !== userId) {
      return res
        .status(403)
        .json({ ok: false, error: "forbidden_not_booking_client" });
    }

    if (booking.lawyerId !== lawyerId) {
      return res.status(400).json({ ok: false, error: "lawyer_mismatch" });
    }

    if (booking.status !== "completed") {
      return res
        .status(400)
        .json({ ok: false, error: "consultation_not_completed" });
    }

    // 2. Verify lawyer exists and is a lawyer
    const [lawyer] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(and(eq(usersTable.id, lawyerId), eq(usersTable.role, "lawyer")))
      .limit(1);

    if (!lawyer) {
      return res.status(404).json({ ok: false, error: "lawyer_not_found" });
    }

    // 3. Check for duplicate review (one per consultation per client)
    const [existing] = await db
      .select({ id: lawyerReviewsTable.id })
      .from(lawyerReviewsTable)
      .where(
        and(
          eq(lawyerReviewsTable.clientId, userId),
          eq(lawyerReviewsTable.consultationId, consultationId),
        ),
      )
      .limit(1);

    if (existing) {
      return res.status(409).json({ ok: false, error: "already_reviewed" });
    }

    await db.transaction(async (tx) => {
      // Insert review
      await tx.insert(lawyerReviewsTable).values({
        id: `rev-${userId.slice(0, 8)}-${Date.now()}`,
        consultationId,
        clientId: userId,
        lawyerId,
        stars,
        commentStatus: "none",
      });

      // Recalculate aggregate and update usersTable in the same transaction
      const [stats] = await tx
        .select({
          count: sql<number>`count(*)::int`,
          avg: sql<string>`round(avg(stars)::numeric, 1)::text`,
        })
        .from(lawyerReviewsTable)
        .where(eq(lawyerReviewsTable.lawyerId, lawyerId));

      await tx
        .update(usersTable)
        .set({
          rating: stats.avg ?? null,
          reviewsCount: stats.count,
          updatedAt: new Date(),
        })
        .where(eq(usersTable.id, lawyerId));
    });

    req.log.info(
      { lawyerId, stars, clientId: userId, consultationId },
      "review submitted securely",
    );
    return res.status(201).json({ ok: true });
  } catch (err: unknown) {
    const dbError = err as {
      code?: unknown;
      constraint?: unknown;
      cause?: {
        code?: unknown;
        constraint?: unknown;
      };
    };
    const code = dbError.code ?? dbError.cause?.code;
    const constraint = dbError.constraint ?? dbError.cause?.constraint;

    if (
      code === "23505" &&
      constraint === "lawyer_reviews_client_consultation_unique"
    ) {
      return res.status(409).json({ ok: false, error: "already_reviewed" });
    }

    req.log.error(err, "submitReview failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── GET /api/lawyers/:id/reviews ──────────────────────────────────────────────

export async function getLawyerReviews(req: Request, res: Response) {
  const lawyerId = req.params.id as string;

  try {
    const [lawyer] = await db
      .select({
        rating: usersTable.rating,
        reviewsCount: usersTable.reviewsCount,
      })
      .from(usersTable)
      .where(and(eq(usersTable.id, lawyerId), eq(usersTable.role, "lawyer")))
      .limit(1);

    if (!lawyer) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }

    // Approved text reviews only, newest first, max 5
    const clientUsers = usersTable;
    const reviews = await db
      .select({
        id: lawyerReviewsTable.id,
        stars: lawyerReviewsTable.stars,
        comment: lawyerReviewsTable.comment,
        createdAt: lawyerReviewsTable.createdAt,
        clientName: clientUsers.name,
      })
      .from(lawyerReviewsTable)
      .innerJoin(clientUsers, eq(lawyerReviewsTable.clientId, clientUsers.id))
      .where(
        and(
          eq(lawyerReviewsTable.lawyerId, lawyerId),
          eq(lawyerReviewsTable.commentStatus, "approved"),
        ),
      )
      .orderBy(desc(lawyerReviewsTable.createdAt))
      .limit(5);

    return res.json({
      ok: true,
      rating: lawyer.rating,
      reviewsCount: lawyer.reviewsCount,
      reviews,
    });
  } catch (err) {
    req.log.error(err, "getLawyerReviews failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
