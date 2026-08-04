import { Router } from "express";
import {
  updateProfile,
  softDeleteClient,
  requestLawyerDeletion,
  getDeletionStatus,
  dismissRejectionNote,
} from "../controllers/profile";
import { requireAuth } from "../middlewares/requireAuth";

const profileRouter = Router();

profileRouter.patch("/profile", requireAuth, updateProfile);
profileRouter.delete("/profile", requireAuth, softDeleteClient);
profileRouter.post(
  "/profile/deletion-request",
  requireAuth,
  requestLawyerDeletion,
);
profileRouter.get("/profile/deletion-status", requireAuth, getDeletionStatus);
profileRouter.post(
  "/profile/dismiss-rejection",
  requireAuth,
  dismissRejectionNote,
);

export default profileRouter;
