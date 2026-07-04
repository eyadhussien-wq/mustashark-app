import jwt from "jsonwebtoken";

const SECRET = process.env.SESSION_SECRET;

if (!SECRET) {
  throw new Error("SESSION_SECRET env var must be set for JWT signing");
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: "client" | "lawyer" | "admin";
  provider: "local" | "google" | "facebook" | "apple";
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SECRET!, { expiresIn: "30d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SECRET!) as JwtPayload;
}
