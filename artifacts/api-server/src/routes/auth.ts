import { Router } from "express";
import { socialAuth } from "../controllers/auth";
import { localAuthWithDemo } from "../controllers/localAuthWithDemo";
import { demoAuth } from "../controllers/demoAuth";
import { enforcePortalRole } from "../middlewares/enforcePortalRole";

const authRouter = Router();

authRouter.post("/auth/social", socialAuth);
authRouter.post("/auth/local-auth", enforcePortalRole, localAuthWithDemo);
authRouter.post("/auth/demo-auth", demoAuth);

export default authRouter;
