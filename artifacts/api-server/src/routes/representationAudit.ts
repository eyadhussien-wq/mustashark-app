import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { listAgreementAuditTrail, listCaseAuditTrail } from "../controllers/representationAudit";

const router = Router();
const requireClientLawyerAdmin = requireRole("client", "lawyer", "admin");

router.get("/cases/:id/audit-trail", requireAuth, requireClientLawyerAdmin, listCaseAuditTrail);
router.get("/agreements/:id/audit-trail", requireAuth, requireClientLawyerAdmin, listAgreementAuditTrail);

export default router;
