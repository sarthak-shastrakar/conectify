import dotenv from "dotenv";
dotenv.config({ path: "src/.env" });

// ─── Startup: validate all required env vars BEFORE anything else ─────────────
const REQUIRED_ENV = ["PORT", "MONGO_URI", "JWT_ACCESS_SECRET", "ALLOWED_ORIGINS", "GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"];
REQUIRED_ENV.forEach((key) => {
  if (!process.env[key]) {
    console.error(`FATAL: Missing required env variable: ${key}`);
    process.exit(1);
  }
});

// JWT secret must be at least 64 chars — short secrets are brute-forceable
if (process.env.JWT_ACCESS_SECRET.length < 64) {
  console.error("FATAL: JWT_ACCESS_SECRET must be at least 64 characters long.");
  process.exit(1);
}

import express from "express";
import { createServer } from "node:http";
import mongoose from "mongoose";
import { connectToSocket } from "./controllers/socketManager.js";
import { errorHandler } from "./middleware/errorHandler.js";
import session from "express-session";

import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import userRoutes from "./routes/users.routes.js";
import passport, { configurePassport } from "./config/passport.js";

const app = express();
const server = createServer(app);
const io = connectToSocket(server);

// ─── Security headers — must be FIRST middleware ──────────────────────────────
app.use(helmet());

// Session (required for passport only — not for JWT auth)
app.use(session({
  secret: process.env.JWT_ACCESS_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 5 * 60 * 1000 }, // 5 min only (just for OAuth handshake)
}));

configurePassport();
app.use(passport.initialize());
app.use(passport.session());

// ─── HTTP request logger — only in development ────────────────────────────────
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ─── CORS — whitelist only, never wildcard ────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. curl, Postman, mobile apps)
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS policy"));
      }
    },
    credentials: true,
  })
);

// ─── General API rate limiter — 100 requests per 15 min ──────────────────────
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many requests. Please try again later." },
});
app.use(generalLimiter);

app.use(express.json({ limit: "40kb" }));
app.use(express.urlencoded({ limit: "40kb", extended: true }));

app.use("/api/v1/users", userRoutes);

// ─── Centralized error handler — must be LAST middleware ─────────────────────
app.use(errorHandler);

// ─── Database + Server start ──────────────────────────────────────────────────
const start = async () => {
  try {
    const connectionDb = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${connectionDb.connection.host}`);

    const PORT = process.env.PORT || 8002;
    server.listen(PORT, () => {
      console.log(`Server listening on port ${PORT}`);
    });
  } catch (err) {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  }
};

// ─── Graceful shutdown — drain connections before exiting ─────────────────────
const shutdown = () => {
  console.log("Shutting down gracefully...");
  server.close(() => {
    mongoose.connection.close(false, () => {
      console.log("MongoDB connection closed.");
      process.exit(0);
    });
  });
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

start();
