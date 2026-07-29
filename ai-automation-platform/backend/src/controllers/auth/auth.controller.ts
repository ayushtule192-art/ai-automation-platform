import type { Request, Response } from "express";
import { authService } from "../../services/auth/index.js";
import type {
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
  ResetPasswordInput,
} from "../../validators/auth/auth.validator.js";
import {
  asyncHandler,
  sendSuccess,
  getRefreshTokenFromRequest,
  getRequestMeta,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from "../../utils/index.js";
import { HttpStatus } from "../../constants/http-status.js";

export class AuthController {
  register = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = req.body as RegisterInput;
    const result = await authService.register(input, getRequestMeta(req));

    setRefreshTokenCookie(res, result.tokens.refreshToken);
    sendSuccess(res, result, "Registration successful", HttpStatus.CREATED);
  });

  login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = req.body as LoginInput;
    const result = await authService.login(input, getRequestMeta(req));

    setRefreshTokenCookie(res, result.tokens.refreshToken, input.rememberMe);

    sendSuccess(
      res,
      {
        user: result.user,
        tokens: {
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn,
        },
      },
      "Login successful"
    );
  });

  refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const rawToken = getRefreshTokenFromRequest(req);
    if (!rawToken) {
      res.status(401).json({
        success: false,
        error: { code: "AUTH_TOKEN_MISSING", message: "Refresh token is required" },
      });
      return;
    }

    const tokens = await authService.refresh(rawToken, getRequestMeta(req));
    setRefreshTokenCookie(res, tokens.refreshToken);

    sendSuccess(
      res,
      {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
      },
      "Token refreshed"
    );
  });

  logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const rawToken = getRefreshTokenFromRequest(req);
    const userId = req.user?.id;

    await authService.logout(rawToken, userId);
    clearRefreshTokenCookie(res);

    sendSuccess(res, { message: "Logged out successfully" });
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = req.body as ForgotPasswordInput;
    const result = await authService.forgotPassword(input);
    sendSuccess(res, result);
  });

  resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const input = req.body as ResetPasswordInput;
    const result = await authService.resetPassword(input);
    sendSuccess(res, result);
  });

  me = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const user = await authService.getProfile(req.user!.id);
    sendSuccess(res, { user });
  });
}

export const authController = new AuthController();
