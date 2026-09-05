import { and, desc, eq, isNull } from "drizzle-orm";
import { db, notificationsTable } from "@workspace/db";
import type { DbTransactionOptions } from "../db/transactionContext.types";
import type { DbTransaction } from "../db/transactionContext.types";

export type ListNotificationsInput = {
  userId: string;
};

export type MarkNotificationReadInput = {
  userId: string;
  notificationId: string;
};

async function executeListNotifications(
  input: ListNotificationsInput,
  tx: DbTransaction,
) {
  return tx
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, input.userId))
    .orderBy(desc(notificationsTable.createdAt))
    .limit(50);
}

export async function listNotificationsService(
  input: ListNotificationsInput,
  options: DbTransactionOptions = {},
) {
  if (options.tx) {
    return executeListNotifications(input, options.tx);
  }

  return db.transaction((tx) => executeListNotifications(input, tx));
}

async function executeMarkNotificationRead(
  input: MarkNotificationReadInput,
  tx: DbTransaction,
) {
  const [updated] = await tx
    .update(notificationsTable)
    .set({ readAt: new Date() })
    .where(
      and(
        eq(notificationsTable.id, input.notificationId),
        eq(notificationsTable.userId, input.userId),
        isNull(notificationsTable.readAt),
      ),
    )
    .returning();

  return updated;
}

export async function markNotificationReadService(
  input: MarkNotificationReadInput,
  options: DbTransactionOptions = {},
) {
  if (options.tx) {
    return executeMarkNotificationRead(input, options.tx);
  }

  return db.transaction((tx) => executeMarkNotificationRead(input, tx));
}
