import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { lawyerClientsTable, usersTable } from "@workspace/db/schema";

export class LawyerClientOwnershipError extends Error {
  constructor(public readonly code: "CLIENT_NOT_FOUND" | "CLIENT_NOT_ACTIVE" | "OWNERSHIP_NOT_FOUND") {
    super(code);
  }
}

/**
 * Neutral Core ownership boundary.
 * This service deliberately has no dependency on bookings, agreements,
 * representation, payments, wallets, settlement, escrow, or marketplace data.
 */
export async function ensureLawyerClientOwnership(lawyerId: string, clientId: string) {
  const [client] = await db
    .select({ id: usersTable.id, role: usersTable.role, accountStatus: usersTable.accountStatus, deletedAt: usersTable.deletedAt })
    .from(usersTable)
    .where(eq(usersTable.id, clientId))
    .limit(1);

  if (!client || client.role !== "client") throw new LawyerClientOwnershipError("CLIENT_NOT_FOUND");
  if (client.accountStatus !== "active" || client.deletedAt !== null) {
    throw new LawyerClientOwnershipError("CLIENT_NOT_ACTIVE");
  }

  const [ownership] = await db
    .select()
    .from(lawyerClientsTable)
    .where(
      and(
        eq(lawyerClientsTable.lawyerId, lawyerId),
        eq(lawyerClientsTable.clientId, clientId),
        eq(lawyerClientsTable.status, "active"),
      ),
    )
    .limit(1);

  if (!ownership) throw new LawyerClientOwnershipError("OWNERSHIP_NOT_FOUND");
  return ownership;
}

export async function listLawyerOwnedClients(lawyerId: string) {
  return db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      country: usersTable.country,
    })
    .from(lawyerClientsTable)
    .innerJoin(usersTable, eq(usersTable.id, lawyerClientsTable.clientId))
    .where(
      and(
        eq(lawyerClientsTable.lawyerId, lawyerId),
        eq(lawyerClientsTable.status, "active"),
        eq(usersTable.role, "client"),
        eq(usersTable.accountStatus, "active"),
      ),
    );
}
