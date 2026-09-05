import { Request, Response } from "express";
import { withDbRequestContext } from "../db/transactionContext";
import { userActor } from "../db/systemActor";
import {
  listNotificationsService,
  markNotificationReadService,
} from "../services/notifications";

export const listNotifications = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    const notifications = await withDbRequestContext(
      userActor(authUser.id, authUser.role),
      async ({ tx }) =>
        listNotificationsService(
          { userId: authUser.id },
          { tx },
        ),
    );

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
    const updated = await withDbRequestContext(
      userActor(authUser.id, authUser.role),
      async ({ tx }) =>
        markNotificationReadService(
          {
            userId: authUser.id,
            notificationId,
          },
          { tx },
        ),
    );

    if (!updated) {
      return res.status(404).json({ ok: false, error: "notification_not_found" });
    }

    return res.json({ ok: true, notification: updated });
  } catch (error) {
    console.error("Mark Notification Read Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
