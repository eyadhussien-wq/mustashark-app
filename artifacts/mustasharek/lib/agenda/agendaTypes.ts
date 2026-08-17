export type AgendaStatus =
  | "PAYMENT_PENDING"
  | "PENDING_ACCEPTANCE"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "DISPUTED";

export type AgendaItem = {
  bookingId: string;
  subject: string;
  type: "video" | "chat" | "phone";
  status: AgendaStatus;
  startsAtUtc: string;
  displayTimezone: string;
  lawyerId: string;
  clientId: string;
  reminderState: "none" | "scheduled" | "sent";
};

export type AgendaDay = {
  dateKey: string;
  timezone: string;
  items: AgendaItem[];
};

/** Presentation-only contract. It deliberately does not depend on DB schema fields. */
export type AgendaReadModel = {
  timezone: string;
  days: AgendaDay[];
};
