import { type Request, type Response } from "express";
import {
  db,
  usersTable,
  officesTable,
  bookingsTable,
  platformDuesTable,
} from "@workspace/db";
import { eq, sql, desc, and } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { z } from "zod/v4";

const clientUser = alias(usersTable, "client_user");
const lawyerUser = alias(usersTable, "lawyer_user");

function toConsultation(row: {
  id: string;
  serialNumber: string | null;
  clientName: string | null;
  lawyerName: string | null;
  subject: string;
  scheduledDate: string;
  scheduledTime: string;
  status: string;
  type: string;
  price: string;
  paymentStatus: string;
}) {
  return {
    id: row.id,
    serialNumber: row.serialNumber ?? null,
    clientName: row.clientName ?? "—",
    lawyerName: row.lawyerName ?? "—",
    subject: row.subject,
    scheduledDate: row.scheduledDate,
    scheduledTime: row.scheduledTime,
    status: row.status,
    type: row.type,
    price: Number(row.price),
    paymentStatus: row.paymentStatus,
  };
}

export async function getAdminOverview(req: Request, res: Response) {
  try {
    const [userCounts] = await db
      .select({
        totalUsers: sql<number>`COUNT(*)`,
        totalClients: sql<number>`COUNT(CASE WHEN ${usersTable.role} = 'client' THEN 1 END)`,
        totalLawyers: sql<number>`COUNT(CASE WHEN ${usersTable.role} = 'lawyer' THEN 1 END)`,
      })
      .from(usersTable);

    const [officeCounts] = await db
      .select({
        totalOffices: sql<number>`COUNT(*)`,
        suspendedOffices: sql<number>`COUNT(CASE WHEN ${officesTable.isSuspended} THEN 1 END)`,
      })
      .from(officesTable);

    const [bookingTotals] = await db
      .select({
        totalConsultations: sql<number>`COUNT(*)`,
        grossRevenue: sql<string>`COALESCE(SUM(${bookingsTable.price}), 0)`,
      })
      .from(bookingsTable);

    const [dueTotals] = await db
      .select({
        pendingCommission: sql<string>`COALESCE(SUM(CASE WHEN ${platformDuesTable.status} = 'pending' THEN ${platformDuesTable.commissionAmount} ELSE 0 END), 0)`,
        collectedCommission: sql<string>`COALESCE(SUM(CASE WHEN ${platformDuesTable.status} = 'collected' THEN ${platformDuesTable.commissionAmount} ELSE 0 END), 0)`,
      })
      .from(platformDuesTable);

    const revenueByCountry = await db
      .select({
        country: lawyerUser.country,
        revenue: sql<string>`COALESCE(SUM(${bookingsTable.price}), 0)`,
      })
      .from(bookingsTable)
      .leftJoin(lawyerUser, eq(bookingsTable.lawyerId, lawyerUser.id))
      .groupBy(lawyerUser.country);

    let revenueQatar = 0;
    let revenueJordan = 0;
    for (const row of revenueByCountry) {
      if (row.country === "qatar") revenueQatar = Number(row.revenue);
      else if (row.country === "jordan") revenueJordan = Number(row.revenue);
    }

    const statusRows = await db
      .select({
        status: bookingsTable.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(bookingsTable)
      .groupBy(bookingsTable.status);

    const recentRows = await db
      .select({
        id: bookingsTable.id,
        serialNumber: bookingsTable.serialNumber,
        clientName: clientUser.name,
        lawyerName: lawyerUser.name,
        subject: bookingsTable.subject,
        scheduledDate: bookingsTable.scheduledDate,
        scheduledTime: bookingsTable.scheduledTime,
        status: bookingsTable.status,
        type: bookingsTable.type,
        price: bookingsTable.price,
        paymentStatus: bookingsTable.paymentStatus,
      })
      .from(bookingsTable)
      .leftJoin(clientUser, eq(bookingsTable.clientId, clientUser.id))
      .leftJoin(lawyerUser, eq(bookingsTable.lawyerId, lawyerUser.id))
      .orderBy(desc(bookingsTable.createdAt))
      .limit(8);

    return res.json({
      totalUsers: Number(userCounts?.totalUsers ?? 0),
      totalClients: Number(userCounts?.totalClients ?? 0),
      totalLawyers: Number(userCounts?.totalLawyers ?? 0),
      totalOffices: Number(officeCounts?.totalOffices ?? 0),
      totalConsultations: Number(bookingTotals?.totalConsultations ?? 0),
      suspendedOffices: Number(officeCounts?.suspendedOffices ?? 0),
      grossRevenue: Number(bookingTotals?.grossRevenue ?? 0),
      pendingCommission: Number(dueTotals?.pendingCommission ?? 0),
      collectedCommission: Number(dueTotals?.collectedCommission ?? 0),
      revenueQatar,
      revenueJordan,
      consultationsByStatus: statusRows.map((r) => ({
        status: r.status,
        count: Number(r.count),
      })),
      recentConsultations: recentRows.map(toConsultation),
    });
  } catch (err) {
    req.log.error(err, "getAdminOverview failed");
    return res.status(500).json({ error: "internal_error" });
  }
}

export async function listAdminLawyers(req: Request, res: Response) {
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
        country: usersTable.country,
        officeName: officesTable.name,
        status: usersTable.accountStatus,
        statusReason: usersTable.statusReason,
        consultationsCount: sql<number>`(SELECT COUNT(*) FROM ${bookingsTable} WHERE ${bookingsTable.lawyerId} = ${usersTable.id})`,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .leftJoin(officesTable, eq(officesTable.ownerId, usersTable.id))
      .where(eq(usersTable.role, "lawyer"))
      .orderBy(desc(usersTable.createdAt));

    return res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone ?? null,
        country: r.country ?? null,
        officeName: r.officeName ?? null,
        status: r.status,
        statusReason: r.statusReason ?? null,
        consultationsCount: Number(r.consultationsCount ?? 0),
        createdAt: r.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error(err, "listAdminLawyers failed");
    return res.status(500).json({ error: "internal_error" });
  }
}

export async function listAdminClients(req: Request, res: Response) {
  try {
    const rows = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
        country: usersTable.country,
        status: usersTable.accountStatus,
        statusReason: usersTable.statusReason,
        consultationsCount: sql<number>`(SELECT COUNT(*) FROM ${bookingsTable} WHERE ${bookingsTable.clientId} = ${usersTable.id})`,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .where(eq(usersTable.role, "client"))
      .orderBy(desc(usersTable.createdAt));

    return res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        email: r.email,
        phone: r.phone ?? null,
        country: r.country ?? null,
        status: r.status,
        statusReason: r.statusReason ?? null,
        consultationsCount: Number(r.consultationsCount ?? 0),
        createdAt: r.createdAt.toISOString(),
      })),
    );
  } catch (err) {
    req.log.error(err, "listAdminClients failed");
    return res.status(500).json({ error: "internal_error" });
  }
}

export async function listAdminConsultations(req: Request, res: Response) {
  try {
    const rows = await db
      .select({
        id: bookingsTable.id,
        serialNumber: bookingsTable.serialNumber,
        clientName: clientUser.name,
        lawyerName: lawyerUser.name,
        subject: bookingsTable.subject,
        scheduledDate: bookingsTable.scheduledDate,
        scheduledTime: bookingsTable.scheduledTime,
        status: bookingsTable.status,
        type: bookingsTable.type,
        price: bookingsTable.price,
        paymentStatus: bookingsTable.paymentStatus,
      })
      .from(bookingsTable)
      .leftJoin(clientUser, eq(bookingsTable.clientId, clientUser.id))
      .leftJoin(lawyerUser, eq(bookingsTable.lawyerId, lawyerUser.id))
      .orderBy(desc(bookingsTable.createdAt));

    return res.json(rows.map(toConsultation));
  } catch (err) {
    req.log.error(err, "listAdminConsultations failed");
    return res.status(500).json({ error: "internal_error" });
  }
}

export async function listAdminOffices(req: Request, res: Response) {
  try {
    const rows = await db
      .select({
        id: officesTable.id,
        name: officesTable.name,
        ownerName: usersTable.name,
        country: officesTable.country,
        isSuspended: officesTable.isSuspended,
        suspensionReason: officesTable.suspensionReason,
        debtThreshold: officesTable.debtThreshold,
        pendingCommission: sql<string>`(SELECT COALESCE(SUM(${platformDuesTable.commissionAmount}), 0) FROM ${platformDuesTable} WHERE ${platformDuesTable.officeId} = ${officesTable.id} AND ${platformDuesTable.status} = 'pending')`,
      })
      .from(officesTable)
      .leftJoin(usersTable, eq(officesTable.ownerId, usersTable.id))
      .orderBy(desc(officesTable.createdAt));

    return res.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        ownerName: r.ownerName ?? null,
        country: r.country ?? null,
        isSuspended: r.isSuspended,
        suspensionReason: r.suspensionReason ?? null,
        debtThreshold: Number(r.debtThreshold),
        pendingCommission: Number(r.pendingCommission ?? 0),
      })),
    );
  } catch (err) {
    req.log.error(err, "listAdminOffices failed");
    return res.status(500).json({ error: "internal_error" });
  }
}

const lawyerStatusSchema = z.object({
  status: z.enum(["active", "suspended", "terminated", "rejected"]),
  reason: z.string().nullish(),
});

const clientStatusSchema = z.object({
  status: z.enum(["active", "blocked"]),
  reason: z.string().nullish(),
});

const allowedTransitions: Record<string, string[]> = {
  pending: ["active", "rejected"],
  active: ["suspended", "terminated", "blocked"],
  suspended: ["active", "terminated"],
  blocked: ["active"],
  terminated: [],
  rejected: [],
};

async function applyUserStatus(
  req: Request,
  res: Response,
  role: "lawyer" | "client",
  status: string,
  reason: string | null | undefined,
) {
  const id = String(req.params.id);

  const [existing] = await db
    .select({
      id: usersTable.id,
      role: usersTable.role,
      accountStatus: usersTable.accountStatus,
    })
    .from(usersTable)
    .where(and(eq(usersTable.id, id), eq(usersTable.role, role)))
    .limit(1);

  if (!existing) {
    return res
      .status(404)
      .json({ error: role === "lawyer" ? "lawyer_not_found" : "client_not_found" });
  }

  const current = existing.accountStatus ?? "active";
  if (current !== status && !(allowedTransitions[current] ?? []).includes(status)) {
    return res.status(409).json({
      error: "invalid_status_transition",
      from: current,
      to: status,
    });
  }

  await db
    .update(usersTable)
    .set({
      accountStatus: status as never,
      statusReason: reason ?? null,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.id, id));

  req.log.info(
    { userId: id, role, status, adminId: req.admin?.userId },
    "admin updated account status",
  );

  if (role === "lawyer") {
    const [row] = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
        country: usersTable.country,
        officeName: officesTable.name,
        status: usersTable.accountStatus,
        statusReason: usersTable.statusReason,
        consultationsCount: sql<number>`(SELECT COUNT(*) FROM ${bookingsTable} WHERE ${bookingsTable.lawyerId} = ${usersTable.id})`,
        createdAt: usersTable.createdAt,
      })
      .from(usersTable)
      .leftJoin(officesTable, eq(officesTable.ownerId, usersTable.id))
      .where(eq(usersTable.id, id))
      .limit(1);

    return res.json({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone ?? null,
      country: row.country ?? null,
      officeName: row.officeName ?? null,
      status: row.status,
      statusReason: row.statusReason ?? null,
      consultationsCount: Number(row.consultationsCount ?? 0),
      createdAt: row.createdAt.toISOString(),
    });
  }

  const [row] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      country: usersTable.country,
      status: usersTable.accountStatus,
      statusReason: usersTable.statusReason,
      consultationsCount: sql<number>`(SELECT COUNT(*) FROM ${bookingsTable} WHERE ${bookingsTable.clientId} = ${usersTable.id})`,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  return res.json({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone ?? null,
    country: row.country ?? null,
    status: row.status,
    statusReason: row.statusReason ?? null,
    consultationsCount: Number(row.consultationsCount ?? 0),
    createdAt: row.createdAt.toISOString(),
  });
}

export async function updateLawyerStatus(req: Request, res: Response) {
  const parsed = lawyerStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "validation_error" });
  }
  try {
    return await applyUserStatus(
      req,
      res,
      "lawyer",
      parsed.data.status,
      parsed.data.reason,
    );
  } catch (err) {
    req.log.error(err, "updateLawyerStatus failed");
    return res.status(500).json({ error: "internal_error" });
  }
}

export async function updateClientStatus(req: Request, res: Response) {
  const parsed = clientStatusSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ error: "validation_error" });
  }
  try {
    return await applyUserStatus(
      req,
      res,
      "client",
      parsed.data.status,
      parsed.data.reason,
    );
  } catch (err) {
    req.log.error(err, "updateClientStatus failed");
    return res.status(500).json({ error: "internal_error" });
  }
}
