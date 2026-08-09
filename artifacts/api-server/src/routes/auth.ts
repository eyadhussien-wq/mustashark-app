import { Router } from "express";
import { socialAuth, localAuth } from "../controllers/auth";
import { enforcePortalRole } from "../middlewares/enforcePortalRole";

const authRouter = Router();

authRouter.post("/auth/social", socialAuth);
authRouter.post("/auth/local-auth", enforcePortalRole, localAuth);

export default authRouter;
