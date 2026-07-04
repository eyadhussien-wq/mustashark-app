import { Router } from "express";
import {
  getDuesReport,
  recordManualCollection,
  checkAndApplyKillSwitch,
  runKillSwitchForAllOffices,
} from "../controllers/admin";

const adminRouter = Router();

adminRouter.get("/admin/dues-report", getDuesReport);

adminRouter.post("/admin/collect", recordManualCollection);

adminRouter.post("/admin/kill-switch", checkAndApplyKillSwitch);

adminRouter.post("/admin/kill-switch/run-all", runKillSwitchForAllOffices);

export default adminRouter;
