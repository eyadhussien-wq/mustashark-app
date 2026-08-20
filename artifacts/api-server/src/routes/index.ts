import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import bookingsRouter from "./bookings";
import availabilityRouter from "./availability";
import authRouter from "./auth";
import profileRouter from "./profile";
import reviewsRouter from "./reviews";
import notificationsRouter from "./notifications";
import documentHandoversRouter from "./documentHandovers";
import paymentProofsRouter from "./paymentProofs";
import consultationDocumentationRouter from "./consultationDocumentation";
import representationQuoteRequestsRouter from "./representationQuoteRequests";
import lawyerProposalsRouter from "./lawyerProposals";
import agreementsRouter from "./agreements";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(adminRouter);
router.use(bookingsRouter);
router.use(availabilityRouter);
router.use(reviewsRouter);
router.use(notificationsRouter);
router.use(documentHandoversRouter);
router.use(paymentProofsRouter);
router.use(consultationDocumentationRouter);
router.use(representationQuoteRequestsRouter);
router.use(lawyerProposalsRouter);
router.use(agreementsRouter);

export default router;
