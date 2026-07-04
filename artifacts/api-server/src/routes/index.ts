import { Router, type IRouter } from "express";
import healthRouter from "./health";
import adminRouter from "./admin";
import bookingsRouter from "./bookings";

const router: IRouter = Router();

router.use(healthRouter);
router.use(adminRouter);
router.use(bookingsRouter);

export default router;
