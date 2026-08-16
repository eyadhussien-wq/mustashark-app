import { and, eq, type SQL } from "drizzle-orm";
import { bookingsTable } from "@workspace/db/schema";

/**
 * Atomically updates a booking only when the caller's expected version still
 * matches the database version, then increments the version exactly once.
 * Callers should validate the state/authorization before invoking this helper
 * and pass any additional state guards through `conditions`.
 */
export async function updateBookingWithOptimisticLock(
  tx: any,
  bookingId: string,
  expectedVersion: number,
  changes: Record<string, unknown>,
  conditions: SQL[] = [],
) {
  if (!Number.isInteger(expectedVersion) || expectedVersion < 1) {
    throw new Error("EXPECTED_VERSION_REQUIRED");
  }

  const [updated] = await tx
    .update(bookingsTable)
    .set({
      ...changes,
      version: expectedVersion + 1,
      updatedAt: changes.updatedAt ?? new Date(),
    })
    .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.version, expectedVersion), ...conditions))
    .returning();

  if (!updated) throw new Error("VERSION_CONFLICT");
  return updated;
}
