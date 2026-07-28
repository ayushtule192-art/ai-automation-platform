import { env } from "./env.js";

export const socketConfig = {
  corsOrigin: env.SOCKET_CORS_ORIGIN.split(",").map((origin) => origin.trim()),
  pingTimeout: 60_000,
  pingInterval: 25_000,
  transports: ["websocket", "polling"] as const,
  namespaces: {
    notifications: "/notifications",
    chat: "/chat",
    voice: "/voice",
    agentStatus: "/agent-status",
  },
} as const;

export type SocketConfig = typeof socketConfig;
