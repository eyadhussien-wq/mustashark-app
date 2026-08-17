import crypto from "crypto";
import { bookingReminderDeliveriesTable } from "@workspace/db/schema";

export type ReminderDeliveryChannel = "in_app" | "email" | "whatsapp" | (string & {});

export type ClaimBookingReminderInput = {
  bookingId: string;
  recipientUserId: string;
  channel: ReminderDeliveryChannel;
  reminderType: string;
  scheduledOccurrence: Date;
  metadata?: Record<string, unknown>;
};

/**
 * Atomically claims one reminder occurrence.
 *
 * The database uniqueness constraint is the concurrency gate. Multiple
 * workers may call this function simultaneously; exactly one claim can be
 * inserted for the same booking/recipient/channel/type/occurrence tuple.
 */
export async function claimBookingReminderDelivery(tx: any, input: ClaimBookingReminderInput) {
  const [claimed] = await tx
    .insert(bookingReminderDeliveriesTable)
    .values({
      id: crypto.randomUUID(),
      bookingId: input.bookingId,
      recipientUserId: input.recipientUserId,
      channel: input.channel,
      reminderType: input.reminderType,
      scheduledOccurrence: input.scheduledOccurrence,
      status: "claimed",
      attemptCount: 1,
      metadata: input.metadata ?? null,
    })
    .onConflictDoNothing({
      target: [
        bookingReminderDeliveriesTable.bookingId,
        bookingReminderDeliveriesTable.recipientUserId,
        bookingReminderDeliveriesTable.channel,
        bookingReminderDeliveriesTable.reminderType,
        bookingReminderDeliveriesTable.scheduledOccurrence,
      ],
    })
    .returning();

  return claimed ?? null;
}
