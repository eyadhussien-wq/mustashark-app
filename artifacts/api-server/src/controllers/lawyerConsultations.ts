import { Request, Response } from "express";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@workspace/db";
import { bookingsTable, usersTable } from "@workspace/db/schema";

export type LawyerConsultationItem = {
  id: string;
  serialNumber: string;
  client: {
    id: string;
    name: string;
    email: string;
    country: string | null;
  };
  subject: string;
  description: string | null;
  scheduledDate: string;
  scheduledTime: string;
  type: string;
  status: string;
};

export const listMyConsultations = async (req: Request, res: Response) => {
  try {
    const lawyerId = req.authUser!.id;

    const rows = await db
      .select({
        id: bookingsTable.id,
        serialNumber: bookingsTable.serialNumber,
        subject: bookingsTable.subject,
        description: bookingsTable.description,
        scheduledDate: bookingsTable.scheduledDate,
        scheduledTime: bookingsTable.scheduledTime,
        type: bookingsTable.type,
        status: bookingsTable.status,
        clientId: usersTable.id,
        clientName: usersTable.name,
        clientEmail: usersTable.email,
        clientCountry: usersTable.country,
      })
      .from(bookingsTable)
      .innerJoin(usersTable, eq(usersTable.id, bookingsTable.clientId!))
      .where(
        and(
          eq(bookingsTable.lawyerId, lawyerId),
          eq(usersTable.role, "client"),
          eq(usersTable.accountStatus, "active"),
          isNull(usersTable.deletedAt),
        ),
      )
      .orderBy(asc(bookingsTable.scheduledDate), asc(bookingsTable.scheduledTime));

    const consultations: LawyerConsultationItem[] = rows.map((row) => ({
      id: row.id,
      serialNumber: row.serialNumber,
      client: {
        id: row.clientId,
        name: row.clientName,
        email: row.clientEmail,
        country: row.clientCountry,
      },
      subject: row.subject,
      description: row.description,
      scheduledDate: row.scheduledDate,
      scheduledTime: row.scheduledTime,
      type: row.type,
      status: row.status,
    }));

    return res.json({ ok: true, consultations });
  } catch (error) {
    console.error("List My Consultations Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
