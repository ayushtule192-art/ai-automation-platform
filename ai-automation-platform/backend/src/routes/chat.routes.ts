import { Router } from "express";
import { chatController } from "../controllers/chat/chat.controller.js";
import { authenticate } from "../middlewares/index.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createConversationSchema,
  sendMessageSchema,
} from "../validators/chat/chat.validator.js";

const router = Router();

router.use(authenticate);

router.get("/conversations", chatController.listConversations);
router.post(
  "/conversations",
  validate(createConversationSchema),
  chatController.createConversation
);
router.get("/conversations/:id", chatController.getConversation);
router.delete("/conversations/:id", chatController.archiveConversation);
router.post(
  "/conversations/:id/messages",
  validate(sendMessageSchema),
  chatController.streamMessage
);

export { router as chatRoutes };
