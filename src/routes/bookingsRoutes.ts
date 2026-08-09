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
  cancelBooking,
} from "../controllers/bookingsController";

const router = Router();

// تطبيق حماية المصادقة على جميع مسارات الحجوزات أدناه
router.use(requireAuth);

router.post("/", createBooking);
router.post("/confirm", confirmBooking);
router.post("/join", recordJoin);
router.post("/check-absence", checkLawyerAbsence);
router.get("/:id", getBookingById);
router.post("/complete", completeBooking);
router.post("/dispute", disputeBooking);
router.post("/cancel", cancelBooking);

export default router;
