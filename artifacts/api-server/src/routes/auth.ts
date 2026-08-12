import { Router } from "express";
import { socialAuth, localAuth } from "../controllers/auth";
import { demoAuth } from "../controllers/demoAuth";
import { enforcePortalRole } from "../middlewares/enforcePortalRole";

const authRouter = Router();

authRouter.post("/auth/social", socialAuth);
authRouter.post("/auth/local-auth", enforcePortalRole, localAuth);
authRouter.post("/auth/demo-auth", demoAuth);

export default authRouter;
