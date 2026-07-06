import { Router } from "express";
import Stripe from "stripe";
import { authenticate, requireRole } from "../middleware/authenticate";
import { prisma } from "@kunda/database";
import { logger } from "../utils/logger";

const router = Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", { apiVersion: "2024-04-10" });
router.use(authenticate, requireRole("ADMIN"));

router.get("/escrow", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = {};
    if (status) where.status = status;
    if (search) where.referenceNumber = { contains: String(search), mode: "insensitive" };
    const [escrows, total] = await Promise.all([
      prisma.escrowAccount.findMany({ where, skip, take: Number(limit),
        include: {
          listing: { select: { title: true, region: true } },
          buyer: { include: { profile: { select: { firstName: true, lastName: true } } } },
          seller: { include: { profile: { select: { firstName: true, lastName: true } } } },
        }, orderBy: { createdAt: "desc" } }),
      prisma.escrowAccount.count({ where }),
    ]);
    res.json({ success: true, data: { escrows, total } });
  } catch (e) { return next(e); }
});

router.get("/escrow/:id", async (req, res, next) => {
  try {
    const escrow = await prisma.escrowAccount.findUnique({
      where: { id: req.params.id },
      include: { listing: { include: { images: { take: 1 } } }, buyer: { include: { profile: true } },
        seller: { include: { profile: true } }, milestones: { orderBy: { order: "asc" } }, transactions: { orderBy: { createdAt: "desc" } } },
    });
    if (!escrow) return res.status(404).json({ success: false, error: "Escrow not found" });
    return res.json({ success: true, data: escrow });
  } catch (e) { return next(e); }
});

router.patch("/escrow/:id/force-release", async (req, res, next) => {
  try {
    const { notes } = req.body;
    if (!notes) return res.status(400).json({ success: false, error: "Admin notes required" });
    const escrow = await prisma.escrowAccount.findUnique({ where: { id: req.params.id }, include: { seller: true } });
    if (!escrow) return res.status(404).json({ success: false, error: "Not found" });

    let transferId: string | undefined;
    if (escrow.seller.stripeAccountId && escrow.sellerPayoutAmount) {
      try {
        const t = await stripe.transfers.create({
          amount: Math.round(Number(escrow.sellerPayoutAmount) * 100),
          currency: escrow.currency === "GMD" ? "usd" : escrow.currency.toLowerCase(),
          destination: escrow.seller.stripeAccountId,
        });
        transferId = t.id;
      } catch (err) { logger.warn({ err }, "Stripe transfer failed in force-release"); }
    }

    await prisma.$transaction([
      prisma.escrowAccount.update({ where: { id: req.params.id }, data: { status: "RELEASED", releasedAt: new Date(), adminNotes: notes, stripeTransferId: transferId } }),
      prisma.listing.update({ where: { id: escrow.listingId }, data: { status: "SOLD" } }),
      prisma.transaction.create({ data: { escrowId: req.params.id, type: "RELEASE", status: "COMPLETED", amount: escrow.sellerPayoutAmount || escrow.totalAmount, currency: escrow.currency, processedAt: new Date() } }),
    ]);
    await prisma.auditLog.create({ data: { userId: (req as any).user.id, action: "APPROVE", resource: "escrow", resourceId: req.params.id, newValues: { notes, action: "force_release" } } });
    return res.json({ success: true, message: "Funds released to seller" });
  } catch (e) { return next(e); }
});

router.patch("/escrow/:id/force-refund", async (req, res, next) => {
  try {
    const { notes } = req.body;
    if (!notes) return res.status(400).json({ success: false, error: "Admin notes required" });
    const escrow = await prisma.escrowAccount.findUnique({ where: { id: req.params.id } });
    if (!escrow) return res.status(404).json({ success: false, error: "Not found" });

    if (escrow.stripePaymentIntentId) {
      await stripe.refunds.create({ payment_intent: escrow.stripePaymentIntentId }).catch((e) => logger.warn({ e }, "Stripe refund failed"));
    }
    await prisma.$transaction([
      prisma.escrowAccount.update({ where: { id: req.params.id }, data: { status: "REFUNDED", refundedAt: new Date(), adminNotes: notes } }),
      prisma.transaction.create({ data: { escrowId: req.params.id, type: "REFUND", status: "COMPLETED", amount: escrow.totalAmount, currency: escrow.currency, processedAt: new Date() } }),
    ]);
    await prisma.auditLog.create({ data: { userId: (req as any).user.id, action: "REJECT", resource: "escrow", resourceId: req.params.id, newValues: { notes, action: "force_refund" } } });
    return res.json({ success: true, message: "Funds refunded to buyer" });
  } catch (e) { return next(e); }
});

export default router;
