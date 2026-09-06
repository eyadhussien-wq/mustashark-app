import { type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { db, lawyerProfileChangeRequestsTable, usersTable, withUeb } from "@workspace/db";
import { and, eq } from "drizzle-orm";
import { z } from "zod";

const updateProfileSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  country: z.enum(["qatar", "jordan"]).optional().nullable(),
  specialization: z.string().max(200).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  hourlyRate: z.number().positive("الأتعاب يجب أن تكون قيمة موجبة").optional().nullable(),
});

type ModeratedField = "specialization" | "bio" | "hourlyRate";

export async function updateProfile(req: Request, res: Response) {
  const { authUser } = req;
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ ok: false, error: "غير مصرح" });
  }

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "validation_error",
      issues: parsed.error.issues,
    });
  }

  const { name, phone, country, specialization, bio, hourlyRate } = parsed.data;
  const userId = authUser.userId;

  try {
    const result = await withUeb(
      db,
      { id: userId, role: authUser.role },
      async (tx) => {
        const [currentUser] = await tx
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, userId))
          .limit(1);

        if (!currentUser) {
          return { kind: "not_found" as const };
        }

        const immediateUpdates: Partial<typeof usersTable.$inferInsert> = {
          updatedAt: new Date(),
        };
        if (name !== undefined) immediateUpdates.name = name;
        if (phone !== undefined) immediateUpdates.phone = phone;
        if (country !== undefined) immediateUpdates.country = country;

        const [updated] = await tx
          .update(usersTable)
          .set(immediateUpdates)
          .where(eq(usersTable.id, userId))
          .returning();

        if (!updated) {
          return { kind: "not_found" as const };
        }

        const pendingFields: ModeratedField[] = [];

        if (authUser.role === "lawyer") {
          const requestsToInsert: Array<{
            id: string;
            lawyerId: string;
            field: ModeratedField;
            oldValue: string | null;
            newValue: string | null;
          }> = [];

          const cancelPending = async (field: ModeratedField) => {
            await tx
              .delete(lawyerProfileChangeRequestsTable)
              .where(
                and(
                  eq(lawyerProfileChangeRequestsTable.lawyerId, userId),
                  eq(lawyerProfileChangeRequestsTable.field, field),
                  eq(lawyerProfileChangeRequestsTable.status, "pending"),
                ),
              );
          };

          if (specialization !== undefined) {
            const oldVal = currentUser.specialization ?? null;
            const newVal = specialization ?? null;
            await cancelPending("specialization");
            if (oldVal !== newVal) {
              requestsToInsert.push({
                id: `pcr-${randomUUID()}`,
                lawyerId: userId,
                field: "specialization",
                oldValue: oldVal,
                newValue: newVal,
              });
              pendingFields.push("specialization");
            }
          }

          if (bio !== undefined) {
            const oldVal = currentUser.bio ?? null;
            const newVal = bio ?? null;
            await cancelPending("bio");
            if (oldVal !== newVal) {
              requestsToInsert.push({
                id: `pcr-${randomUUID()}`,
                lawyerId: userId,
                field: "bio",
                oldValue: oldVal,
                newValue: newVal,
              });
              pendingFields.push("bio");
            }
          }

          if (hourlyRate !== undefined) {
            const oldVal = currentUser.hourlyRate ? String(parseFloat(currentUser.hourlyRate)) : null;
            const newVal = hourlyRate !== null ? String(hourlyRate) : null;
            await cancelPending("hourlyRate");
            if (oldVal !== newVal) {
              requestsToInsert.push({
                id: `pcr-${randomUUID()}`,
                lawyerId: userId,
                field: "hourlyRate",
                oldValue: oldVal,
                newValue: newVal,
              });
              pendingFields.push("hourlyRate");
            }
          }

          if (requestsToInsert.length > 0) {
            await tx.insert(lawyerProfileChangeRequestsTable).values(requestsToInsert);
          }
        }

        return {
          kind: "ok" as const,
          pendingFields,
          user: {
            id: updated.id,
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            country: updated.country,
            role: updated.role,
            specialization: updated.specialization,
            bio: updated.bio,
            hourlyRate: updated.hourlyRate ? parseFloat(updated.hourlyRate) : null,
            deletionRejectionNote: updated.deletionRejectionNote,
          },
        };
      },
    );

    if (result.kind === "not_found") {
      return res.status(404).json({ ok: false, error: "user_not_found" });
    }

    req.log.info(
      { userId, pendingFields: result.pendingFields },
      "profile updated (moderated fields queued)",
    );

    return res.json({
      ok: true,
      pendingFields: result.pendingFields,
      user: result.user,
    });
  } catch (err) {
    req.log.error(err, "updateProfile failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
