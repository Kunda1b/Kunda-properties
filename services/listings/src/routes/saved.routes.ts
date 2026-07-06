import { Router } from "express";
import { authenticate } from "../middleware/authenticate";
import { prisma } from "@kunda/database";
const router = Router();
router.use(authenticate);

router.get("/", async (req, res, next) => {
  try {
    const saved = await prisma.savedListing.findMany({
      where: { userId: (req as any).user.id },
      include: { listing: { include: { images: { where: { isPrimary: true }, take: 1 } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, data: saved });
  } catch (e) { return next(e); }
});

router.post("/:listingId", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { listingId } = req.params;
    const saved = await prisma.savedListing.upsert({
      where: { userId_listingId: { userId, listingId } }, update: {}, create: { userId, listingId },
    });
    await prisma.listing.update({ where: { id: listingId }, data: { savedCount: { increment: 1 } } }).catch(() => {});
    res.status(201).json({ success: true, data: saved });
  } catch (e) { return next(e); }
});

router.delete("/:listingId", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { listingId } = req.params;
    await prisma.savedListing.delete({ where: { userId_listingId: { userId, listingId } } });
    await prisma.listing.update({ where: { id: listingId }, data: { savedCount: { decrement: 1 } } }).catch(() => {});
    res.json({ success: true });
  } catch (e) { return next(e); }
});

export default router;
