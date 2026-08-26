import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { addDisputeEvidenceController, listDisputeEvidenceController, reviewDisputeEvidenceController } from "../controllers/disputeEvidence";

const router = Router();
const participant = requireRole("client", "lawyer", "admin");

router.get("/disputes/:disputeId/evidence", requireAuth, participant, listDisputeEvidenceController);
router.post("/disputes/:disputeId/evidence", requireAuth, participant, addDisputeEvidenceController);
router.post("/dispute-evidence/:evidenceId/review", requireAuth, requireRole("admin"), reviewDisputeEvidenceController);

export default router;
