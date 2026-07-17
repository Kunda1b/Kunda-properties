import { Router } from "express";
import { db } from "@workspace/db";
import { users, userProfiles } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authenticate } from "../middleware/authenticate.js";
import { AppError } from "../lib/errors.js";

const router = Router();
router.use(authenticate);

// ── GET /profile ──────────────────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const [profile] = await db.select().from(userProfiles)
      .where(eq(userProfiles.userId, (req as any).user.id)).limit(1);
    if (!profile) throw new AppError("Profile not found", 404, "NOT_FOUND");
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

// ── PATCH /profile ────────────────────────────────────────────────────────────
router.patch("/", async (req, res, next) => {
  try {
    const { firstName, lastName, bio, city, country, languages, avatarUrl } = req.body;
    const [profile] = await db.update(userProfiles)
      .set({ firstName, lastName, bio, city, country, languages: languages || undefined, avatarUrl, updatedAt: new Date() })
      .where(eq(userProfiles.userId, (req as any).user.id))
      .returning();
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
});

// ── PATCH /profile/preferences ────────────────────────────────────────────────
router.patch("/preferences", async (req, res, next) => {
  try {
    const { preferredCurrency, diasporaCountry } = req.body;
    const [user] = await db.update(users)
      .set({ preferredCurrency, diasporaCountry, updatedAt: new Date() })
      .where(eq(users.id, (req as any).user.id))
      .returning();
    res.json({ success: true, data: { preferredCurrency: user.preferredCurrency, diasporaCountry: user.diasporaCountry } });
  } catch (err) { next(err); }
});

export default router;
