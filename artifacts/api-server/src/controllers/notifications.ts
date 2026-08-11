import { Request, Response } from "express";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";

export const listNotifications = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    const notifications = await db.select().from(notificationsTable)
      .where(eq(notificationsTable.userId, authUser.id))
      .orderBy(desc(notificationsTable.createdAt))
      .limit(50);
    return res.json({ ok: true, notifications });
  } catch (error) {
    console.error("List Notifications Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    const notificationId = String(req.params.id ?? "");
    const [updated] = await db.update(notificationsTable).set({ readAt: new Date() }).where(and(eq(notificationsTable.id, notificationId), eq(notificationsTable.userId, authUser.id), isNull(notificationsTable.readAt))).returning();
    if (!updated) return res.status(404).json({ ok: false, error: "notification_not_found" });
    return res.json({ ok: true, notification: updated });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
