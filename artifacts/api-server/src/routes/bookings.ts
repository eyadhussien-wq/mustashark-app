import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { requireIdempotencyKey } from "../middlewares/idempotency";
import { listMyBookings, recordJoin, checkLawyerAbsence, getBookingById, completeBooking, disputeBooking } from "../controllers/bookings";
import { createBookingSafely } from "../controllers/safeBooking";
import { confirmBookingSafely } from "../controllers/safeConfirmBooking";
import { cancelBookingSafely } from "../controllers/safeCancelBooking";
import { createEmailBooking } from "../controllers/emailBooking";
import { claimLawyerNoShow, refundLawyerNoShow, getSmartTransferOptions, transferLawyerNoShowBooking } from "../controllers/lawyerNoShow";

const bookingsRouter = Router();
const requireClient = requireRole("client");
const requireClientOrLawyer = requireRole("client", "lawyer");
const requireClientLawyerOrAdmin = requireRole("client", "lawyer", "admin");
const requireLawyerOrAdmin = requireRole("lawyer", "admin");
const requireClientOrAdmin = requireRole("client", "admin");

bookingsRouter.post("/bookings/email", requireAuth, requireClient, requireIdempotencyKey, createEmailBooking);
bookingsRouter.post("/bookings", requireAuth, requireClient, requireIdempotencyKey, createBookingSafely);
bookingsRouter.get("/bookings", requireAuth, requireClientLawyerOrAdmin, listMyBookings);
bookingsRouter.get("/bookings/:id", requireAuth, requireClientLawyerOrAdmin, getBookingById);
// Confirm uses transactional idempotency inside the DB transaction; the generic
// HTTP middleware must not claim this key before the financial transaction.
bookingsRouter.post("/bookings/confirm", requireAuth, requireLawyerOrAdmin, confirmBookingSafely);
bookingsRouter.post("/bookings/join", requireAuth, requireClientOrLawyer, requireIdempotencyKey, recordJoin);
bookingsRouter.post("/bookings/check-absence", requireAuth, requireClientOrAdmin, requireIdempotencyKey, checkLawyerAbsence);
bookingsRouter.post("/bookings/complete", requireAuth, requireLawyerOrAdmin, requireIdempotencyKey, completeBooking);
bookingsRouter.post("/bookings/dispute", requireAuth, requireClientLawyerOrAdmin, requireIdempotencyKey, disputeBooking);
// X/1 uses transactional idempotency inside the DB transaction; the generic
// HTTP middleware must not claim this key before the financial transaction.
bookingsRouter.post("/bookings/cancel", requireAuth, requireClientOrLawyer, cancelBookingSafely);

bookingsRouter.post("/bookings/:id/no-show", requireAuth, requireClientOrAdmin, requireIdempotencyKey, claimLawyerNoShow);
bookingsRouter.post("/bookings/:id/no-show/refund", requireAuth, requireClient, requireIdempotencyKey, refundLawyerNoShow);
bookingsRouter.get("/bookings/:id/no-show/transfer-options", requireAuth, requireClient, getSmartTransferOptions);
bookingsRouter.post("/bookings/:id/no-show/transfer", requireAuth, requireClient, requireIdempotencyKey, transferLawyerNoShow);

export default bookingsRouter;
