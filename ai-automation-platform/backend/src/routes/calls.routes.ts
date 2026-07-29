import { Router } from "express";
import { callsController } from "../controllers/calls/calls.controller.js";
import { twilioWebhookController } from "../controllers/calls/twilio-webhook.controller.js";
import { authenticate } from "../middlewares/index.js";
import { csvUpload } from "../middlewares/upload.middleware.js";
import { twilioWebhookAuth } from "../middlewares/twilio-webhook.middleware.js";

const router = Router();

// ─── Twilio webhooks (no JWT — validated via Twilio signature) ───────────────
router.post("/webhook/voice", twilioWebhookAuth, twilioWebhookController.voice);
router.post("/webhook/gather", twilioWebhookAuth, twilioWebhookController.gather);
router.post("/webhook/status", twilioWebhookAuth, twilioWebhookController.status);
router.post("/webhook/recording", twilioWebhookAuth, twilioWebhookController.recording);

// ─── Authenticated call management ───────────────────────────────────────────
router.use(authenticate);

router.get("/status", callsController.getStatus);
router.get("/analytics", callsController.getAnalytics);
router.get("/", callsController.listCalls);
router.get("/:id", callsController.getCall);
router.delete("/:id", callsController.cancelCall);
router.post(
  "/upload",
  csvUpload.single("csv"),
  callsController.uploadAndSchedule
);

export { router as callsRoutes };
