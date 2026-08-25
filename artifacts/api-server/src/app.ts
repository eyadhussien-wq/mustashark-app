import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// 1. Secure CORS Configuration
const allowedOrigins = [
  "https://mustasharek.com",
  "https://admin.mustasharek.com",
  /^http:\/\/127\.0\.0\.1:\d+$/,
  ...(process.env.NODE_ENV === "test" ? ["http://localhost:3000"] : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // السماح بالطلبات التي ليس لها Origin (مثل Postman أو السيرفرات الداخلية)
      if (!origin) return callback(null, true);

      const allowed = allowedOrigins.some((allowedOrigin) => {
        if (allowedOrigin instanceof RegExp) {
          return allowedOrigin.test(origin);
        }
        return allowedOrigin === origin;
      });

      if (allowed) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Idempotency-Key"],
  }),
);

// 2. Simple & Robust In-Memory Rate Limiter Middleware
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const WINDOW_MS = 15 * 60 * 1000; // 15 دقيقة
const MAX_REQUESTS = 300; // أقصى عدد طلبات لكل آي بي خلال نافذة الوقت
const MAX_TRACKED_IPS = 10_000;

const rateLimitCleanup = setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitMap) {
    if (now > record.resetTime) rateLimitMap.delete(ip);
  }
}, WINDOW_MS);
rateLimitCleanup.unref?.();

app.use((req, res, next) => {
  // تخطي الـ Rate Limit لطلبات الفحص (Health Check)
  if (req.path === "/api/healthz") {
    return next();
  }

  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  let record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    record = { count: 0, resetTime: now + WINDOW_MS };
    rateLimitMap.set(ip, record);
  }

  record.count += 1;
  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({ error: "Too many requests" });
  }

  if (rateLimitMap.size > MAX_TRACKED_IPS) {
    const oldest = rateLimitMap.keys().next().value;
    if (oldest) rateLimitMap.delete(oldest);
  }

  next();
});

app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(pinoHttp({ logger }));
app.use("/api", router);

export default app;
