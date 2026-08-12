export * from "./users";
export * from "./offices";
export * from "./bookings";
export * from "./lawyerAvailability";
export * from "./bookingTimeBlocks";
export * from "./platformDues";
export * from "./lawyerDeletionRequests";
export * from "./lawyerProfileChangeRequests";
export * from "./lawyerReviews";
export * from "./adminAuditLogs";
export * from "./accountStatusHistory";
export * from "./consultationEvents";
export * from "./consultationRescheduleRequests";
export * from "./lawyerBankAccounts";
export * from "./userNotifications";
export * from "./representationFinance";
export * from "./documentHandovers";
export * from "./caseMemberships";

// Keep these availability/booking tables explicitly exported as part of the
// public DB schema surface. This avoids project-reference/declaration emit
// edge cases where wildcard re-exports are not visible to consumers.
export { lawyerAvailabilityTable } from "./lawyerAvailability";
export { bookingTimeBlocksTable } from "./bookingTimeBlocks";
