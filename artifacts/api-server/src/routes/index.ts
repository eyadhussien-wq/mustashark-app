import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import bookingsRouter from "./bookings";
import authRouter from "./auth";
import profileRouter from "./profile";
import reviewsRouter from "./reviews";
import documentHandoversRouter from "./documentHandovers";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(profileRouter);
router.use(adminRouter);
router.use(bookingsRouter);
router.use(reviewsRouter);
router.use(documentHandoversRouter);

export default router;
