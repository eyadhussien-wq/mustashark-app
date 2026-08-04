/**
 * Periodic job: hard-delete client accounts whose 30-day deletion window has closed.
 *
 * Flow:
 *   1. Find users where role='client', deletedAt IS NOT NULL, deletionScheduledAt < NOW()
 *   2. For each, null out bookings.clientId (preserve audit records)
 *   3. Delete the user row
 *
 * Run on startup and then every PURGE_INTERVAL_MS thereafter.
 */

import { db } from "@workspace/db";
import { usersTable, bookingsTable } from "@workspace/db";
import { and, eq, isNotNull, lt, sql } from "drizzle-orm";
import { logger } from "../lib/logger";

const PURGE_INTERVAL_MS = 60 * 60 * 1000; // every hour

async function runPurge(): Promise<void> {
  const now = new Date();

  // Find all expired soft-deleted client accounts
  const expired = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(
      and(
        eq(usersTable.role, "client"),
        isNotNull(usersTable.deletedAt),
        isNotNull(usersTable.deletionScheduledAt),
        lt(usersTable.deletionScheduledAt, now),
      ),
    );

  if (expired.length === 0) return;

  logger.info({ count: expired.length }, "purging expired client accounts");

  for (const { id } of expired) {
    try {
      await db.transaction(async (tx) => {
        // Anonymise booking references — preserve financial/audit history
        await tx
          .update(bookingsTable)
          .set({ clientId: null })
          .where(eq(bookingsTable.clientId, id));

        // Remove the user row (PII purge)
        await tx.delete(usersTable).where(eq(usersTable.id, id));
      });

      logger.info({ clientId: id }, "expired client account purged");
    } catch (err) {
      logger.error({ err, clientId: id }, "failed to purge expired client account");
    }
  }
}

export function startClientPurgeJob(): void {
  // Run once at startup (catches any accounts that expired while server was down)
  runPurge().catch((err) =>
    logger.error({ err }, "initial client purge run failed"),
  );

  // Then run periodically
  setInterval(() => {
    runPurge().catch((err) =>
      logger.error({ err }, "scheduled client purge run failed"),
    );
  }, PURGE_INTERVAL_MS);
}
