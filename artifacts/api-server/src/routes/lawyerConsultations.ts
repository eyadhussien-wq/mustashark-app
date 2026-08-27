import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { listMyConsultations } from "../controllers/lawyerConsultations";

const router = Router();
const requireLawyer = requireRole("lawyer");

router.get("/lawyers/me/consultations", requireAuth, requireLawyer, listMyConsultations);

export default router;
