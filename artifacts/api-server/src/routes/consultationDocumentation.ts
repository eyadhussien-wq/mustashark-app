import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import {
  archiveConsultation,
  getConsultationPrintData,
  listConsultationArchive,
  recordConsultationPrintExport,
} from "../controllers/consultationDocumentation";

const router = Router();
const requireClientLawyerAdmin = requireRole("client", "lawyer", "admin");
const requireLawyerAdmin = requireRole("lawyer", "admin");

router.get("/consultations/archive", requireAuth, requireClientLawyerAdmin, listConsultationArchive);
router.post("/consultations/:id/archive", requireAuth, requireLawyerAdmin, archiveConsultation);
router.get("/consultations/:id/print-data", requireAuth, requireClientLawyerAdmin, getConsultationPrintData);
router.post("/consultations/:id/print-export", requireAuth, requireClientLawyerAdmin, recordConsultationPrintExport);

export default router;
