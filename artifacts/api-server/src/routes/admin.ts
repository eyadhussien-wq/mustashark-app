import { Router } from "express";
import {
  getDuesReport,
  recordManualCollection,
  checkAndApplyKillSwitch,
  runKillSwitchForAllOffices,
} from "../controllers/admin";
import { adminLogin, getAdminProfile } from "../controllers/adminAuth";
import {
  getAdminOverview,
  listAdminLawyers,
  listAdminClients,
  listAdminConsultations,
  listAdminOffices,
  updateLawyerStatus,
  updateClientStatus,
} from "../controllers/adminData";
import { requireAdmin } from "../middlewares/requireAdmin";

const adminRouter = Router();

adminRouter.post("/admin/login", adminLogin);

adminRouter.get("/admin/me", requireAdmin, getAdminProfile);
adminRouter.get("/admin/overview", requireAdmin, getAdminOverview);
adminRouter.get("/admin/lawyers", requireAdmin, listAdminLawyers);
adminRouter.get("/admin/clients", requireAdmin, listAdminClients);
adminRouter.get("/admin/consultations", requireAdmin, listAdminConsultations);
adminRouter.get("/admin/offices", requireAdmin, listAdminOffices);
adminRouter.patch(
  "/admin/lawyers/:id/status",
  requireAdmin,
  updateLawyerStatus,
);
adminRouter.patch(
  "/admin/clients/:id/status",
  requireAdmin,
  updateClientStatus,
);
adminRouter.get("/admin/dues-report", requireAdmin, getDuesReport);
adminRouter.post("/admin/collect", requireAdmin, recordManualCollection);
adminRouter.post("/admin/kill-switch", requireAdmin, checkAndApplyKillSwitch);
adminRouter.post(
  "/admin/kill-switch/run-all",
  requireAdmin,
  runKillSwitchForAllOffices,
);

export default adminRouter;
