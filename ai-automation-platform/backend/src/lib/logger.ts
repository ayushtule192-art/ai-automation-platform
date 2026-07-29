import winston from "winston";
import { env, isDevelopment } from "../config/env.js";

const { combine, timestamp, errors, json, colorize, printf } = winston.format;

/** Human-readable format for development */
const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ level, message, timestamp: ts, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : "";
    return stack
      ? `${ts} ${level}: ${message}${metaStr}\n${stack}`
      : `${ts} ${level}: ${message}${metaStr}`;
  })
);

/** Structured JSON format for production */
const prodFormat = combine(timestamp(), errors({ stack: true }), json());

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: { service: "ai-automation-platform-api" },
  format: isDevelopment ? devFormat : prodFormat,
  transports: [new winston.transports.Console()],
});

/** Morgan stream adapter — pipes HTTP logs through Winston */
export const morganStream = {
  write: (message: string): void => {
    logger.http(message.trim());
  },
};
