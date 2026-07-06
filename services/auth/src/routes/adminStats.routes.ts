import { Router } from "express";
import { authenticate, requireRole } from "../middleware/authenticate";
import { prisma } from "@kunda/database";

const router = Router();
router.use(authenticate, requireRole("ADMIN"));

// ─────────────────────────────────────────────────────────────
// Platform-wide dashboard stats
// ─────────────────────────────────────────────────────────────
router.get("/stats", async (req, res, next) => {
  try {
    const [
      totalUsers, kycVerified, kycPending, kycRejected, pendingKyc,
      activeListings, pendingListings, pendingDocuments,
      totalEscrows, releasedEscrows, disputedEscrows,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.kycRecord.count({ where: { status: "VERIFIED" } }),
      prisma.kycRecord.count({ where: { status: "PENDING" } }),
      prisma.kycRecord.count({ where: { status: "REJECTED" } }),
      prisma.kycRecord.count({ where: { status: "SUBMITTED" } }),
      prisma.listing.count({ where: { status: "ACTIVE" } }),
      prisma.listing.count({ where: { status: "PENDING_REVIEW" } }),
      prisma.document.count({ where: { status: "UPLOADED" } }),
      prisma.escrowAccount.count(),
      prisma.escrowAccount.count({ where: { status: "RELEASED" } }),
      prisma.escrowAccount.count({ where: { status: "DISPUTED" } }),
    ]);

    const revenueAgg = await prisma.escrowAccount.aggregate({
      where: { status: "RELEASED" },
      _sum: { platformFeeAmount: true, totalAmount: true },
    });

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const [thisM, lastM] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: thisMonthStart } } }),
      prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } } }),
    ]);
    const userGrowthPct = lastM > 0 ? Math.round(((thisM - lastM) / lastM) * 100) : 0;

    const topRegions = await prisma.listing.groupBy({
      by: ["region"], where: { status: "ACTIVE" },
      _count: true, orderBy: { _count: { region: "desc" } }, take: 7,
    });
    const maxCount = topRegions[0]?._count || 1;

    const [recentListings, recentKyc] = await Promise.all([
      prisma.listing.findMany({
        take: 4, orderBy: { updatedAt: "desc" },
        include: { seller: { include: { profile: { select: { firstName: true, lastName: true } } } } },
      }),
      prisma.kycRecord.findMany({
        take: 4, orderBy: { updatedAt: "desc" },
        include: { user: { include: { profile: { select: { firstName: true, lastName: true } } } } },
      }),
    ]);

    const recentActivity = [
      ...recentListings.map((l: any) => ({
        id: l.id, type: "listing", createdAt: l.updatedAt, status: l.status, title: l.title,
        meta: `${l.seller?.profile?.firstName || ""} ${l.seller?.profile?.lastName || ""}`.trim(),
      })),
      ...recentKyc.map((k: any) => ({
        id: k.id, type: "kyc", createdAt: k.updatedAt, status: k.status,
        title: `${k.user?.profile?.firstName || ""} ${k.user?.profile?.lastName || ""} KYC ${k.status.toLowerCase()}`,
        meta: k.idType?.replace(/_/g, " ") || "—",
      })),
    ].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8);

    res.json({
      success: true,
      data: {
        totalUsers, kycVerified, kycPending, kycRejected, pendingKyc,
        activeListings, pendingListings, pendingDocuments,
        totalEscrows, releasedEscrows, disputedEscrows,
        escrowVolumeUsd: Number(revenueAgg._sum.totalAmount || 0),
        platformRevenueUsd: Number(revenueAgg._sum.platformFeeAmount || 0),
        userGrowthPct,
        topRegions: topRegions.map((r: any) => ({
          region: r.region, count: r._count, pct: Math.round((r._count / maxCount) * 100),
        })),
        recentActivity,
      },
    });
  } catch (e) { return next(e); }
});

// ─────────────────────────────────────────────────────────────
// Users
// ─────────────────────────────────────────────────────────────
router.get("/users", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, role, kycStatus, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (role) where.role = role;
    if (kycStatus) where.kyc = { status: kycStatus };
    if (search) {
      where.OR = [
        { email: { contains: String(search), mode: "insensitive" } },
        { profile: { firstName: { contains: String(search), mode: "insensitive" } } },
        { profile: { lastName: { contains: String(search), mode: "insensitive" } } },
      ];
    }
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: Number(limit),
        include: { profile: true, kyc: { select: { status: true, verifiedAt: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ]);
    res.json({ success: true, data: { users: users.map(({ passwordHash, ...u }: any) => u), total, page: Number(page) } });
  } catch (e) { return next(e); }
});

router.get("/users/:id", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id }, include: { profile: true, kyc: true },
    });
    if (!user) return res.status(404).json({ success: false, error: "User not found" });
    const { passwordHash, ...safe } = user as any;
    return res.json({ success: true, data: safe });
  } catch (e) { return next(e); }
});

router.patch("/users/:id/suspend", async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isSuspended: true } });
    await prisma.auditLog.create({ data: { userId: (req as any).user.id, action: "SUSPEND", resource: "user", resourceId: req.params.id } });
    res.json({ success: true });
  } catch (e) { return next(e); }
});

router.patch("/users/:id/activate", async (req, res, next) => {
  try {
    await prisma.user.update({ where: { id: req.params.id }, data: { isSuspended: false, isActive: true } });
    await prisma.auditLog.create({ data: { userId: (req as any).user.id, action: "ACTIVATE", resource: "user", resourceId: req.params.id } });
    res.json({ success: true });
  } catch (e) { return next(e); }
});

router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const { role } = req.body;
    await prisma.user.update({ where: { id: req.params.id }, data: { role } });
    await prisma.auditLog.create({ data: { userId: (req as any).user.id, action: "UPDATE", resource: "user", resourceId: req.params.id, newValues: { role } } });
    res.json({ success: true });
  } catch (e) { return next(e); }
});

// ─────────────────────────────────────────────────────────────
// KYC
// ─────────────────────────────────────────────────────────────
router.get("/kyc/pending", async (req, res, next) => {
  try {
    const { status = "SUBMITTED", limit = 50, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const records = await prisma.kycRecord.findMany({
      where: { status: status as any }, skip, take: Number(limit),
      include: { user: { include: { profile: true } } },
      orderBy: { updatedAt: "asc" },
    });
    res.json({ success: true, data: { records } });
  } catch (e) { return next(e); }
});

router.patch("/kyc/:id/manual-verify", async (req, res, next) => {
  try {
    const kyc = await prisma.kycRecord.update({ where: { id: req.params.id }, data: { status: "VERIFIED", verifiedAt: new Date() } });
    await prisma.auditLog.create({ data: { userId: (req as any).user.id, action: "APPROVE", resource: "kyc", resourceId: req.params.id } });
    res.json({ success: true, data: kyc });
  } catch (e) { return next(e); }
});

router.patch("/kyc/:id/reject", async (req, res, next) => {
  try {
    const { reason } = req.body;
    const kyc = await prisma.kycRecord.update({ where: { id: req.params.id }, data: { status: "REJECTED", rejectionReason: reason } });
    await prisma.auditLog.create({ data: { userId: (req as any).user.id, action: "REJECT", resource: "kyc", resourceId: req.params.id, newValues: { reason } } });
    res.json({ success: true, data: kyc });
  } catch (e) { return next(e); }
});

// ─────────────────────────────────────────────────────────────
// Audit logs
// ─────────────────────────────────────────────────────────────
router.get("/audit-logs", async (req, res, next) => {
  try {
    const { page = 1, limit = 30, resource, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (resource) where.resource = resource;
    if (search) where.action = { contains: String(search), mode: "insensitive" };
    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: "desc" } }),
      prisma.auditLog.count({ where }),
    ]);
    res.json({ success: true, data: { logs, total } });
  } catch (e) { return next(e); }
});

// ─────────────────────────────────────────────────────────────
// Exchange rates
// ─────────────────────────────────────────────────────────────
router.get("/exchange-rates", async (req, res, next) => {
  try {
    res.json({ success: true, data: await prisma.exchangeRate.findMany() });
  } catch (e) { return next(e); }
});

router.put("/exchange-rates", async (req, res, next) => {
  try {
    const { from: fromCurrency, to: toCurrency, rate } = req.body;
    if (!fromCurrency || !toCurrency || !rate) return res.status(400).json({ success: false, error: "from, to, rate required" });
    const updated = await prisma.exchangeRate.upsert({
      where: { fromCurrency_toCurrency: { fromCurrency, toCurrency } },
      update: { rate }, create: { fromCurrency, toCurrency, rate },
    });
    await prisma.auditLog.create({ data: { userId: (req as any).user.id, action: "UPDATE", resource: "exchange_rate", newValues: { fromCurrency, toCurrency, rate } } });
    return res.json({ success: true, data: updated });
  } catch (e) { return next(e); }
});

export default router;
