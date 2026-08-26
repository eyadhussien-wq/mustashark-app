import type { Request, Response } from "express";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { agreementsTable, caseMembershipsTable, casesTable, representationAuditLogsTable } from "@workspace/db/schema";

async function canAccessCase(caseId: string, userId: string, role: string) {
  if (role === "admin") return true;
  const [caseRecord] = await db
    .select({ clientId: casesTable.clientId, lawyerId: casesTable.lawyerId })
    .from(casesTable)
    .where(eq(casesTable.id, caseId))
    .limit(1);
  if (!caseRecord) return null;
  if (caseRecord.clientId === userId || caseRecord.lawyerId === userId) return true;
  const [membership] = await db
    .select({ id: caseMembershipsTable.id })
    .from(caseMembershipsTable)
    .where(and(eq(caseMembershipsTable.caseId, caseId), eq(caseMembershipsTable.userId, userId), eq(caseMembershipsTable.status, "active")))
    .limit(1);
  return Boolean(membership);
}

async function canAccessAgreement(agreementId: string, userId: string, role: string) {
  if (role === "admin") return true;
  const [agreement] = await db
    .select({ clientId: agreementsTable.clientId, lawyerId: agreementsTable.lawyerId })
    .from(agreementsTable)
    .where(eq(agreementsTable.id, agreementId))
    .limit(1);
  if (!agreement) return null;
  return agreement.clientId === userId || agreement.lawyerId === userId;
}

export async function listCaseAuditTrail(req: Request, res: Response) {
  const caseId = String(req.params.id ?? "").trim();
  if (!caseId) return res.status(400).json({ ok: false, error: "case_id_is_required" });

  const access = await canAccessCase(caseId, req.authUser!.id, req.authUser!.role);
  if (access === null) return res.status(404).json({ ok: false, error: "case_not_found" });
  if (!access) return res.status(403).json({ ok: false, error: "forbidden" });

  const events = await db
    .select({
      id: representationAuditLogsTable.id,
      caseId: representationAuditLogsTable.caseId,
      agreementId: representationAuditLogsTable.agreementId,
      actorUserId: representationAuditLogsTable.actorUserId,
      action: representationAuditLogsTable.action,
      entityType: representationAuditLogsTable.entityType,
      entityId: representationAuditLogsTable.entityId,
      metadata: representationAuditLogsTable.metadata,
      createdAt: representationAuditLogsTable.createdAt,
    })
    .from(representationAuditLogsTable)
    .where(eq(representationAuditLogsTable.caseId, caseId))
    .orderBy(asc(representationAuditLogsTable.createdAt));

  return res.json({ ok: true, auditTrail: events });
}

export async function listAgreementAuditTrail(req: Request, res: Response) {
  const agreementId = String(req.params.id ?? "").trim();
  if (!agreementId) return res.status(400).json({ ok: false, error: "agreement_id_is_required" });

  const access = await canAccessAgreement(agreementId, req.authUser!.id, req.authUser!.role);
  if (access === null) return res.status(404).json({ ok: false, error: "agreement_not_found" });
  if (!access) return res.status(403).json({ ok: false, error: "forbidden" });

  const events = await db
    .select({
      id: representationAuditLogsTable.id,
      caseId: representationAuditLogsTable.caseId,
      agreementId: representationAuditLogsTable.agreementId,
      actorUserId: representationAuditLogsTable.actorUserId,
      action: representationAuditLogsTable.action,
      entityType: representationAuditLogsTable.entityType,
      entityId: representationAuditLogsTable.entityId,
      metadata: representationAuditLogsTable.metadata,
      createdAt: representationAuditLogsTable.createdAt,
    })
    .from(representationAuditLogsTable)
    .where(eq(representationAuditLogsTable.agreementId, agreementId))
    .orderBy(asc(representationAuditLogsTable.createdAt));

  return res.json({ ok: true, auditTrail: events });
}
