import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { requireApprovedLawyer } from "../middlewares/requireApprovedLawyer";
import {
  confirmAgreementController,
  createAgreementController,
  createAgreementVersionController,
  getAgreementController,
  publishAgreementVersionController,
} from "../controllers/agreements";

const router = Router();
const requireClientOrLawyer = requireRole("client", "lawyer");
const requireLawyer = requireRole("lawyer");

router.post("/agreements", requireAuth, requireClientOrLawyer, createAgreementController);
router.get("/agreements/:id", requireAuth, requireClientOrLawyer, getAgreementController);
router.post("/agreements/:id/versions", requireAuth, requireLawyer, requireApprovedLawyer, createAgreementVersionController);
router.post(
  "/agreements/:id/versions/:versionId/publish",
  requireAuth,
  requireLawyer,
  requireApprovedLawyer,
  publishAgreementVersionController,
);
router.post("/agreements/:id/confirm", requireAuth, requireClientOrLawyer, confirmAgreementController);

export default router;
