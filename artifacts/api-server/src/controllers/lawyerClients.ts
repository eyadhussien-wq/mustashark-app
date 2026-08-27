import { Request, Response } from "express";
import { and, asc, eq, isNull } from "drizzle-orm";
import { db } from "@workspace/db";
import { bookingsTable, usersTable } from "@workspace/db/schema";

export type LawyerClientDirectoryItem = {
  id: string;
  name: string;
  email: string;
  country: string | null;
};

export const listMyClients = async (req: Request, res: Response) => {
  try {
    const lawyerId = req.authUser!.id;
    const rows = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        country: usersTable.country,
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
      .orderBy(asc(usersTable.name));

    const uniqueClients = Array.from(new Map(rows.map((client) => [client.id, client])).values());
    return res.json({ ok: true, clients: uniqueClients satisfies LawyerClientDirectoryItem[] });
  } catch (error) {
    console.error("List My Clients Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
