import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { requireApprovedLawyer } from "../middlewares/requireApprovedLawyer";
import { createMilestoneProofController } from "../controllers/createMilestoneProof";

const router = Router();

router.post(
  "/representation-milestones/:milestoneId/proofs",
  requireAuth,
  requireRole("lawyer"),
  requireApprovedLawyer,
  createMilestoneProofController,
);

export default router;
