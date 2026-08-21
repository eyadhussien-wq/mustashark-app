import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { allocateMilestoneController } from "../controllers/allocateMilestone";

const router = Router();

router.post(
  "/representation-milestones/:milestoneId/allocate",
  requireAuth,
  requireRole("client"),
  allocateMilestoneController,
);

export default router;
