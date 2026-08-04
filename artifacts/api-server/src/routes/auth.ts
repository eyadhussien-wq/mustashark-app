import { Router } from "express";
import { socialAuth, localAuth } from "../controllers/auth";

const authRouter = Router();

authRouter.post("/auth/social", socialAuth);
authRouter.post("/auth/local-auth", localAuth);

export default authRouter;
