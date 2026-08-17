import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { createRepresentationQuoteRequest } from "../controllers/representationQuoteRequests";

const router = Router();
const requireClient = requireRole("client");

router.post(
  "/representation/quote-requests",
  requireAuth,
  requireClient,
  createRepresentationQuoteRequest,
);

export default router;
