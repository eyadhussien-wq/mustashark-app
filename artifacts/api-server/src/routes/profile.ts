import { Router } from "express";
import {
  getPendingChanges,
  softDeleteClient,
  requestLawyerDeletion,
  getDeletionStatus,
  dismissRejectionNote,
} from "../controllers/profile";
import { updateProfile } from "../controllers/profileMutations";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { requireCurrentTermsConsent } from "../middlewares/requireCurrentTermsConsent";
import { getLawyerBankAccount, upsertLawyerBankAccount } from "../controllers/lawyerBankAccounts";
import { getLawyerVerification, submitLawyerVerification } from "../controllers/lawyerVerification";

const profileRouter = Router();

const requireClient = requireRole("client");
const requireLawyer = requireRole("lawyer");
const requireClientOrLawyer = requireRole("client", "lawyer");

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

profileRouter.patch(
  "/profile",
  requireAuth,
  requireCurrentTermsConsent,
  requireClientOrLawyer,
  protectResidenceCountry,
  updateProfile,
);
profileRouter.get("/profile/pending-changes", requireAuth, requireLawyer, getPendingChanges);
profileRouter.get("/profile/bank-account", requireAuth, requireLawyer, getLawyerBankAccount);
profileRouter.put("/profile/bank-account", requireAuth, requireLawyer, upsertLawyerBankAccount);
profileRouter.get("/profile/lawyer-verification", requireAuth, requireLawyer, getLawyerVerification);
profileRouter.post("/profile/lawyer-verification", requireAuth, requireLawyer, submitLawyerVerification);

profileRouter.delete("/profile", requireAuth, requireClient, softDeleteClient);
profileRouter.post(
  "/profile/deletion-request",
  requireAuth,
  requireLawyer,
  requestLawyerDeletion,
);
profileRouter.get("/profile/deletion-status", requireAuth, requireLawyer, getDeletionStatus);
profileRouter.post(
  "/profile/dismiss-rejection",
  requireAuth,
  requireLawyer,
  dismissRejectionNote,
);

export default profileRouter;
