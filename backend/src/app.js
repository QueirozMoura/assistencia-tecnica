import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import router from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";
import logger from "./config/logger.js";
import { sanitizeUrl } from "./utils/logSanitizer.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRootDir = path.resolve(__dirname, "..");
const uploadsDir = path.resolve(backendRootDir, "uploads");

const app = express();

// Necessário em ambientes com proxy reverso (ex.: Render)
// para IP/header forwarding e compatibilidade com express-rate-limit
app.set("trust proxy", 1);

// ─────────────────────────────────────────────
// SEGURANÇA — Headers HTTP
// ─────────────────────────────────────────────
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    xPoweredBy: false,
    contentSecurityPolicy: false,
  })
);
app.disable("x-powered-by");

// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`CORS bloqueado para origem: ${origin}`));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ─────────────────────────────────────────────
// RATE LIMITING
// ─────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Muitas requisições. Tente novamente em 15 minutos.",
  },
});

app.use("/api/", limiter);

// ─────────────────────────────────────────────
// BODY PARSER
// ─────────────────────────────────────────────
app.use(
  express.json({
    limit: "10mb",
    verify: (req, _res, buf) => {
      const requestPath = (req.originalUrl || req.url || "").split("?")[0];
      if (req.method === "POST" && requestPath === "/api/pagamentos/webhook") {
        req.rawBody = buf.toString("utf8");
      }
    },
  })
);
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ─────────────────────────────────────────────
// ARQUIVOS ESTÁTICOS — uploads de imagens
// ─────────────────────────────────────────────
app.use(
  "/uploads",
  express.static(uploadsDir, {
    maxAge: "7d",
    etag: true,
  })
);

// ─────────────────────────────────────────────
// REQUEST LOGGER
// ─────────────────────────────────────────────
app.use((req, _res, next) => {
  const safeUrl = sanitizeUrl(req.originalUrl);
  logger.info(`${req.method} ${safeUrl} — IP: ${req.ip}`);
  next();
});

// ─────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    success: true,
    message: "API Assistência Técnica — Online",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

app.get("/api/health", (_req, res) => {
  res.json({
    success: true,
    status: "healthy",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────
// ROTAS
// ─────────────────────────────────────────────
app.use("/api", router);

// ─────────────────────────────────────────────
// 404 + ERROR HANDLER
// ─────────────────────────────────────────────
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
