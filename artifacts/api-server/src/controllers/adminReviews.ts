import { type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, lawyerReviewsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { z } from "zod/v4";

// ── GET /api/admin/reviews ────────────────────────────────────────────────────
// Lists text reviews pending moderation (commentStatus = 'pending')

export async function listPendingReviews(req: Request, res: Response) {
  try {
    // Two aliased joins: one for the client, one for the lawyer
    const clientTable = usersTable;
    const lawyerTable = usersTable;

    const rows = await db.execute(sql`
      SELECT
        r.id,
        r.stars,
        r.comment,
        r.comment_status AS "commentStatus",
        r.created_at AS "createdAt",
        c.name AS "clientName",
        c.email AS "clientEmail",
        l.name AS "lawyerName",
        l.email AS "lawyerEmail"
      FROM lawyer_reviews r
      JOIN users c ON c.id = r.client_id
      JOIN users l ON l.id = r.lawyer_id
      WHERE r.comment_status = 'pending'
      ORDER BY r.created_at ASC
    `);

    const reviews = rows.rows as {
      id: string;
      stars: number;
      comment: string;
      commentStatus: string;
      createdAt: string;
      clientName: string;
      clientEmail: string;
      lawyerName: string;
      lawyerEmail: string;
    }[];

    return res.json({ ok: true, reviews, count: reviews.length });
  } catch (err) {
    req.log.error(err, "listPendingReviews failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── POST /api/admin/reviews/:id/approve ──────────────────────────────────────

export async function approveReview(req: Request, res: Response) {
  const id = req.params.id as string;

  try {
    const [review] = await db
      .select()
      .from(lawyerReviewsTable)
      .where(eq(lawyerReviewsTable.id, id))
      .limit(1);

    if (!review) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }
    if (review.commentStatus !== "pending") {
      return res.status(409).json({ ok: false, error: "already_moderated" });
    }

    await db
      .update(lawyerReviewsTable)
      .set({
        commentStatus: "approved",
        reviewedBy: req.admin?.userId ?? null,
        reviewedAt: new Date(),
      })
      .where(
        and(
          eq(lawyerReviewsTable.id, id),
          eq(lawyerReviewsTable.commentStatus, "pending"),
        ),
      );

    req.log.info({ reviewId: id }, "review comment approved");
    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "approveReview failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── POST /api/admin/reviews/:id/reject ───────────────────────────────────────
// Marks the comment as rejected silently — stars still count in aggregates

export async function rejectReview(req: Request, res: Response) {
  const id = req.params.id as string;

  try {
    const [review] = await db
      .select()
      .from(lawyerReviewsTable)
      .where(eq(lawyerReviewsTable.id, id))
      .limit(1);

    if (!review) {
      return res.status(404).json({ ok: false, error: "not_found" });
    }
    if (review.commentStatus !== "pending") {
      return res.status(409).json({ ok: false, error: "already_moderated" });
    }

    await db
      .update(lawyerReviewsTable)
      .set({
        commentStatus: "rejected",
        reviewedBy: req.admin?.userId ?? null,
        reviewedAt: new Date(),
      })
      .where(
        and(
          eq(lawyerReviewsTable.id, id),
          eq(lawyerReviewsTable.commentStatus, "pending"),
        ),
      );

    req.log.info({ reviewId: id }, "review comment rejected");
    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "rejectReview failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

