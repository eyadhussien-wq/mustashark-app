import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { getLawyerAvailability, updateMyAvailability, getAvailableSlots } from "../controllers/availability";

const router = Router();
const requireLawyer = requireRole("lawyer");

router.get("/availability/lawyers/:lawyerId", requireAuth, getLawyerAvailability);
router.put("/availability/lawyers/me", requireAuth, requireLawyer, updateMyAvailability);
router.get("/availability/lawyers/:lawyerId/slots", requireAuth, getAvailableSlots);

export default router;
