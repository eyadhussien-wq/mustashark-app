import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { listPaymentProofs, submitPaymentProof, confirmPaymentProof, rejectPaymentProof } from "../controllers/paymentProofs";

const router = Router();
const requireClient = requireRole("client");
const requireLawyerOrAdmin = requireRole("lawyer", "admin");
const requireClientLawyerOrAdmin = requireRole("client", "lawyer", "admin");

router.get("/bookings/:id/payment-proofs", requireAuth, requireClientLawyerOrAdmin, listPaymentProofs);
router.post("/bookings/:id/payment-proofs", requireAuth, requireClient, submitPaymentProof);
router.post("/bookings/:id/payment-proofs/:proofId/confirm", requireAuth, requireLawyerOrAdmin, confirmPaymentProof);
router.post("/bookings/:id/payment-proofs/:proofId/reject", requireAuth, requireLawyerOrAdmin, rejectPaymentProof);

export default router;
