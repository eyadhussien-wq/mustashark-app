import { Router } from "express";
import { socialAuth, localAuth } from "../controllers/auth";
import { confirmPasswordReset, requestPasswordReset } from "../controllers/passwordRecovery";
import { enforcePortalRole } from "../middlewares/enforcePortalRole";

const authRouter = Router();

authRouter.post("/auth/social", socialAuth);
authRouter.post("/auth/local-auth", enforcePortalRole, localAuth);
authRouter.post("/auth/password-reset/request", requestPasswordReset);
authRouter.post("/auth/password-reset/confirm", confirmPasswordReset);

export default authRouter;
