import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { requireApprovedLawyer } from "../middlewares/requireApprovedLawyer";
import {
  createCaseController,
  getCaseController,
  transitionCaseController,
} from "../controllers/cases";

const router = Router();
const requireClientLawyerOrAdmin = requireRole("client", "lawyer", "admin");

router.post(
  "/agreements/:agreementId/case",
  requireAuth,
  requireClientLawyerOrAdmin,
  requireApprovedLawyer,
  createCaseController,
);

router.get(
  "/cases/:id",
  requireAuth,
  requireClientLawyerOrAdmin,
  getCaseController,
);

router.post(
  "/cases/:id/transition",
  requireAuth,
  requireClientLawyerOrAdmin,
  requireApprovedLawyer,
  transitionCaseController,
);

export default router;
