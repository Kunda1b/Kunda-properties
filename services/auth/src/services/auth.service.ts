import bcrypt from "bcryptjs";
import type { AuthTokens, SessionPayload } from "@kunda/types";
import type {
  LoginInput,
  RegisterInput,
  VerifyOTPInput,
} from "@kunda/validators";
import * as configModule from "@kunda/config";
import * as dbModule from "@kunda/db";
import {
  generateOTP,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/token";
import { sendWelcomeEmail } from "../utils/email";

const { logger, publishNotification, SESSION_TTL_SECONDS } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");
const { deleteSession, prisma, setOTP, setSession, verifyOTP } =
  ("default" in dbModule ? dbModule.default : dbModule) as typeof import("@kunda/db");

type TokenUser = {
  email: string;
  id: string;
  kycStatus: string;
  role: string;
};

export class AuthService {
  async register(input: RegisterInput): Promise<{ message: string }> {
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw new Error("EMAIL_TAKEN");
    }

    const passwordHash = await bcrypt.hash(input.password, 12);

    const user = await prisma.user.create({
      data: {
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        phone: input.phone,
        country: input.country,
        role: "BUYER",
      },
    });

    const otp = generateOTP();
    await setOTP(user.email, otp, 600);
    await publishNotification({
      event: "OTP_REQUESTED",
      channel: "EMAIL",
      recipient: {
        email: user.email,
        name: user.fullName,
      },
      payload: {
        name: user.fullName,
        code: otp,
      },
    });

    logger.info("User registered", { userId: user.id, email: user.email });

    return {
      message: "Registration successful. Check your email for a verification code.",
    };
  }

  async verifyEmail(input: VerifyOTPInput): Promise<AuthTokens> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (user.emailVerified) {
      throw new Error("ALREADY_VERIFIED");
    }

    const valid = await verifyOTP(input.email, input.code);

    if (!valid) {
      throw new Error("INVALID_OTP");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    await sendWelcomeEmail(user.email, user.fullName);

    const tokens = await this.issueTokens(user);
    logger.info("Email verified", { userId: user.id });

    return tokens;
  }

  async login(input: LoginInput): Promise<AuthTokens> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const passwordMatch = await bcrypt.compare(input.password, user.passwordHash);

    if (!passwordMatch) {
      throw new Error("INVALID_CREDENTIALS");
    }

    if (!user.emailVerified) {
      throw new Error("EMAIL_NOT_VERIFIED");
    }

    const tokens = await this.issueTokens(user);
    logger.info("User logged in", { userId: user.id });

    return tokens;
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    let payload: { userId: string };

    try {
      payload = verifyRefreshToken(refreshToken);
    } catch {
      throw new Error("INVALID_REFRESH_TOKEN");
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    await deleteSession(refreshToken);
    return this.issueTokens(user);
  }

  async logout(refreshToken: string): Promise<void> {
    await deleteSession(refreshToken);
    logger.info("User logged out");
  }

  async resendOTP(email: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (user.emailVerified) {
      throw new Error("ALREADY_VERIFIED");
    }

    const otp = generateOTP();
    await setOTP(email, otp, 600);
    await publishNotification({
      event: "OTP_REQUESTED",
      channel: "EMAIL",
      recipient: {
        email,
        name: user.fullName,
      },
      payload: {
        name: user.fullName,
        code: otp,
      },
    });

    logger.info("OTP resent", { email });
  }

  private async issueTokens(user: TokenUser): Promise<AuthTokens> {
    const payload: SessionPayload = {
      userId: user.id,
      email: user.email,
      role: user.role as SessionPayload["role"],
      kycStatus: user.kycStatus as SessionPayload["kycStatus"],
    };

    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(user.id);

    await setSession(refreshToken, user.id, SESSION_TTL_SECONDS.web);

    return {
      accessToken,
      refreshToken,
      expiresIn: 60 * 60 * 24,
    };
  }
}

export const authService = new AuthService();
