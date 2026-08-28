import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth";
import { requireRole } from "../middlewares/requireRole";
import { listClientLawyers } from "../services/lawyerDiscovery";

const lawyersRouter = Router();

lawyersRouter.get(
  "/lawyers",
  requireAuth,
  requireRole("client"),
  async (_req, res) => {
    try {
      const lawyers = await listClientLawyers();
      return res.status(200).json({ ok: true, lawyers });
    } catch (error) {
      console.error("Lawyer discovery error:", error);
      return res.status(500).json({
        ok: false,
        error: "lawyer_discovery_failed",
      });
    }
  },
);

export default lawyersRouter;
