import { type Request, type Response } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";
import { signToken } from "../lib/jwt";

const demoSchema = z.object({ email: z.enum(["client@mustashark.com", "lawyer@mustashark.com"]), password: z.literal("test1234"), role: z.enum(["client", "lawyer"]) });
const DEMO_USERS = {
  client: { id: "client-test", email: "client@mustashark.com", name: "عميل تجريبي", phone: "+97450000001", country: "qatar" as const },
  lawyer: { id: "lawyer-test", email: "lawyer@mustashark.com", name: "د. محامٍ تجريبي", phone: "+97450000002", country: "qatar" as const, specialization: "قانون تجاري", bio: "حساب تجريبي لاختبار لوحة تحكم المحامي وجميع ميزات التطبيق.", hourlyRate: "200" },
};
const demoAuthEnabled = process.env.NODE_ENV !== "production" || process.env.MUSTASHAREK_DEMO_AUTH_ENABLED === "true" || Boolean(process.env.REPL_ID || process.env.REPLIT_DEPLOYMENT_ID);

export async function demoAuth(req: Request, res: Response) {
  if (!demoAuthEnabled) return res.status(404).json({ ok: false, error: "not_found" });
  const parsed = demoSchema.safeParse(req.body);
  if (!parsed.success || (parsed.data.role === "client" && parsed.data.email !== "client@mustashark.com") || (parsed.data.role === "lawyer" && parsed.data.email !== "lawyer@mustashark.com")) return res.status(401).json({ ok: false, error: "invalid_demo_credentials" });
  try {
    const demo = DEMO_USERS[parsed.data.role];
    let existing = (await db.select().from(usersTable).where(eq(usersTable.email, demo.email)).limit(1))[0] ?? null;
    if (!existing) {
      const lawyerFields = parsed.data.role === "lawyer"
        ? { specialization: "specialization" in demo ? demo.specialization : null, bio: "bio" in demo ? demo.bio : null, hourlyRate: "hourlyRate" in demo ? demo.hourlyRate : null }
        : {};
      await db.insert(usersTable).values({ id: demo.id, name: demo.name, email: demo.email, phone: demo.phone, phoneCountry: "qatar", country: demo.country, role: parsed.data.role, authProvider: "local", accountStatus: "active", ...lawyerFields, createdAt: new Date(), updatedAt: new Date() });
      existing = (await db.select().from(usersTable).where(eq(usersTable.email, demo.email)).limit(1))[0] ?? null;
    } else if (existing.role !== parsed.data.role) return res.status(403).json({ ok: false, error: "role_mismatch" });
    if (!existing) return res.status(500).json({ ok: false, error: "user_creation_failed" });
    if (existing.accountStatus !== "active" || existing.authProvider !== "local") {
      await db.update(usersTable).set({ accountStatus: "active", authProvider: "local", updatedAt: new Date() }).where(eq(usersTable.id, existing.id));
      existing = (await db.select().from(usersTable).where(eq(usersTable.id, existing.id)).limit(1))[0] ?? existing;
    }
    const jwt = signToken({ userId: existing.id, email: existing.email, role: parsed.data.role, provider: "local" });
    return res.json({ ok: true, jwt, userId: existing.id, user: { id: existing.id, name: existing.name, email: existing.email, role: existing.role, phone: existing.phone, country: existing.country, specialization: existing.specialization, bio: existing.bio, hourlyRate: existing.hourlyRate ? Number(existing.hourlyRate) : null } });
  } catch (err) { req.log.error(err, "demoAuth failed"); return res.status(500).json({ ok: false, error: "internal_error" }); }
}
