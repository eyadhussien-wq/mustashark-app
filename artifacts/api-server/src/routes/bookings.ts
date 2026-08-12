import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { createBooking, confirmBooking, recordJoin, checkLawyerAbsence, getBookingById, completeBooking, disputeBooking } from "../controllers/bookings";
import { createEmailBooking } from "../controllers/emailBooking";
import { claimLawyerNoShow, refundLawyerNoShow, getSmartTransferOptions, transferLawyerNoShowBooking } from "../controllers/lawyerNoShow";
import { listPaymentProofs, submitPaymentProof, confirmPaymentProof, rejectPaymentProof } from "../controllers/paymentProofs";

const bookingsRouter = Router();

const requireClient = requireRole("client");
const requireLawyer = requireRole("lawyer");
const requireClientOrLawyer = requireRole("client", "lawyer");
const requireClientLawyerOrAdmin = requireRole("client", "lawyer", "admin");
const requireLawyerOrAdmin = requireRole("lawyer", "admin");
const requireClientOrAdmin = requireRole("client", "admin");

bookingsRouter.post("/bookings/email", requireAuth, requireClient, createEmailBooking);
bookingsRouter.post("/bookings", requireAuth, requireClient, createBooking);
bookingsRouter.get("/bookings/:id", requireAuth, requireClientLawyerOrAdmin, getBookingById);
bookingsRouter.get("/bookings/:id/payment-proofs", requireAuth, requireClientLawyerOrAdmin, listPaymentProofs);
bookingsRouter.post("/bookings/:id/payment-proofs", requireAuth, requireClient, submitPaymentProof);
bookingsRouter.post("/bookings/:id/payment-proofs/:proofId/confirm", requireAuth, requireLawyerOrAdmin, confirmPaymentProof);
bookingsRouter.post("/bookings/:id/payment-proofs/:proofId/reject", requireAuth, requireLawyerOrAdmin, rejectPaymentProof);
bookingsRouter.post("/bookings/confirm", requireAuth, requireLawyerOrAdmin, confirmBooking);
bookingsRouter.post("/bookings/join", requireAuth, requireClientOrLawyer, recordJoin);
bookingsRouter.post("/bookings/check-absence", requireAuth, requireClientOrAdmin, checkLawyerAbsence);
bookingsRouter.post("/bookings/complete", requireAuth, requireLawyerOrAdmin, completeBooking);
bookingsRouter.post("/bookings/dispute", requireAuth, requireClientLawyerOrAdmin, disputeBooking);

// Lawyer no-show recovery belongs to the affected client. The claim endpoint
// also permits admin because the controller explicitly supports administrative
// recovery; refund/transfer remain client-owned operations.
bookingsRouter.post("/bookings/:id/no-show", requireAuth, requireClientOrAdmin, claimLawyerNoShow);
bookingsRouter.post("/bookings/:id/no-show/refund", requireAuth, requireClient, refundLawyerNoShow);
bookingsRouter.get("/bookings/:id/no-show/transfer-options", requireAuth, requireClient, getSmartTransferOptions);
bookingsRouter.post("/bookings/:id/no-show/transfer", requireAuth, requireClient, transferLawyerNoShowBooking);

export default bookingsRouter;
