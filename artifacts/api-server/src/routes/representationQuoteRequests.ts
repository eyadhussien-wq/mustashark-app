import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { createRepresentationQuoteRequest, listLawyerRepresentationRequests } from "../controllers/representationQuoteRequests";

const router = Router();
const requireClient = requireRole("client");
const requireLawyer = requireRole("lawyer");

router.post(
  "/representation/quote-requests",
  requireAuth,
  requireClient,
  createRepresentationQuoteRequest,
);

router.get(
  "/representation/quote-requests",
  requireAuth,
  requireLawyer,
  listLawyerRepresentationRequests,
);

export default router;
