import { Router } from "express";
import {
  updateProfile,
  getPendingChanges,
  softDeleteClient,
  requestLawyerDeletion,
  getDeletionStatus,
  dismissRejectionNote,
} from "../controllers/profile";
import { requireAuth } from "../middlewares/requireAuth";

const profileRouter = Router();

// Residence country is an identity field. Regular users may not change it after
// account creation; only an admin-level workflow may change it later.
function protectResidenceCountry(req: any, res: any, next: any) {
  if (
    req.authUser?.role !== "admin" &&
    req.body &&
    Object.prototype.hasOwnProperty.call(req.body, "country")
  ) {
    return res.status(403).json({
      ok: false,
      error: "country_change_requires_admin",
      message: "لا يمكن تغيير بلد الإقامة من الملف الشخصي. يرجى التواصل مع الإدارة.",
    });
  }
  next();
}

profileRouter.patch("/profile", requireAuth, protectResidenceCountry, updateProfile);
profileRouter.get("/profile/pending-changes", requireAuth, getPendingChanges);
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
