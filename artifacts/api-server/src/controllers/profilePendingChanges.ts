import { type Request, type Response } from "express";
import { db, lawyerProfileChangeRequestsTable, withUeb } from "@workspace/db";
import { and, eq, inArray } from "drizzle-orm";

/**
 * ID-01-B protected-path controller.
 *
 * The trusted actor is sourced exclusively from requireAuth's req.authUser.
 * The database read is executed only inside the UEB-owned transaction.
 */
export async function getPendingChanges(req: Request, res: Response) {
  const { authUser } = req;
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ ok: false, error: "غير مصرح" });
  }

  const userId = authUser.userId;
  if (authUser.role !== "lawyer") {
    return res.json({ ok: true, requests: [] });
  }

  try {
    const requests = await withUeb(
      db,
      { id: userId, role: authUser.role },
      async (tx) => {
        const rows = await tx
          .select({
            id: lawyerProfileChangeRequestsTable.id,
            field: lawyerProfileChangeRequestsTable.field,
            newValue: lawyerProfileChangeRequestsTable.newValue,
            status: lawyerProfileChangeRequestsTable.status,
            rejectionNote: lawyerProfileChangeRequestsTable.rejectionNote,
            reviewedBy: lawyerProfileChangeRequestsTable.reviewedBy,
            createdAt: lawyerProfileChangeRequestsTable.createdAt,
          })
          .from(lawyerProfileChangeRequestsTable)
          .where(
            and(
              eq(lawyerProfileChangeRequestsTable.lawyerId, userId),
              inArray(lawyerProfileChangeRequestsTable.status, [
                "pending",
                "rejected",
              ]),
            ),
          )
          .orderBy(lawyerProfileChangeRequestsTable.createdAt);

        const filtered = rows.filter(
          (row) =>
            row.status === "pending" ||
            (row.status === "rejected" && row.reviewedBy !== null),
        );

        const byField = new Map<string, (typeof filtered)[0]>();
        for (const row of filtered) {
          const existing = byField.get(row.field);
          if (!existing) {
            byField.set(row.field, row);
          } else if (row.status === "pending") {
            byField.set(row.field, row);
          } else if (existing.status === "rejected") {
            byField.set(row.field, row);
          }
        }

        return Array.from(byField.values()).map(
          ({ reviewedBy: _reviewedBy, ...rest }) => rest,
        );
      },
    );

    return res.json({ ok: true, requests });
  } catch (err) {
    req.log.error(err, "getPendingChanges failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
