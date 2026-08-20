import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { refundMilestoneController } from "../controllers/refundMilestone";

const router = Router();

router.post(
  "/representation-milestones/:milestoneId/refund",
  requireAuth,
  requireRole("client"),
  refundMilestoneController,
);

export default router;
