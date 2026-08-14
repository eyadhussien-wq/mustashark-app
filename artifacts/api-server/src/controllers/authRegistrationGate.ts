import { type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { localAuth, socialAuth } from "./auth";

/**
 * New lawyers must enter the approval queue before they can receive a session.
 * Existing-user logins continue through the normal auth controllers unchanged.
 */
async function runWithPendingLawyerGate(
  handler: (req: Request, res: Response) => Promise<unknown>,
  req: Request,
  res: Response,
) {
  const requestedRole = typeof req.body?.role === "string" ? req.body.role : "client";
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";

  if (requestedRole !== "lawyer" || !email) return handler(req, res);

  const existing = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing[0]) return handler(req, res);

  let statusCode = 200;
  let payload: any;
  const originalStatus = res.status.bind(res);

  const captureRes = Object.create(res) as Response;
  captureRes.status = ((code: number) => {
    statusCode = code;
    return captureRes;
  }) as Response["status"];
  captureRes.json = ((body: any) => {
    payload = body;
    return captureRes;
  }) as Response["json"];

  await handler(req, captureRes);

  if (statusCode === 201 && payload?.ok && payload?.userId) {
    await db.update(usersTable)
      .set({ accountStatus: "pending", updatedAt: new Date() })
      .where(eq(usersTable.id, payload.userId));

    const { jwt: _jwt, ...safePayload } = payload;
    return originalStatus(201).json({
      ...safePayload,
      pendingApproval: true,
      message: "تم استلام طلب التسجيل. سيظهر الحساب للمراجعة الإدارية، ولن يمكن تسجيل الدخول حتى تتم الموافقة.",
    });
  }

  return originalStatus(statusCode).json(payload);
}

export async function localAuthWithApprovalGate(req: Request, res: Response) {
  return runWithPendingLawyerGate(localAuth, req, res);
}

export async function socialAuthWithApprovalGate(req: Request, res: Response) {
  return runWithPendingLawyerGate(socialAuth, req, res);
}
