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
import { requireRole } from "../middlewares/requireRole";
import { getLawyerBankAccount, upsertLawyerBankAccount } from "../controllers/lawyerBankAccounts";

const profileRouter = Router();

const requireClient = requireRole("client");
const requireLawyer = requireRole("lawyer");
const requireClientOrLawyer = requireRole("client", "lawyer");

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

profileRouter.patch("/profile", requireAuth, requireClientOrLawyer, protectResidenceCountry, updateProfile);
profileRouter.get("/profile/pending-changes", requireAuth, requireLawyer, getPendingChanges);

// Lawyer financial identity: only a lawyer may view or submit a bank account.
// The submitted account always returns to pending verification, including when
// an already verified IBAN is replaced.
profileRouter.get("/profile/bank-account", requireAuth, requireLawyer, getLawyerBankAccount);
profileRouter.put("/profile/bank-account", requireAuth, requireLawyer, upsertLawyerBankAccount);

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
