import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { prisma } from "@kunda/database";
import { AppError } from "../utils/errors";

const router = Router();
router.get("/", authenticate, async (req, res, next) => {
  try {
    const profile = await prisma.userProfile.findUnique({ where: { userId: (req as any).user.id } });
    if (!profile) throw new AppError("Profile not found", 404, "NOT_FOUND");
    res.json({ success: true, data: profile });
  } catch (e) { next(e); }
});

router.patch("/", authenticate, async (req, res, next) => {
  try {
    const { firstName, lastName, bio, city, country, languages, avatarUrl } = req.body;
    const profile = await prisma.userProfile.update({ where: { userId: (req as any).user.id },
      data: { firstName, lastName, bio, city, country, languages, avatarUrl } });
    res.json({ success: true, data: profile });
  } catch (e) { next(e); }
});

router.patch("/preferences", authenticate, async (req, res, next) => {
  try {
    const { preferredCurrency, diasporaCountry } = req.body;
    const user = await prisma.user.update({ where: { id: (req as any).user.id },
      data: { preferredCurrency, diasporaCountry },
      select: { id: true, preferredCurrency: true, diasporaCountry: true } });
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

export default router;
