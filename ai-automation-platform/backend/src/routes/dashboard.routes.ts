import { Router } from "express";
import { dashboardController } from "../controllers/dashboard/dashboard.controller.js";
import { authenticate } from "../middlewares/index.js";

const router = Router();

router.use(authenticate);

router.get("/stats", dashboardController.getStats);
router.get("/activity", dashboardController.getRecentActivity);

export { router as dashboardRoutes };
