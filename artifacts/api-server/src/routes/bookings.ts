import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { createBooking, confirmBooking, recordJoin, checkLawyerAbsence, getBookingById, completeBooking, disputeBooking } from "../controllers/bookings";
import { createEmailBooking } from "../controllers/emailBooking";
import { claimLawyerNoShow, refundLawyerNoShow, getSmartTransferOptions, transferLawyerNoShowBooking } from "../controllers/lawyerNoShow";

const bookingsRouter = Router();

bookingsRouter.post("/bookings/email", requireAuth, createEmailBooking);
bookingsRouter.post("/bookings", requireAuth, createBooking);
bookingsRouter.get("/bookings/:id", requireAuth, getBookingById);
bookingsRouter.post("/bookings/confirm", requireAuth, confirmBooking);
bookingsRouter.post("/bookings/join", requireAuth, recordJoin);
bookingsRouter.post("/bookings/check-absence", requireAuth, checkLawyerAbsence);
bookingsRouter.post("/bookings/complete", requireAuth, completeBooking);
bookingsRouter.post("/bookings/dispute", requireAuth, disputeBooking);

// Lawyer no-show recovery: full refund or free smart transfer.
bookingsRouter.post("/bookings/:id/no-show", requireAuth, claimLawyerNoShow);
bookingsRouter.post("/bookings/:id/no-show/refund", requireAuth, refundLawyerNoShow);
bookingsRouter.get("/bookings/:id/no-show/transfer-options", requireAuth, getSmartTransferOptions);
bookingsRouter.post("/bookings/:id/no-show/transfer", requireAuth, transferLawyerNoShowBooking);

export default bookingsRouter;
