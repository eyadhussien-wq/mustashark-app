import { type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  platformDuesTable,
  officesTable,
  bookingsTable,
  usersTable,
} from "@workspace/db";
import { eq, and, inArray, sql } from "drizzle-orm";
import { z } from "zod/v4";

const DEFAULT_DEBT_THRESHOLD = 500;

export async function getDuesReport(req: Request, res: Response) {
  try {
    const rows = await db
      .select({
        officeId: platformDuesTable.officeId,
        officeName: officesTable.name,
        lawyerId: platformDuesTable.lawyerId,
        lawyerName: usersTable.name,
        isSuspended: officesTable.isSuspended,
        debtThreshold: officesTable.debtThreshold,
        totalPendingCommission: sql<string>`
          SUM(CASE WHEN ${platformDuesTable.status} = 'pending'
            THEN ${platformDuesTable.commissionAmount} ELSE 0 END)
        `.as("total_pending_commission"),
        totalCollectedCommission: sql<string>`
          SUM(CASE WHEN ${platformDuesTable.status} = 'collected'
            THEN ${platformDuesTable.commissionAmount} ELSE 0 END)
        `.as("total_collected_commission"),
        pendingCount: sql<number>`
          COUNT(CASE WHEN ${platformDuesTable.status} = 'pending' THEN 1 END)
        `.as("pending_count"),
        totalGross: sql<string>`SUM(${platformDuesTable.grossAmount})`.as(
          "total_gross",
        ),
      })
      .from(platformDuesTable)
      .leftJoin(
        officesTable,
        eq(platformDuesTable.officeId, officesTable.id),
      )
      .leftJoin(
        usersTable,
        eq(platformDuesTable.lawyerId, usersTable.id),
      )
      .groupBy(
        platformDuesTable.officeId,
        platformDuesTable.lawyerId,
        officesTable.name,
        officesTable.isSuspended,
        officesTable.debtThreshold,
        usersTable.name,
      )
      .orderBy(sql`total_pending_commission DESC`);

    const report = rows.map((row) => ({
      officeId: row.officeId,
      officeName: row.officeName ?? "بدون مكتب",
      lawyerId: row.lawyerId,
      lawyerName: row.lawyerName ?? "—",
      isSuspended: row.isSuspended ?? false,
      debtThreshold: Number(row.debtThreshold ?? DEFAULT_DEBT_THRESHOLD),
      totalPendingCommission: Number(row.totalPendingCommission ?? 0),
      totalCollectedCommission: Number(row.totalCollectedCommission ?? 0),
      pendingCount: Number(row.pendingCount ?? 0),
      totalGross: Number(row.totalGross ?? 0),
      exceedsThreshold:
        Number(row.totalPendingCommission ?? 0) >
        Number(row.debtThreshold ?? DEFAULT_DEBT_THRESHOLD),
    }));

    return res.json(report);
  } catch (err) {
    req.log.error(err, "getDuesReport failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

const collectSchema = z.object({
  officeId: z.string().optional(),
  lawyerId: z.string().optional(),
  notes: z.string().optional(),
});

export async function recordManualCollection(req: Request, res: Response) {
  const parsed = collectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ ok: false, error: "validation_error", issues: parsed.error.issues });
  }

  const { officeId, lawyerId, notes } = parsed.data;
  const adminId = req.admin!.userId;

  if (!officeId && !lawyerId) {
    return res
      .status(400)
      .json({ ok: false, error: "must_supply_officeId_or_lawyerId" });
  }

  try {
    const conditions = [eq(platformDuesTable.status, "pending")];
    if (officeId) conditions.push(eq(platformDuesTable.officeId, officeId));
    if (lawyerId) conditions.push(eq(platformDuesTable.lawyerId, lawyerId));

    const updated = await db
      .update(platformDuesTable)
      .set({
        status: "collected",
        collectedAt: new Date(),
        collectedBy: adminId,
        notes: notes ?? null,
        updatedAt: new Date(),
      })
      .where(and(...conditions))
      .returning({ id: platformDuesTable.id, amount: platformDuesTable.commissionAmount });

    const totalCollected = updated.reduce(
      (sum, r) => sum + Number(r.amount),
      0,
    );

    req.log.info(
      { officeId, lawyerId, adminId, count: updated.length, totalCollected },
      "manual collection recorded",
    );

    return res.json({
      ok: true,
      collectedCount: updated.length,
      totalCollected,
      message: "تم تسجيل التحصيل اليدوي وتصفير العداد بنجاح",
    });
  } catch (err) {
    req.log.error(err, "recordManualCollection failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

const killSwitchSchema = z.object({
  officeId: z.string(),
  threshold: z.number().positive().optional(),
  suspensionReason: z.string().optional(),
});

export async function checkAndApplyKillSwitch(req: Request, res: Response) {
  const parsed = killSwitchSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ ok: false, error: "validation_error", issues: parsed.error.issues });
  }

  const { officeId, suspensionReason } = parsed.data;

  try {
    const [office] = await db
      .select()
      .from(officesTable)
      .where(eq(officesTable.id, officeId))
      .limit(1);

    if (!office) {
      return res.status(404).json({ ok: false, error: "office_not_found" });
    }

    const threshold = parsed.data.threshold ?? Number(office.debtThreshold) ?? DEFAULT_DEBT_THRESHOLD;

    const [pendingSummary] = await db
      .select({
        totalPending: sql<string>`
          COALESCE(SUM(${platformDuesTable.commissionAmount}), 0)
        `.as("total_pending"),
      })
      .from(platformDuesTable)
      .where(
        and(
          eq(platformDuesTable.officeId, officeId),
          eq(platformDuesTable.status, "pending"),
        ),
      );

    const totalPending = Number(pendingSummary?.totalPending ?? 0);
    const shouldSuspend = totalPending > threshold;

    if (shouldSuspend && !office.isSuspended) {
      await db
        .update(officesTable)
        .set({
          isSuspended: true,
          suspensionReason:
            suspensionReason ??
            `الديون المعلقة (${totalPending.toFixed(2)} ر.ق) تجاوزت حد السقف (${threshold.toFixed(2)} ر.ق)`,
          updatedAt: new Date(),
        })
        .where(eq(officesTable.id, officeId));

      req.log.warn(
        { officeId, totalPending, threshold },
        "kill switch activated — office suspended",
      );

      return res.json({
        ok: true,
        action: "suspended",
        officeId,
        totalPending,
        threshold,
        message: `تم تعليق المكتب تلقائياً. الديون المعلقة: ${totalPending.toFixed(2)} تجاوزت الحد: ${threshold.toFixed(2)}`,
      });
    }

    if (!shouldSuspend && office.isSuspended) {
      await db
        .update(officesTable)
        .set({
          isSuspended: false,
          suspensionReason: null,
          updatedAt: new Date(),
        })
        .where(eq(officesTable.id, officeId));

      return res.json({
        ok: true,
        action: "reinstated",
        officeId,
        totalPending,
        threshold,
        message: "تمت إعادة تفعيل المكتب — الديون ضمن الحد المسموح به",
      });
    }

    return res.json({
      ok: true,
      action: "no_change",
      officeId,
      isSuspended: office.isSuspended,
      totalPending,
      threshold,
      message: office.isSuspended
        ? "المكتب معلق بالفعل"
        : "الديون ضمن الحد المسموح به — لا إجراء",
    });
  } catch (err) {
    req.log.error(err, "checkAndApplyKillSwitch failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

export async function runKillSwitchForAllOffices(req: Request, res: Response) {
  try {
    const offices = await db
      .select({
        id: officesTable.id,
        debtThreshold: officesTable.debtThreshold,
        isSuspended: officesTable.isSuspended,
      })
      .from(officesTable);

    if (offices.length === 0) {
      return res.json({ ok: true, processed: 0, suspended: [], reinstated: [] });
    }

    const officeIds = offices.map((o) => o.id);

    const pendingByOffice = await db
      .select({
        officeId: platformDuesTable.officeId,
        totalPending: sql<string>`COALESCE(SUM(${platformDuesTable.commissionAmount}), 0)`,
      })
      .from(platformDuesTable)
      .where(
        and(
          inArray(platformDuesTable.officeId, officeIds),
          eq(platformDuesTable.status, "pending"),
        ),
      )
      .groupBy(platformDuesTable.officeId);

    const pendingMap = new Map(
      pendingByOffice.map((r) => [r.officeId, Number(r.totalPending)]),
    );

    const toSuspend: string[] = [];
    const toReinstate: string[] = [];

    for (const office of offices) {
      const pending = pendingMap.get(office.id) ?? 0;
      const threshold = Number(office.debtThreshold) ?? DEFAULT_DEBT_THRESHOLD;

      if (pending > threshold && !office.isSuspended) {
        toSuspend.push(office.id);
      } else if (pending <= threshold && office.isSuspended) {
        toReinstate.push(office.id);
      }
    }

    if (toSuspend.length > 0) {
      await db
        .update(officesTable)
        .set({
          isSuspended: true,
          suspensionReason: "تجاوز سقف الديون المعلقة — Kill Switch تلقائي",
          updatedAt: new Date(),
        })
        .where(inArray(officesTable.id, toSuspend));
    }

    if (toReinstate.length > 0) {
      await db
        .update(officesTable)
        .set({
          isSuspended: false,
          suspensionReason: null,
          updatedAt: new Date(),
        })
        .where(inArray(officesTable.id, toReinstate));
    }

    req.log.info(
      { suspended: toSuspend.length, reinstated: toReinstate.length },
      "kill switch batch run complete",
    );

    return res.json({
      ok: true,
      processed: offices.length,
      suspended: toSuspend,
      reinstated: toReinstate,
    });
  } catch (err) {
    req.log.error(err, "runKillSwitchForAllOffices failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
