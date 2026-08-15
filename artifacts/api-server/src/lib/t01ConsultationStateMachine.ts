import type { Booking } from "@workspace/db/schema";

/**
 * Canonical T01 consultation lifecycle.
 *
 * The current database intentionally keeps payment/escrow state separate from
 * booking.status. Therefore this registry derives the canonical T01 state
 * without forcing unrelated financial states into the booking_status enum.
 */
export const T01_STATES = [
  "DRAFT",
  "PAYMENT_PENDING",
  "PENDING_ACCEPTANCE",
  "SCHEDULED",
  "IN_PROGRESS",
  "COMPLETED",
  "CLOSED",
  "REJECTED",
  "CANCELLED",
  "EXPIRED",
  "DISPUTED",
] as const;

export type T01State = (typeof T01_STATES)[number];

export const T01_EVENTS = [
  "SUBMIT_CONSULTATION",
  "PAYMENT_SUCCESS",
  "PAYMENT_FAILED",
  "LAWYER_ACCEPT",
  "LAWYER_REJECT",
  "TIMEOUT_EXPIRED",
  "START_SESSION",
  "CLIENT_CANCEL",
  "LAWYER_COMPLETE",
  "CLIENT_APPROVE",
  "AUTO_CLOSE_TIMEOUT",
  "RAISE_DISPUTE",
] as const;

export type T01Event = (typeof T01_EVENTS)[number];

export const ALLOWED_T01_TRANSITIONS: Readonly<Record<T01State, readonly T01State[]>> = {
  DRAFT: ["PAYMENT_PENDING"],
  PAYMENT_PENDING: ["PENDING_ACCEPTANCE", "DRAFT"],
  PENDING_ACCEPTANCE: ["SCHEDULED", "REJECTED", "EXPIRED"],
  SCHEDULED: ["IN_PROGRESS", "CANCELLED", "DISPUTED"],
  IN_PROGRESS: ["COMPLETED", "DISPUTED"],
  COMPLETED: ["CLOSED", "DISPUTED"],
  CLOSED: [],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
  DISPUTED: ["CLOSED", "CANCELLED"],
};

export type T01BookingSnapshot = Pick<
  Booking,
  | "status"
  | "paymentStatus"
  | "escrowStatus"
  | "lawyerJoinedAt"
  | "clientJoinedAt"
>;

/**
 * Maps the existing storage model to the canonical T01 state machine.
 *
 * - pending + unpaid => PAYMENT_PENDING
 * - pending + paid => PENDING_ACCEPTANCE
 * - accepted + no participant joined => SCHEDULED
 * - accepted + a participant joined => IN_PROGRESS
 * - completed + released escrow => CLOSED
 * - completed otherwise => COMPLETED
 */
export function getT01State(booking: T01BookingSnapshot): T01State {
  switch (booking.status) {
    case "rejected":
      return "REJECTED";
    case "cancelled_by_client":
    case "cancelled_by_lawyer":
      return "CANCELLED";
    case "disputed":
      return "DISPUTED";
    case "refunded_absent":
      return "CANCELLED";
    case "pending":
      return booking.paymentStatus === "paid" ? "PENDING_ACCEPTANCE" : "PAYMENT_PENDING";
    case "accepted":
      return booking.lawyerJoinedAt || booking.clientJoinedAt ? "IN_PROGRESS" : "SCHEDULED";
    case "completed":
      return booking.escrowStatus === "released" ? "CLOSED" : "COMPLETED";
    case "no_show_lawyer":
    case "no_show_client":
      return "CANCELLED";
    default:
      return "PAYMENT_PENDING";
  }
}

export function canTransitionT01(from: T01State, to: T01State): boolean {
  return ALLOWED_T01_TRANSITIONS[from].includes(to);
}

export function assertT01Transition(from: T01State, to: T01State): void {
  if (!canTransitionT01(from, to)) {
    throw new Error(`INVALID_T01_TRANSITION:${from}->${to}`);
  }
}

export function financialEffectRequiresGate(event: T01Event): boolean {
  return [
    "PAYMENT_SUCCESS",
    "LAWYER_REJECT",
    "TIMEOUT_EXPIRED",
    "CLIENT_CANCEL",
    "CLIENT_APPROVE",
    "AUTO_CLOSE_TIMEOUT",
    "RAISE_DISPUTE",
  ].includes(event);
}
