import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { requireApprovedLawyer } from "../middlewares/requireApprovedLawyer";
import {
  createCaseHearingController,
  listCaseHearingsController,
  transitionCaseHearingController,
} from "../controllers/caseHearings";

const router = Router();
const requireClientLawyerOrAdmin = requireRole("client", "lawyer", "admin");
const requireLawyerOrAdmin = requireRole("lawyer", "admin");

router.post(
  "/cases/:caseId/hearings",
  requireAuth,
  requireLawyerOrAdmin,
  requireApprovedLawyer,
  createCaseHearingController,
);

router.get(
  "/cases/:caseId/hearings",
  requireAuth,
  requireClientLawyerOrAdmin,
  listCaseHearingsController,
);

router.post(
  "/cases/:caseId/hearings/:hearingId/transition",
  requireAuth,
  requireLawyerOrAdmin,
  requireApprovedLawyer,
  transitionCaseHearingController,
);

export default router;
