import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { listMyClients } from "../controllers/lawyerClients";

const router = Router();
const requireLawyer = requireRole("lawyer");

router.get("/lawyers/me/clients", requireAuth, requireLawyer, listMyClients);

export default router;
