import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { listNotifications, markNotificationRead } from "../controllers/notifications";

const router = Router();
router.get("/notifications", requireAuth, listNotifications);
router.post("/notifications/:id/read", requireAuth, markNotificationRead);
export default router;
