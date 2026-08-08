import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth"; // تأكد من المسار الصحيح لملف المصادقة لديك
import {
  confirmBooking,
  recordJoin,
  checkLawyerAbsence,
} from "../controllers/bookings";

const bookingsRouter = Router();

// تطبيق المصادقة الإجبارية على جميع مسارات الحجوزات الحساسة
bookingsRouter.post("/bookings/confirm", requireAuth, confirmBooking);
bookingsRouter.post("/bookings/join", requireAuth, recordJoin);
bookingsRouter.post("/bookings/check-absence", requireAuth, checkLawyerAbsence);

export default bookingsRouter;
