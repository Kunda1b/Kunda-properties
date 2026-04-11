import type { Request, Response } from "express";
import {
  loginSchema,
  registerSchema,
  verifyOTPSchema,
} from "@kunda/validators";
import * as dbModule from "@kunda/db";
import { authService } from "../services/auth.service";
import type { AuthRequest } from "../middleware/auth.middleware";

const { prisma } = ("default" in dbModule ? dbModule.default : dbModule) as typeof import("@kunda/db");

const ERROR_MAP: Record<string, { message: string; status: number }> = {
  EMAIL_TAKEN: {
    status: 409,
    message: "An account with this email already exists",
  },
  INVALID_CREDENTIALS: {
    status: 401,
    message: "Invalid email or password",
  },
  EMAIL_NOT_VERIFIED: {
    status: 403,
    message: "Please verify your email before signing in",
  },
  USER_NOT_FOUND: {
    status: 404,
    message: "No account found with this email",
  },
  INVALID_OTP: {
    status: 400,
    message: "Incorrect or expired verification code",
  },
  ALREADY_VERIFIED: {
    status: 409,
    message: "This email is already verified",
  },
  INVALID_REFRESH_TOKEN: {
    status: 401,
    message: "Session expired — please sign in again",
  },
};

function handleError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : "UNKNOWN";
  const mapped = ERROR_MAP[message];

  if (mapped) {
    res.status(mapped.status).json({
      success: false,
      error: mapped.message,
      code: message,
    });
    return;
  }

  console.error("Unhandled auth error:", error);
  res.status(500).json({
    success: false,
    error: "Something went wrong — please try again",
    code: "INTERNAL_ERROR",
  });
}

export const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: "Invalid input",
        code: "VALIDATION_ERROR",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const data = await authService.register(result.data);
      res.status(201).json({ success: true, data });
    } catch (error) {
      handleError(res, error);
    }
  },

  async verifyEmail(req: Request, res: Response): Promise<void> {
    const result = verifyOTPSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: "Invalid input",
        code: "VALIDATION_ERROR",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const tokens = await authService.verifyEmail(result.data);
      res.status(200).json({ success: true, data: tokens });
    } catch (error) {
      handleError(res, error);
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    const result = loginSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        success: false,
        error: "Invalid input",
        code: "VALIDATION_ERROR",
        details: result.error.flatten().fieldErrors,
      });
      return;
    }

    try {
      const tokens = await authService.login(result.data);
      res.status(200).json({ success: true, data: tokens });
    } catch (error) {
      handleError(res, error);
    }
  },

  async refresh(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (!refreshToken) {
      res.status(400).json({
        success: false,
        error: "Refresh token is required",
        code: "MISSING_TOKEN",
      });
      return;
    }

    try {
      const tokens = await authService.refreshTokens(refreshToken);
      res.status(200).json({ success: true, data: tokens });
    } catch (error) {
      handleError(res, error);
    }
  },

  async logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body as { refreshToken?: string };

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.status(200).json({
      success: true,
      data: { message: "Logged out successfully" },
    });
  },

  async resendOTP(req: Request, res: Response): Promise<void> {
    const { email } = req.body as { email?: string };

    if (!email) {
      res.status(400).json({
        success: false,
        error: "Email is required",
        code: "MISSING_EMAIL",
      });
      return;
    }

    try {
      await authService.resendOTP(email);
      res.status(200).json({
        success: true,
        data: { message: "Verification code resent" },
      });
    } catch (error) {
      handleError(res, error);
    }
  },

  async me(req: Request, res: Response): Promise<void> {
    const authReq = req as AuthRequest;

    if (!authReq.user) {
      res.status(401).json({
        success: false,
        error: "Unauthorized",
        code: "UNAUTHORIZED",
      });
      return;
    }

    try {
      const user = await prisma.user.findUnique({
        where: { id: authReq.user.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          phone: true,
          country: true,
          role: true,
          kycStatus: true,
          emailVerified: true,
          createdAt: true,
        },
      });

      if (!user) {
        res.status(404).json({
          success: false,
          error: "User not found",
          code: "USER_NOT_FOUND",
        });
        return;
      }

      res.status(200).json({ success: true, data: user });
    } catch (error) {
      handleError(res, error);
    }
  },
};
