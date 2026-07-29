import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import { appConfig } from "./config/app.config.js";
import { morganStream } from "./lib/logger.js";
import { apiRoutes } from "./routes/index.js";
import { errorHandler, notFoundHandler } from "./middlewares/index.js";

export function createApp(): express.Application {
  const app = express();

  // Security headers
  app.use(helmet());

  // CORS — credentials required for httpOnly refresh token cookies
  app.use(
    cors({
      origin: appConfig.corsOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    })
  );

  // Compression — skip SSE streaming endpoints
  app.use(
    compression({
      filter: (req, res) => {
        if (req.path.includes("/messages") && req.method === "POST") return false;
        return compression.filter(req, res);
      },
    })
  );

  // Request parsing
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Trust proxy for correct IP behind reverse proxy (Railway, nginx)
  app.set("trust proxy", 1);

  // HTTP request logging
  app.use(
    morgan(appConfig.isDevelopment ? "dev" : "combined", { stream: morganStream })
  );

  // Global rate limiting
  app.use(
    rateLimit({
      windowMs: appConfig.rateLimit.windowMs,
      max: appConfig.rateLimit.maxRequests,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // API routes
  app.use("/api", apiRoutes);

  // 404 and error handlers (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
