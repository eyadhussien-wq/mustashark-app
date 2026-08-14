import { Router } from "express";
import { localAuthWithDemo } from "../controllers/localAuthWithDemo";
import { demoAuth } from "../controllers/demoAuth";
import { requestPasswordReset, resetPassword } from "../controllers/passwordReset";
import { socialAuthWithApprovalGate, localAuthWithApprovalGate } from "../controllers/authRegistrationGate";
import { enforcePortalRole } from "../middlewares/enforcePortalRole";

const authRouter = Router();

authRouter.post("/auth/social", socialAuthWithApprovalGate);
authRouter.post("/auth/local-auth", enforcePortalRole, localAuthWithApprovalGate);
authRouter.post("/auth/demo-auth", demoAuth);
authRouter.post("/auth/forgot-password", requestPasswordReset);
authRouter.post("/auth/reset-password", resetPassword);

export default authRouter;
