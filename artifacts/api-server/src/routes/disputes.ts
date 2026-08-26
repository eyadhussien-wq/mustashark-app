import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { requireAdmin } from "../middlewares/requireAdmin";
import { getDisputeController, transitionDisputeController } from "../controllers/disputes";

const router = Router();
const requireParticipant = requireRole("client", "lawyer", "admin");

router.get("/disputes/:disputeId", requireAuth, requireParticipant, getDisputeController);
router.post("/disputes/:disputeId/transition", requireAuth, requireParticipant, transitionDisputeController);

export default router;
