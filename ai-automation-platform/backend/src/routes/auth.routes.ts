import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "../controllers/auth/index.js";
import {
  authenticate,
  optionalAuthenticate,
  validate,
} from "../middlewares/index.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from "../validators/auth/auth.validator.js";

const router = Router();

/** Stricter rate limit for auth endpoints to prevent brute-force attacks */
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT",
      message: "Too many authentication attempts, please try again later",
    },
  },
});

const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT",
      message: "Too many password reset requests, please try again later",
    },
  },
});

router.post("/register", authRateLimiter, validate(registerSchema), authController.register);
router.post("/login", authRateLimiter, validate(loginSchema), authController.login);
router.post("/refresh", authRateLimiter, authController.refresh);
router.post("/logout", optionalAuthenticate, authController.logout);
router.post(
  "/forgot-password",
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword
);
router.post(
  "/reset-password",
  passwordResetLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword
);
router.get("/me", authenticate, authController.me);

export { router as authRoutes };
