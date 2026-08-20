import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { requireApprovedLawyer } from "../middlewares/requireApprovedLawyer";
import {
  acceptLawyerProposal,
  createLawyerProposal,
  getLawyerProposal,
  listLawyerProposals,
  rejectLawyerProposal,
  withdrawLawyerProposal,
} from "../controllers/lawyerProposals";

const router = Router();
const requireLawyer = requireRole("lawyer");
const requireClient = requireRole("client");

router.post(
  "/representation-quote-requests/:requestId/proposals",
  requireAuth,
  requireLawyer,
  requireApprovedLawyer,
  createLawyerProposal,
);

router.get(
  "/representation-quote-requests/:requestId/proposals",
  requireAuth,
  listLawyerProposals,
);

router.get(
  "/representation-quote-requests/:requestId/proposals/:proposalId",
  requireAuth,
  getLawyerProposal,
);

router.post(
  "/representation-quote-requests/:requestId/proposals/:proposalId/accept",
  requireAuth,
  requireClient,
  acceptLawyerProposal,
);

router.post(
  "/representation-quote-requests/:requestId/proposals/:proposalId/reject",
  requireAuth,
  requireClient,
  rejectLawyerProposal,
);

router.post(
  "/representation-quote-requests/:requestId/proposals/:proposalId/withdraw",
  requireAuth,
  requireLawyer,
  requireApprovedLawyer,
  withdrawLawyerProposal,
);

export default router;
