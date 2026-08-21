import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireApprovedLawyer } from "../middlewares/requireApprovedLawyer";
import { requireRole } from "../middlewares/requireRole";
import {
  createCaseDecisionController,
  listCaseDecisionsController,
  transitionCaseDecisionController,
} from "../controllers/caseDecisions";

const router = Router();
const requireClientLawyerOrAdmin = requireRole("client", "lawyer", "admin");
const requireLawyerOrAdmin = requireRole("lawyer", "admin");

router.post(
  "/cases/:caseId/decisions",
  requireAuth,
  requireLawyerOrAdmin,
  requireApprovedLawyer,
  createCaseDecisionController,
);

router.get(
  "/cases/:caseId/decisions",
  requireAuth,
  requireClientLawyerOrAdmin,
  listCaseDecisionsController,
);

router.post(
  "/cases/:caseId/decisions/:decisionId/transition",
  requireAuth,
  requireLawyerOrAdmin,
  requireApprovedLawyer,
  transitionCaseDecisionController,
);

export default router;
