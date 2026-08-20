import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import {
  createCaseController,
  getCaseController,
  transitionCaseController,
} from "../controllers/cases";

const router = Router();
const requireClientLawyerOrAdmin = requireRole("client", "lawyer", "admin");

router.post(
  "/agreements/:agreementId/case",
  requireAuth,
  requireClientLawyerOrAdmin,
  createCaseController,
);

router.get(
  "/cases/:id",
  requireAuth,
  requireClientLawyerOrAdmin,
  getCaseController,
);

router.post(
  "/cases/:id/transition",
  requireAuth,
  requireClientLawyerOrAdmin,
  transitionCaseController,
);

export default router;
