import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { submitReview, getLawyerReviews } from "../controllers/reviews";

const reviewsRouter = Router();

// Public — any authenticated client can submit a rating
reviewsRouter.post("/reviews", requireAuth, submitReview);

// Public — client-facing lawyer detail page fetches live aggregates
reviewsRouter.get("/lawyers/:id/reviews", getLawyerReviews);

export default reviewsRouter;
