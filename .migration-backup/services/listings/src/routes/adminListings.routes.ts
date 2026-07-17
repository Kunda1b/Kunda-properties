import { Router } from "express";
import { authenticate, requireRole } from "../middleware/authenticate";
import { prisma } from "@kunda/database";
const router = Router();
router.use(authenticate, requireRole("ADMIN"));

router.get("/listings", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (search) where.OR = [
      { title: { contains: String(search), mode: "insensitive" } },
      { region: { contains: String(search), mode: "insensitive" } },
    ];
    const [listings, total] = await Promise.all([
      prisma.listing.findMany({ where, skip, take: Number(limit),
        include: { images: { take: 1 }, seller: { include: { profile: true } } },
        orderBy: { updatedAt: "desc" } }),
      prisma.listing.count({ where }),
    ]);
    res.json({ success: true, data: { listings, total } });
  } catch (e) { return next(e); }
});

router.get("/listings/pending", async (req, res, next) => {
  try {
    const listings = await prisma.listing.findMany({
      where: { status: "PENDING_REVIEW" },
      include: { seller: { include: { profile: true } }, images: { take: 3 } },
      orderBy: { updatedAt: "asc" },
    });
    res.json({ success: true, data: { listings, total: listings.length } });
  } catch (e) { return next(e); }
});

router.patch("/listings/:id/approve", async (req, res, next) => {
  try {
    const listing = await prisma.listing.update({ where: { id: req.params.id }, data: { status: "ACTIVE", publishedAt: new Date() } });
    await prisma.auditLog.create({ data: { userId: (req as any).user.id, action: "APPROVE", resource: "listing", resourceId: req.params.id } });
    res.json({ success: true, data: listing });
  } catch (e) { return next(e); }
});

router.patch("/listings/:id/reject", async (req, res, next) => {
  try {
    const listing = await prisma.listing.update({ where: { id: req.params.id }, data: { status: "DRAFT" } });
    await prisma.auditLog.create({ data: { userId: (req as any).user.id, action: "REJECT", resource: "listing", resourceId: req.params.id } });
    res.json({ success: true, data: listing });
  } catch (e) { return next(e); }
});

router.patch("/listings/:id/suspend", async (req, res, next) => {
  try {
    const listing = await prisma.listing.update({ where: { id: req.params.id }, data: { status: "SUSPENDED" } });
    await prisma.auditLog.create({ data: { userId: (req as any).user.id, action: "SUSPEND", resource: "listing", resourceId: req.params.id } });
    res.json({ success: true, data: listing });
  } catch (e) { return next(e); }
});

router.patch("/listings/:id/feature", async (req, res, next) => {
  try {
    const listing = await prisma.listing.update({ where: { id: req.params.id }, data: { viewCount: { increment: 1000 } } });
    res.json({ success: true, data: listing });
  } catch (e) { return next(e); }
});

export default router;
