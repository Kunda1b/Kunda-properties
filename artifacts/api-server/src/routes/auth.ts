import { Router } from "express";
import { body } from "express-validator";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";
import { db } from "@workspace/db";
import { users, userProfiles, sessions } from "@workspace/db/schema";
import { eq, and, isNull, gt } from "drizzle-orm";
import { validate } from "../middleware/validate.js";
import { authenticate } from "../middleware/authenticate.js";
import { generateTokens, verifyRefreshToken } from "../lib/jwt.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: "Too many attempts, try again in 15 minutes" },
});

// ── POST /auth/register ───────────────────────────────────────────────────────
router.post(
  "/register",
  authLimiter,
  validate([
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("firstName").trim().isLength({ min: 1, max: 50 }),
    body("lastName").trim().isLength({ min: 1, max: 50 }),
    body("role").optional().isIn(["BUYER", "SELLER", "AGENT"]),
  ]),
  async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, role, diasporaCountry, phone } = req.body;

      const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      if (existing) throw new AppError("Email already registered", 409, "EMAIL_EXISTS");

      const passwordHash = await bcrypt.hash(password, 12);
      const [user] = await db.insert(users).values({
        email: email.toLowerCase(), passwordHash, phone: phone || null,
        role: role || "BUYER", diasporaCountry: diasporaCountry || null,
      }).returning();

      const [profile] = await db.insert(userProfiles).values({
        userId: user.id, firstName, lastName,
      }).returning();

      logger.info({ userId: user.id }, "New user registered");
      // In production send a verification email; for now auto-mark verified in dev
      if (process.env.NODE_ENV !== "production") {
        await db.update(users).set({ isEmailVerified: true }).where(eq(users.id, user.id));
      }

      res.status(201).json({
        success: true,
        message: "Account created successfully.",
        data: { id: user.id, email: user.email, role: user.role, profile },
      });
    } catch (err) { next(err); }
  },
);

// ── POST /auth/login ──────────────────────────────────────────────────────────
router.post(
  "/login",
  authLimiter,
  validate([
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ]),
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);

      if (!user) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");
      if (!user.isActive) throw new AppError("Account is deactivated", 401, "ACCOUNT_INACTIVE");
      if (user.isSuspended) throw new AppError("Account is suspended. Contact support.", 403, "ACCOUNT_SUSPENDED");

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) throw new AppError("Invalid credentials", 401, "INVALID_CREDENTIALS");

      const { accessToken, refreshToken } = generateTokens(user.id, user.role);
      await db.insert(sessions).values({
        userId: user.id, refreshToken,
        userAgent: req.headers["user-agent"] || null,
        ipAddress: req.ip || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      });

      const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, user.id)).limit(1);
      const { passwordHash: _pw, ...safeUser } = user;

      logger.info({ userId: user.id }, "User logged in");
      res.json({ success: true, data: { accessToken, refreshToken, user: { ...safeUser, profile } } });
    } catch (err) { next(err); }
  },
);

// ── POST /auth/refresh ────────────────────────────────────────────────────────
router.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) throw new AppError("Refresh token required", 400, "TOKEN_REQUIRED");

    const payload = verifyRefreshToken(token);

    const [session] = await db.select().from(sessions)
      .where(and(eq(sessions.refreshToken, token), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())))
      .limit(1);
    if (!session) throw new AppError("Invalid or expired refresh token", 401, "TOKEN_INVALID");

    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user || !user.isActive) throw new AppError("User not found or inactive", 401, "USER_INACTIVE");

    // Rotate refresh token
    const tokens = generateTokens(user.id, user.role);
    await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.id, session.id));
    await db.insert(sessions).values({
      userId: user.id, refreshToken: tokens.refreshToken,
      userAgent: req.headers["user-agent"] || null, ipAddress: req.ip || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    res.json({ success: true, data: tokens });
  } catch (err) { next(err); }
});

// ── POST /auth/logout ─────────────────────────────────────────────────────────
router.post("/logout", authenticate, async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (token) {
      await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.refreshToken, token));
    }
    res.json({ success: true, message: "Logged out successfully" });
  } catch (err) { next(err); }
});

// ── GET /auth/me ──────────────────────────────────────────────────────────────
router.get("/me", authenticate, async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) throw new AppError("User not found", 404, "NOT_FOUND");
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
    const { passwordHash: _pw, ...safeUser } = user;
    res.json({ success: true, data: { ...safeUser, profile: profile || null } });
  } catch (err) { next(err); }
});

// ── GET /auth/google — redirect to Google OAuth ───────────────────────────────
router.get("/google", (req, res) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return res.status(501).json({
      success: false,
      error: "Google OAuth is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.",
      code: "OAUTH_NOT_CONFIGURED",
    });
  }
  const baseUrl = process.env.PUBLIC_URL || `https://${req.headers.host}`;
  const redirectUri = `${baseUrl}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

// ── GET /auth/google/callback ─────────────────────────────────────────────────
router.get("/google/callback", async (req, res, next) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return res.redirect("/auth/login?error=oauth_not_configured");
    }
    const { code } = req.query;
    if (!code) return res.redirect("/auth/login?error=oauth_cancelled");

    const baseUrl = process.env.PUBLIC_URL || `https://${req.headers.host}`;
    const redirectUri = `${baseUrl}/api/auth/google/callback`;

    // Exchange code for tokens
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenRes.json() as any;
    if (tokenData.error) {
      logger.error({ error: tokenData.error }, "Google OAuth token exchange failed");
      return res.redirect("/auth/login?error=oauth_failed");
    }

    // Get user info from Google
    const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser = await userInfoRes.json() as any;

    // Find or create user
    let [user] = await db.select().from(users).where(eq(users.email, googleUser.email.toLowerCase())).limit(1);
    if (!user) {
      [user] = await db.insert(users).values({
        email: googleUser.email.toLowerCase(),
        passwordHash: `GOOGLE_OAUTH_${googleUser.sub}`,
        role: "BUYER", isEmailVerified: true, isActive: true,
      }).returning();
      await db.insert(userProfiles).values({
        userId: user.id,
        firstName: googleUser.given_name || "",
        lastName: googleUser.family_name || "",
        avatarUrl: googleUser.picture || null,
      });
      logger.info({ userId: user.id }, "New user via Google OAuth");
    }

    const { accessToken, refreshToken } = generateTokens(user.id, user.role);
    await db.insert(sessions).values({
      userId: user.id, refreshToken,
      userAgent: req.headers["user-agent"] || null,
      ipAddress: req.ip || null,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    // Redirect to frontend callback page with tokens
    const frontendBase = baseUrl.replace(/\/api$/, "");
    res.redirect(`${frontendBase}/auth/callback?access=${encodeURIComponent(accessToken)}&refresh=${encodeURIComponent(refreshToken)}`);
  } catch (err) { next(err); }
});

// ── POST /auth/forgot-password ────────────────────────────────────────────────
router.post("/forgot-password", authLimiter,
  validate([body("email").isEmail().normalizeEmail()]),
  async (req, res, next) => {
    try {
      // Stub: in production send an email; just acknowledge here
      logger.info({ email: req.body.email }, "Password reset requested (email stub)");
      res.json({ success: true, message: "If that email exists, a reset link has been sent." });
    } catch (err) { next(err); }
  },
);

// ── POST /auth/reset-password ─────────────────────────────────────────────────
router.post("/reset-password", authLimiter,
  validate([body("password").isLength({ min: 8 }), body("token").notEmpty()]),
  async (req, res, next) => {
    try {
      // Stub: requires email/token flow — not wired in this version
      res.status(400).json({ success: false, error: "Reset via email not yet configured. Contact support." });
    } catch (err) { next(err); }
  },
);

export default router;
