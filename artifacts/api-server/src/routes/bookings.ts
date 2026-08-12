import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { listMyBookings, recordJoin, checkLawyerAbsence, getBookingById, completeBooking, disputeBooking } from "../controllers/bookings";
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

bookingsRouter.post("/bookings/email", requireAuth, requireClient, createEmailBooking);
bookingsRouter.post("/bookings", requireAuth, requireClient, createBookingSafely);
bookingsRouter.get("/bookings", requireAuth, requireClientLawyerOrAdmin, listMyBookings);
bookingsRouter.get("/bookings/:id", requireAuth, requireClientLawyerOrAdmin, getBookingById);
bookingsRouter.post("/bookings/confirm", requireAuth, requireLawyerOrAdmin, confirmBookingSafely);
bookingsRouter.post("/bookings/join", requireAuth, requireClientOrLawyer, recordJoin);
bookingsRouter.post("/bookings/check-absence", requireAuth, requireClientOrAdmin, checkLawyerAbsence);
bookingsRouter.post("/bookings/complete", requireAuth, requireLawyerOrAdmin, completeBooking);
bookingsRouter.post("/bookings/dispute", requireAuth, requireClientLawyerOrAdmin, disputeBooking);

bookingsRouter.post("/bookings/:id/no-show", requireAuth, requireClientOrAdmin, claimLawyerNoShow);
bookingsRouter.post("/bookings/:id/no-show/refund", requireAuth, requireClient, refundLawyerNoShow);
bookingsRouter.get("/bookings/:id/no-show/transfer-options", requireAuth, requireClient, getSmartTransferOptions);
bookingsRouter.post("/bookings/:id/no-show/transfer", requireAuth, requireClient, transferLawyerNoShowBooking);

export default bookingsRouter;
