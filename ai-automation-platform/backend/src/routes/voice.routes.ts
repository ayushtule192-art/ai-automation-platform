import { Router } from "express";
import { voiceController } from "../controllers/voice/voice.controller.js";
import { authenticate } from "../middlewares/index.js";
import { audioUpload } from "../middlewares/upload.middleware.js";

const router = Router();

router.use(authenticate);

router.get("/status", voiceController.getStatus);
router.post("/sessions", voiceController.createSession);
router.get("/sessions/:id", voiceController.getSession);
router.delete("/sessions/:id", voiceController.endSession);
router.post(
  "/sessions/:id/turn",
  audioUpload.single("audio"),
  voiceController.processTurn
);

export { router as voiceRoutes };
