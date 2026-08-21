import { type NextFunction, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { lawyerVerificationsTable } from "@workspace/db/schema";
import { isApprovedLawyerVerification } from "../services/lawyerEligibility";

export { isApprovedLawyerVerification } from "../services/lawyerEligibility";

export async function requireApprovedLawyer(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authUser = req.authUser;

  // Neutral for non-lawyer actors so this guard composes safely with mixed-role routes.
  if (!authUser || authUser.role !== "lawyer") {
    next();
    return;
  }

  try {
    const [verification] = await db
      .select({ status: lawyerVerificationsTable.status })
      .from(lawyerVerificationsTable)
      .where(eq(lawyerVerificationsTable.userId, authUser.userId))
      .limit(1);

    const verificationStatus = verification?.status ?? null;
    if (!isApprovedLawyerVerification(verificationStatus)) {
      res.status(403).json({
        ok: false,
        error: "lawyer_not_professionally_approved",
        verificationStatus: verificationStatus ?? "pending",
      });
      return;
    }

    next();
  } catch (error) {
    req.log?.error?.(error, "requireApprovedLawyer failed");
    res.status(500).json({ ok: false, error: "professional_verification_check_failed" });
  }
}
