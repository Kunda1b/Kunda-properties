import { Router } from "express";
import { body } from "express-validator";
import { db } from "@workspace/db";
import { users, userProfiles } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../lib/errors.js";
import { sanitizeText, sanitizeMultiline, sanitizeUrl } from "../lib/sanitize.js";

const router = Router();
router.use(authenticate);

// ── GET /profile ──────────────────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const [profile] = await db.select().from(userProfiles)
      .where(eq(userProfiles.userId, req.user!.id)).limit(1);
    if (!profile) throw new AppError("Profile not found", 404, "NOT_FOUND");
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

// ── PATCH /profile ────────────────────────────────────────────────────────────
router.patch(
  "/",
  validate([
    body("firstName").optional().isString().isLength({ max: 50 }),
    body("lastName").optional().isString().isLength({ max: 50 }),
    body("bio").optional().isString().isLength({ max: 2000 }),
    body("city").optional().isString().isLength({ max: 100 }),
    body("country").optional().isString().isLength({ max: 100 }),
    body("avatarUrl").optional({ values: "null" }).isString().isLength({ max: 2048 }),
    body("languages").optional().isArray({ max: 20 }),
  ]),
  async (req, res, next) => {
    try {
      const firstName = req.body.firstName != null ? sanitizeText(req.body.firstName, 50) : undefined;
      const lastName = req.body.lastName != null ? sanitizeText(req.body.lastName, 50) : undefined;
      const bio = req.body.bio != null ? sanitizeMultiline(req.body.bio, 2000) : undefined;
      const city = req.body.city != null ? sanitizeText(req.body.city, 100) : undefined;
      const country = req.body.country != null ? sanitizeText(req.body.country, 100) : undefined;
      const avatarUrl = req.body.avatarUrl !== undefined
        ? (req.body.avatarUrl ? sanitizeUrl(req.body.avatarUrl) : null)
        : undefined;
      const languages = Array.isArray(req.body.languages)
        ? req.body.languages.map((l: unknown) => sanitizeText(l, 40)).filter(Boolean)
        : undefined;

      const [profile] = await db.update(userProfiles)
        .set({
          ...(firstName !== undefined && { firstName }),
          ...(lastName !== undefined && { lastName }),
          ...(bio !== undefined && { bio }),
          ...(city !== undefined && { city }),
          ...(country !== undefined && { country }),
          ...(languages !== undefined && { languages }),
          ...(avatarUrl !== undefined && { avatarUrl }),
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, req.user!.id))
        .returning();
      res.json({ success: true, data: profile });
    } catch (err) { next(err); }
  },
);

// ── PATCH /profile/preferences ────────────────────────────────────────────────
router.patch(
  "/preferences",
  validate([
    body("preferredCurrency").optional().isIn(["GMD", "USD", "GBP", "EUR"]),
    body("diasporaCountry").optional().isString().isLength({ max: 100 }),
  ]),
  async (req, res, next) => {
    try {
      const preferredCurrency = req.body.preferredCurrency;
      const diasporaCountry = req.body.diasporaCountry != null
        ? sanitizeText(req.body.diasporaCountry, 100)
        : undefined;

      const [user] = await db.update(users)
        .set({
          ...(preferredCurrency !== undefined && { preferredCurrency }),
          ...(diasporaCountry !== undefined && { diasporaCountry }),
          updatedAt: new Date(),
        })
        .where(eq(users.id, req.user!.id))
        .returning();
      res.json({
        success: true,
        data: {
          preferredCurrency: user.preferredCurrency,
          diasporaCountry: user.diasporaCountry,
        },
      });
    } catch (err) { next(err); }
  },
);

export default router;
