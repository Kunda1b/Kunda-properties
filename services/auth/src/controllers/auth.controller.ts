import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { prisma } from "@kunda/database";
import { generateTokens, verifyRefreshToken } from "../utils/jwt";
import { redis } from "../utils/redis";
import { sendVerificationEmail, sendPasswordResetEmail } from "../utils/email";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password, firstName, lastName, role, diasporaCountry, phone } = req.body;
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) throw new AppError("Email already registered", 409, "EMAIL_EXISTS");

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { email: email.toLowerCase(), passwordHash, phone, role: role || "BUYER", diasporaCountry,
        profile: { create: { firstName, lastName } } },
      include: { profile: true },
    });

    const verifyToken = uuidv4();
    await redis.setex(`email_verify:${verifyToken}`, 86400, user.id);
    await sendVerificationEmail(user.email, verifyToken, firstName);

    logger.info({ userId: user.id }, "New user registered");
    res.status(201).json({ success: true, message: "Account created. Please verify your email.",
      data: { id: user.id, email: user.email, role: user.role, profile: user.profile } });
  } catch (error) { return next(error); }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, include: { profile: true, kyc: { select: { status: true } } } });

    if (!user) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
    if (!user.isActive) throw new AppError("Account is deactivated", 401, "ACCOUNT_INACTIVE");
    if (user.isSuspended) throw new AppError("Account is suspended. Contact support.", 403, "ACCOUNT_SUSPENDED");

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

    const { accessToken, refreshToken } = await generateTokens(user.id, user.role);
    await prisma.session.create({ data: { userId: user.id, refreshToken, userAgent: req.headers["user-agent"],
      ipAddress: req.ip, expiresAt: new Date(Date.now() + 7*24*60*60*1000) } });

    logger.info({ userId: user.id }, "User logged in");
    res.json({ success: true, data: { accessToken, refreshToken, user: {
      id: user.id, email: user.email, role: user.role, isEmailVerified: user.isEmailVerified,
      profile: user.profile, preferredCurrency: user.preferredCurrency, diasporaCountry: user.diasporaCountry,
      kyc: user.kyc,
    }}});
  } catch (error) { return next(error); }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError("Refresh token required", 400, "TOKEN_REQUIRED");
    const payload = verifyRefreshToken(token);

    const session = await prisma.session.findUnique({ where: { refreshToken: token } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) throw new AppError("Invalid or expired refresh token", 401, "TOKEN_INVALID");

    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) throw new AppError("User not found or inactive", 401, "USER_INACTIVE");

    const tokens = await generateTokens(user.id, user.role);
    await prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    await prisma.session.create({ data: { userId: user.id, refreshToken: tokens.refreshToken,
      userAgent: req.headers["user-agent"], ipAddress: req.ip, expiresAt: new Date(Date.now()+7*24*60*60*1000) } });

    res.json({ success: true, data: tokens });
  } catch (error) { return next(error); }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const { refreshToken: token } = req.body;
    if (token) await prisma.session.updateMany({ where: { refreshToken: token }, data: { revokedAt: new Date() } });
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      await redis.setex(`blacklist:${authHeader.slice(7)}`, 900, "1");
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (error) { return next(error); }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const { token } = req.params;
    const userId = await redis.get(`email_verify:${token}`);
    if (!userId) throw new AppError("Invalid or expired verification link", 400, "TOKEN_INVALID");
    await prisma.user.update({ where: { id: userId }, data: { isEmailVerified: true } });
    await redis.del(`email_verify:${token}`);
    res.json({ success: true, message: "Email verified successfully" });
  } catch (error) { return next(error); }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
      const resetToken = uuidv4();
      await redis.setex(`password_reset:${resetToken}`, 3600, user.id);
      await sendPasswordResetEmail(user.email, resetToken);
    }
    res.json({ success: true, message: "If that email exists, a reset link has been sent." });
  } catch (error) { return next(error); }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const { token, password } = req.body;
    const userId = await redis.get(`password_reset:${token}`);
    if (!userId) throw new AppError("Invalid or expired reset link", 400, "TOKEN_INVALID");
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    await prisma.session.updateMany({ where: { userId, revokedAt: null }, data: { revokedAt: new Date() } });
    await redis.del(`password_reset:${token}`);
    res.json({ success: true, message: "Password reset successfully" });
  } catch (error) { return next(error); }
}

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: (req as any).user.id },
      include: { profile: true, kyc: { select: { status: true, verifiedAt: true } } } });
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
    const { passwordHash, ...safeUser } = user;
    res.json({ success: true, data: safeUser });
  } catch (error) { return next(error); }
}
