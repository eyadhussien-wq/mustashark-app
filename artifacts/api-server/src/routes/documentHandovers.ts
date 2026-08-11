import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import {
  addDocumentHandoverTrackingEvent,
  confirmDocumentHandoverDelivery,
  createDocumentHandover,
  getDocumentHandover,
  updateDocumentHandoverStatus,
} from "../controllers/documentHandovers";

const router = Router();
router.post("/document-handovers", requireAuth, createDocumentHandover);
router.get("/document-handovers/:id", requireAuth, getDocumentHandover);
router.post("/document-handovers/:id/status", requireAuth, updateDocumentHandoverStatus);
router.post("/document-handovers/:id/tracking", requireAuth, addDocumentHandoverTrackingEvent);
router.post("/document-handovers/:id/deliver", requireAuth, confirmDocumentHandoverDelivery);
export default router;
