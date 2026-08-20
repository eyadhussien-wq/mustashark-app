import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { releaseMilestoneController } from "../controllers/releaseMilestone";

const router = Router();

router.post(
  "/representation-release-requests/:releaseRequestId/release",
  requireAuth,
  requireRole("client"),
  releaseMilestoneController,
);

export default router;
