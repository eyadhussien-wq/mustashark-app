import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import {
  getLegalRepresentationDocument,
  listLegalRepresentationDocuments,
  rejectLegalRepresentationDocument,
  startLegalRepresentationDocumentReview,
  submitLegalRepresentationDocument,
  supersedeLegalRepresentationDocument,
  uploadLegalRepresentationDocument,
  verifyLegalRepresentationDocument,
} from "../controllers/legalRepresentationDocuments";

const router = Router();

const requireClientLawyerOrAdmin = requireRole("client", "lawyer", "admin");
const requireLawyerOrAdmin = requireRole("lawyer", "admin");

router.post(
  "/agreements/:agreementId/legal-representation-documents",
  requireAuth,
  requireClientLawyerOrAdmin,
  uploadLegalRepresentationDocument,
);

router.get(
  "/agreements/:agreementId/legal-representation-documents",
  requireAuth,
  requireClientLawyerOrAdmin,
  listLegalRepresentationDocuments,
);

router.get(
  "/legal-representation-documents/:id",
  requireAuth,
  requireClientLawyerOrAdmin,
  getLegalRepresentationDocument,
);

router.post(
  "/legal-representation-documents/:id/submit",
  requireAuth,
  requireClientLawyerOrAdmin,
  submitLegalRepresentationDocument,
);

router.post(
  "/legal-representation-documents/:id/review",
  requireAuth,
  requireLawyerOrAdmin,
  startLegalRepresentationDocumentReview,
);

router.post(
  "/legal-representation-documents/:id/verify",
  requireAuth,
  requireLawyerOrAdmin,
  verifyLegalRepresentationDocument,
);

router.post(
  "/legal-representation-documents/:id/reject",
  requireAuth,
  requireLawyerOrAdmin,
  rejectLegalRepresentationDocument,
);

router.post(
  "/legal-representation-documents/:id/supersede",
  requireAuth,
  requireLawyerOrAdmin,
  supersedeLegalRepresentationDocument,
);

export default router;
