export * from "./users.ts";
export * from "./offices.ts";
export * from "./bookings.ts";
export * from "./lawyerAvailability.ts";
export * from "./bookingTimeBlocks.ts";
export * from "./platformDues.ts";
export * from "./lawyerDeletionRequests.ts";
export * from "./lawyerProfileChangeRequests.ts";
export * from "./lawyerReviews.ts";
export * from "./adminAuditLogs.ts";
export * from "./accountStatusHistory.ts";
export * from "./consultationEvents.ts";
export * from "./consultationRescheduleRequests.ts";
export * from "./lawyerBankAccounts.ts";
export * from "./userNotifications.ts";
export * from "./representationFinance.ts";
export * from "./representationQuoteRequests.ts";
export * from "./lawyerProposals.ts";
export * from "./documentHandovers.ts";
export * from "./caseMemberships.ts";
export * from "./paymentProofs.ts";
export * from "./idempotencyKeys.ts";
export * from "./bookingReminderDeliveries.ts";
export * from "./agreements.ts";
export * from "./legalRepresentationDocuments.ts";
export * from "./cases.ts";
export * from "./caseHearings.ts";
export * from "./lawyerVerifications.ts";
export * from "./terms.ts";
export * from "./lawyerClients.ts";
export * from "./neutralMatters.ts";
export * from "./neutralDocuments.ts";
export * from "./neutralAuditEvents.ts";
export * from "./neutralSecurityAlerts.ts";
export * from "./disputes.ts";

// Keep these availability/booking tables explicitly exported as part of the
// public DB schema surface. This avoids project-reference/declaration emit
// edge cases where wildcard re-exports are not visible to consumers.
export { lawyerAvailabilityTable } from "./lawyerAvailability.ts";
export { bookingTimeBlocksTable } from "./bookingTimeBlocks.ts";
