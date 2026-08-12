import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

export * from "./schema";

// Explicit public exports for the availability/booking tables. These are
// intentionally part of @workspace/db so API consumers can import the same
// schema surface without relying on wildcard re-export discovery.
export { lawyerAvailabilityTable } from "./schema/lawyerAvailability";
export { bookingTimeBlocksTable } from "./schema/bookingTimeBlocks";
