import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import {
  createDocumentHandover,
  listDocumentHandovers,
  generateHandoverOtp,
  verifyHandoverOtp,
  updateHandoverStatus,
  confirmHandoverReceipt,
} from "../controllers/documentHandovers";

const router = Router();

router.get("/document-handovers", requireAuth, listDocumentHandovers);
router.post("/document-handovers", requireAuth, createDocumentHandover);
router.post("/document-handovers/:id/otp", requireAuth, generateHandoverOtp);
router.post("/document-handovers/:id/otp/verify", requireAuth, verifyHandoverOtp);
router.post("/document-handovers/:id/status", requireAuth, updateHandoverStatus);
router.post("/document-handovers/:id/confirm-receipt", requireAuth, confirmHandoverReceipt);

export default router;
