import { Router } from "express";
import {
  getDuesReport,
  recordManualCollection,
  checkAndApplyKillSwitch,
  runKillSwitchForAllOffices,
} from "../controllers/admin";
import { adminLogin, getAdminProfile } from "../controllers/adminAuth";
import {
  getAdminOverview,
  listAdminLawyers,
  listAdminClients,
  listAdminConsultations,
  listAdminOffices,
  updateLawyerStatus,
  updateClientStatus,
} from "../controllers/adminData";
import { requireAdmin } from "../middlewares/requireAdmin";
import {
  listDeletionRequests,
  checkDeletionObligations,
  approveDeletion,
  rejectDeletion,
} from "../controllers/adminDeletionRequests";
import {
  listProfileChangeRequests,
  approveProfileChange,
  rejectProfileChange,
} from "../controllers/adminProfileChangeRequests";
import {
  listPendingReviews,
  approveReview,
  rejectReview,
} from "../controllers/adminReviews";
import { listAdminBankAccounts } from "../controllers/adminBankAccounts";
import { reviewBankAccount } from "../controllers/lawyerBankAccounts";
import {
  listPendingLawyerVerifications,
  reviewLawyerVerification,
} from "../controllers/lawyerVerification";

const adminRouter = Router();

adminRouter.post("/admin/login", adminLogin);

adminRouter.get("/admin/me", requireAdmin, getAdminProfile);
adminRouter.get("/admin/overview", requireAdmin, getAdminOverview);
adminRouter.get("/admin/lawyers", requireAdmin, listAdminLawyers);
adminRouter.get("/admin/clients", requireAdmin, listAdminClients);
adminRouter.get("/admin/consultations", requireAdmin, listAdminConsultations);
adminRouter.get("/admin/offices", requireAdmin, listAdminOffices);
adminRouter.patch(
  "/admin/lawyers/:id/status",
  requireAdmin,
  updateLawyerStatus,
);
adminRouter.patch(
  "/admin/clients/:id/status",
  requireAdmin,
  updateClientStatus,
);
adminRouter.get("/admin/dues-report", requireAdmin, getDuesReport);
adminRouter.post("/admin/collect", requireAdmin, recordManualCollection);
adminRouter.post("/admin/kill-switch", requireAdmin, checkAndApplyKillSwitch);
adminRouter.post(
  "/admin/kill-switch/run-all",
  requireAdmin,
  runKillSwitchForAllOffices,
);

adminRouter.get(
  "/admin/lawyer-verifications/pending",
  requireAdmin,
  listPendingLawyerVerifications,
);
adminRouter.patch(
  "/admin/lawyer-verifications/:id/review",
  requireAdmin,
  reviewLawyerVerification,
);

// ── Lawyer deletion requests ──────────────────────────────────────────────────
adminRouter.get(
  "/admin/deletion-requests",
  requireAdmin,
  listDeletionRequests,
);
adminRouter.get(
  "/admin/deletion-requests/:id/check",
  requireAdmin,
  checkDeletionObligations,
);
adminRouter.post(
  "/admin/deletion-requests/:id/approve",
  requireAdmin,
  approveDeletion,
);
adminRouter.post(
  "/admin/deletion-requests/:id/reject",
  requireAdmin,
  rejectDeletion,
);

// ── Lawyer profile change requests ────────────────────────────────────────────
adminRouter.get(
  "/admin/profile-change-requests",
  requireAdmin,
  listProfileChangeRequests,
);
adminRouter.post(
  "/admin/profile-change-requests/:id/approve",
  requireAdmin,
  approveProfileChange,
);
adminRouter.post(
  "/admin/profile-change-requests/:id/reject",
  requireAdmin,
  rejectProfileChange,
);

// ── Lawyer bank account verification ─────────────────────────────────────────
adminRouter.get("/admin/bank-accounts", requireAdmin, listAdminBankAccounts);
adminRouter.post(
  "/admin/bank-accounts/:id/:action",
  requireAdmin,
  reviewBankAccount,
);

// ── Text review moderation ────────────────────────────────────────────────────
adminRouter.get("/admin/reviews", requireAdmin, listPendingReviews);
adminRouter.post("/admin/reviews/:id/approve", requireAdmin, approveReview);
adminRouter.post("/admin/reviews/:id/reject", requireAdmin, rejectReview);

export default adminRouter;
