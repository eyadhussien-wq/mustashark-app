import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { fundMilestoneController } from "../controllers/fundMilestone";

const router = Router();

router.post(
  "/representation-milestones/:milestoneId/fund",
  requireAuth,
  requireRole("client"),
  fundMilestoneController,
);

export default router;
