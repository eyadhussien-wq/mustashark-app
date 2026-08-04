import { Router } from "express";
import {
  confirmBooking,
  recordJoin,
  checkLawyerAbsence,
  cancelBookingByLawyer,
} from "../controllers/bookings";

const bookingsRouter = Router();

bookingsRouter.post("/bookings/confirm", confirmBooking);
bookingsRouter.post("/bookings/join", recordJoin);
bookingsRouter.post("/bookings/check-absence", checkLawyerAbsence);
bookingsRouter.post("/bookings/cancel-by-lawyer", cancelBookingByLawyer);

export default bookingsRouter;