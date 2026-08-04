import { Router } from "express";
import {
  confirmBooking,
  recordJoin,
  checkLawyerAbsence,
} from "../controllers/bookings";

const bookingsRouter = Router();

bookingsRouter.post("/bookings/confirm", confirmBooking);
bookingsRouter.post("/bookings/join", recordJoin);
bookingsRouter.post("/bookings/check-absence", checkLawyerAbsence);

export default bookingsRouter;