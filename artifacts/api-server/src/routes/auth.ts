import { Router } from "express";
import { socialAuth } from "../controllers/auth";

const authRouter = Router();

authRouter.post("/auth/social", socialAuth);

export default authRouter;
