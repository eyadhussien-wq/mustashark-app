import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { releaseMilestoneController } from "../controllers/releaseMilestone";
import { releaseRequestLookupController } from "../controllers/releaseRequestLookup";

const router = Router();

router.get(
  "/representation-milestones/:milestoneId/release-request",
  requireAuth,
  requireRole("client"),
  releaseRequestLookupController,
);

router.post(
  "/representation-release-requests/:releaseRequestId/release",
  requireAuth,
  requireRole("client"),
  releaseMilestoneController,
);

export default router;
