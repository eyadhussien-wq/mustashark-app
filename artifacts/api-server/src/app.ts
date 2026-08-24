import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// 1. Secure CORS Configuration
//
// Production domains will be added here only after the real
// mustashark.com infrastructure is provisioned.
//
// Local development origins are intentionally limited to localhost
// and 127.0.0.1 with an explicit port.
const allowedOrigins = [
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests without an Origin header (for example, internal
      // server-to-server requests or certain CLI tools) are allowed.
      if (!origin) return callback(null, true);

      const allowed = allowedOrigins.some((allowedOrigin) =>
        allowedOrigin.test(origin),
      );

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

// 2. Simple and bounded in-memory rate limiter
const rateLimitMap = new Map<
  string,
  { count: number; resetTime: number }
>();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 300;
const MAX_TRACKED_IPS = 10_000;

const rateLimitCleanup = setInterval(() => {
  const now = Date.now();

  for (const [ip, record] of rateLimitMap) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip);
    }
  }
}, WINDOW_MS);

rateLimitCleanup.unref?.();

app.use((req, res, next) => {
  // Health checks must remain available to infrastructure.
  if (req.path === "/api/healthz") {
    return next();
  }

  const ip = req.ip || req.socket.remoteAddress || "unknown";
  const now = Date.now();

  let record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    // Prevent unbounded memory growth from unique IPs.
    if (rateLimitMap.size >= MAX_TRACKED_IPS) {
      for (const [trackedIp, trackedRecord] of rateLimitMap) {
        if (now > trackedRecord.resetTime) {
          rateLimitMap.delete(trackedIp);
        }
      }

      if (rateLimitMap.size >= MAX_TRACKED_IPS) {
        rateLimitMap.clear();
      }
    }

    record = {
      count: 1,
      resetTime: now + WINDOW_MS,
    };

    rateLimitMap.set(ip, record);
  } else {
    record.count++;
  }

  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({
      ok: false,
      error: "تم تجاوز الحد المسموح من الطلبات، يرجى المحاولة لاحقاً.",
    });
  }

  next();
});

// 3. HTTP request logging
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

// 4. Request body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// 5. API routes
app.use("/api", router);

export default app;