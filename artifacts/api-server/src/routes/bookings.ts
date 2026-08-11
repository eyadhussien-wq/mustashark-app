import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { createBooking, confirmBooking, recordJoin, checkLawyerAbsence, getBookingById, completeBooking, disputeBooking } from "../controllers/bookings";
import { createEmailBooking } from "../controllers/emailBooking";
import { claimLawyerNoShow, refundLawyerNoShow, getSmartTransferOptions, transferLawyerNoShowBooking } from "../controllers/lawyerNoShow";

const bookingsRouter = Router();

const requireClient = requireRole("client");
const requireLawyer = requireRole("lawyer");
const requireClientOrLawyer = requireRole("client", "lawyer");

bookingsRouter.post("/bookings/email", requireAuth, requireClient, createEmailBooking);
bookingsRouter.post("/bookings", requireAuth, requireClient, createBooking);
bookingsRouter.get("/bookings/:id", requireAuth, requireClientOrLawyer, getBookingById);
bookingsRouter.post("/bookings/confirm", requireAuth, requireLawyer, confirmBooking);
bookingsRouter.post("/bookings/join", requireAuth, requireClientOrLawyer, recordJoin);
bookingsRouter.post("/bookings/check-absence", requireAuth, requireClient, checkLawyerAbsence);
bookingsRouter.post("/bookings/complete", requireAuth, requireLawyer, completeBooking);
bookingsRouter.post("/bookings/dispute", requireAuth, requireClientOrLawyer, disputeBooking);

// Lawyer no-show recovery belongs to the affected client. Administrative
// recovery, when needed, must use a dedicated admin workflow rather than
// widening these client endpoints.
bookingsRouter.post("/bookings/:id/no-show", requireAuth, requireClient, claimLawyerNoShow);
bookingsRouter.post("/bookings/:id/no-show/refund", requireAuth, requireClient, refundLawyerNoShow);
bookingsRouter.get("/bookings/:id/no-show/transfer-options", requireAuth, requireClient, getSmartTransferOptions);
bookingsRouter.post("/bookings/:id/no-show/transfer", requireAuth, requireClient, transferLawyerNoShowBooking);

export default bookingsRouter;
