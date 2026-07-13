import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import path from "path";
import { fileURLToPath } from "url";

import router from "./routes/index.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import { notFoundMiddleware } from "./middlewares/notFound.middleware.js";
import logger from "./config/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();

// ─────────────────────────────────────────────
// SEGURANÇA — Headers HTTP
// ─────────────────────────────────────────────
app.use(helmet());

// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((o) => o.trim());

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
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Muitas requisições. Tente novamente em 15 minutos.",
  },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Muitas tentativas de login. Tente novamente em 15 minutos.",
  },
});

const clientAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Muitas tentativas de autenticação. Tente novamente em 15 minutos.",
  },
});

app.use("/api/", limiter);
app.use("/api/auth/", authLimiter);
app.use("/api/client-auth/", clientAuthLimiter);

// ─────────────────────────────────────────────
// BODY PARSER
// ─────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─────────────────────────────────────────────
// ARQUIVOS ESTÁTICOS — uploads de imagens
// ─────────────────────────────────────────────
app.use(
  "/uploads",
  express.static(path.join(__dirname, "../../uploads"), {
    maxAge: "7d",
    etag: true,
  })
);

// ─────────────────────────────────────────────
// REQUEST LOGGER
// ─────────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.originalUrl} — IP: ${req.ip}`);
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
