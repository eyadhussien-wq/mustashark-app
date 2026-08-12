import { type Request, type Response } from "express";
import { demoAuth } from "./demoAuth";
import { localAuth } from "./auth";

export async function localAuthWithDemo(req: Request, res: Response) {
  const email = typeof req.body?.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  const role = typeof req.body?.role === "string" ? req.body.role : "";

  if (process.env.NODE_ENV !== "production" && password === "test1234" && ((email === "client@mustashark.com" && role === "client") || (email === "lawyer@mustashark.com" && role === "lawyer"))) {
    return demoAuth(req, res);
  }

  return localAuth(req, res);
}
