import { Router } from "express";
import { authRoutes } from "./auth.routes.js";
import { dashboardRoutes } from "./dashboard.routes.js";
import { chatRoutes } from "./chat.routes.js";
import { voiceRoutes } from "./voice.routes.js";
import { callsRoutes } from "./calls.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/chat", chatRoutes);
router.use("/voice", voiceRoutes);
router.use("/calls", callsRoutes);

/** Health check — used by Docker and load balancers */
router.get("/health", (_req, res) => {
  res.json({ success: true, data: { status: "ok", timestamp: new Date().toISOString() } });
});

export { router as apiRoutes };
