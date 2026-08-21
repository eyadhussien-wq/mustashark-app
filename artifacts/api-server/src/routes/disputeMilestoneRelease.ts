import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { disputeMilestoneReleaseController } from "../controllers/disputeMilestoneRelease";

const router = Router();

router.post(
  "/representation-release-requests/:releaseRequestId/dispute",
  requireAuth,
  requireRole("client"),
  disputeMilestoneReleaseController,
);

export default router;
