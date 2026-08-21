import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { createMilestoneReleaseRequestController } from "../controllers/createMilestoneReleaseRequest";

const router = Router();

router.post(
  "/representation-milestones/:milestoneId/release-requests",
  requireAuth,
  requireRole("client"),
  createMilestoneReleaseRequestController,
);

export default router;
