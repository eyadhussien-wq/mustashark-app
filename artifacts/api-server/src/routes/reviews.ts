import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { submitReview, getLawyerReviews } from "../controllers/reviews";

const reviewsRouter = Router();

// Only client accounts may submit a client review. Authentication alone is
// not sufficient because lawyers/admins must not be able to impersonate the
// client review workflow.
reviewsRouter.post("/reviews", requireAuth, requireRole("client"), submitReview);

// Public — client-facing lawyer detail page fetches live aggregates
reviewsRouter.get("/lawyers/:id/reviews", getLawyerReviews);

export default reviewsRouter;
