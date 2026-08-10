import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import {
  createBooking,
  confirmBooking,
  recordJoin,
  checkLawyerAbsence,
  getBookingById,
  completeBooking,
  disputeBooking,
} from "../controllers/bookings";

const bookingsRouter = Router();

// All booking lifecycle operations require an authenticated user.
bookingsRouter.post("/bookings", requireAuth, createBooking);
bookingsRouter.get("/bookings/:id", requireAuth, getBookingById);
bookingsRouter.post("/bookings/confirm", requireAuth, confirmBooking);
bookingsRouter.post("/bookings/join", requireAuth, recordJoin);
bookingsRouter.post("/bookings/check-absence", requireAuth, checkLawyerAbsence);
bookingsRouter.post("/bookings/complete", requireAuth, completeBooking);
bookingsRouter.post("/bookings/dispute", requireAuth, disputeBooking);

export default bookingsRouter;
