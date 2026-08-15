import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { requireIdempotencyKey } from "../middlewares/idempotency";
import { listMyBookings, recordJoin, checkLawyerAbsence, getBookingById, completeBooking, disputeBooking, cancelBooking } from "../controllers/bookings";
import { createBookingSafely } from "../controllers/safeBooking";
import { confirmBookingSafely } from "../controllers/safeConfirmBooking";
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
bookingsRouter.post("/bookings/confirm", requireAuth, requireLawyerOrAdmin, requireIdempotencyKey, confirmBookingSafely);
bookingsRouter.post("/bookings/join", requireAuth, requireClientOrLawyer, requireIdempotencyKey, recordJoin);
bookingsRouter.post("/bookings/check-absence", requireAuth, requireClientOrAdmin, requireIdempotencyKey, checkLawyerAbsence);
bookingsRouter.post("/bookings/complete", requireAuth, requireLawyerOrAdmin, requireIdempotencyKey, completeBooking);
bookingsRouter.post("/bookings/dispute", requireAuth, requireClientLawyerOrAdmin, requireIdempotencyKey, disputeBooking);
bookingsRouter.post("/bookings/cancel", requireAuth, requireClientOrLawyer, requireIdempotencyKey, cancelBooking);

bookingsRouter.post("/bookings/:id/no-show", requireAuth, requireClientOrAdmin, requireIdempotencyKey, claimLawyerNoShow);
bookingsRouter.post("/bookings/:id/no-show/refund", requireAuth, requireClient, requireIdempotencyKey, refundLawyerNoShow);
bookingsRouter.get("/bookings/:id/no-show/transfer-options", requireAuth, requireClient, getSmartTransferOptions);
bookingsRouter.post("/bookings/:id/no-show/transfer", requireAuth, requireClient, requireIdempotencyKey, transferLawyerNoShowBooking);

export default bookingsRouter;
