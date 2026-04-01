import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth.js";
import botRoutes from "./routes/bots.js";
import assignmentRoutes from "./routes/assignments.js";
import connectionRoutes from "./routes/connections.js";
import portfolioRoutes from "./routes/portfolio.js";
import { errorHandler, notFound } from "./middleware/error.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ──────────────────────────────────────────────
// MIDDLEWARE
// ──────────────────────────────────────────────

// Security headers
app.use(helmet());

// CORS — allow frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true,
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Request logging
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Body parsing
app.use(express.json({ limit: "10mb" }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});
app.use("/api/", limiter);

// Stricter rate limit for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Too many auth attempts, please try again later" },
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ──────────────────────────────────────────────
// ROUTES
// ──────────────────────────────────────────────

// Health check
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "cryptiq-api",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/bots", botRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/portfolio", portfolioRoutes);

// 404 handler
app.use(notFound);

// Error handler
app.use(errorHandler);

// ──────────────────────────────────────────────
// START
// ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   Cryptiq API Server                 ║
  ║   Port: ${PORT}                          ║
  ║   Env:  ${process.env.NODE_ENV || "development"}               ║
  ╚══════════════════════════════════════╝
  `);
});

export default app;
