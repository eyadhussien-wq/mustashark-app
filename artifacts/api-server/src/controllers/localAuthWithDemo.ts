import { type Request, type Response } from "express";
import { demoAuth } from "./demoAuth";
import { localAuth } from "./auth";

// Preview/test deployments may run with NODE_ENV=production. Keep demo
// credentials available only to the two explicit test accounts.
const demoAuthEnabled = process.env.NODE_ENV !== "production" ||
  process.env.MUSTASHAREK_DEMO_AUTH_ENABLED === "true" ||
  Boolean(process.env.REPL_ID || process.env.REPLIT_DEPLOYMENT_ID);

export async function localAuthWithDemo(req: Request, res: Response) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const role = typeof req.body?.role === "string" ? req.body.role : "";

  if (demoAuthEnabled && password === "test1234" &&
      ((email === "client@mustashark.com" && role === "client") ||
       (email === "lawyer@mustashark.com" && role === "lawyer"))) {
    return demoAuth(req, res);
  }

  return localAuth(req, res);
}
