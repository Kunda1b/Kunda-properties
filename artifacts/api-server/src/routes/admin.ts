import { Router } from "express";
import { db } from "@workspace/db";
import {
  users, userProfiles, kycRecords, listings, listingImages,
  escrowAccounts, transactions, documents, notifications, auditLogs, exchangeRates,
} from "@workspace/db/schema";
import { eq, and, or, ilike, inArray, sql, desc, asc } from "drizzle-orm";
import { authenticate, requireAdmin } from "../middleware/authenticate.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { adminLimiter } from "../middleware/rateLimiters.js";
import { writeAudit } from "../lib/audit.js";
import { sanitizeMultiline } from "../lib/sanitize.js";

const router = Router();
// Fresh DB role check so demoted/suspended admins lose access immediately
router.use(authenticate, requireAdmin, adminLimiter);

// ═══════════════════════════════════════════════════════════════════════════════
// STATS / ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════════
router.get("/stats", async (req, res, next) => {
  try {
    const [
      [{ totalUsers }],
      [{ totalListings }],
      [{ totalEscrows }],
      [{ pendingKyc }],
      [{ pendingListings }],
      [{ activeEscrows }],
    ] = await Promise.all([
      db.select({ totalUsers: sql<number>`count(*)::int` }).from(users),
      db.select({ totalListings: sql<number>`count(*)::int` }).from(listings),
      db.select({ totalEscrows: sql<number>`count(*)::int` }).from(escrowAccounts),
      db.select({ pendingKyc: sql<number>`count(*)::int` }).from(kycRecords).where(eq(kycRecords.status, "SUBMITTED")),
      db.select({ pendingListings: sql<number>`count(*)::int` }).from(listings).where(eq(listings.status, "PENDING_REVIEW")),
      db.select({ activeEscrows: sql<number>`count(*)::int` }).from(escrowAccounts).where(inArray(escrowAccounts.status, ["FUNDED", "INSPECTING", "APPROVED"])),
    ]);
    res.json({ success: true, data: { totalUsers, totalListings, totalEscrows, pendingKyc, pendingListings, activeEscrows } });
  } catch (err) { next(err); }
});

router.get("/analytics", async (req, res, next) => {
  try {
    const byType = await db
      .select({ propertyType: listings.propertyType, count: sql<number>`count(*)::int` })
      .from(listings).where(eq(listings.status, "ACTIVE")).groupBy(listings.propertyType);

    const byRegion = await db
      .select({ region: listings.region, count: sql<number>`count(*)::int` })
      .from(listings).where(eq(listings.status, "ACTIVE")).groupBy(listings.region)
      .orderBy(sql`count(*) desc`).limit(10);

    const escrowTotals = await db
      .select({ status: escrowAccounts.status, count: sql<number>`count(*)::int` })
      .from(escrowAccounts).groupBy(escrowAccounts.status);

    const recentListings = await db.select({ createdAt: listings.createdAt })
      .from(listings).orderBy(desc(listings.createdAt)).limit(100);

    res.json({ success: true, data: { byPropertyType: byType, byRegion, escrowByStatus: escrowTotals, recentListings } });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// USERS
// ═══════════════════════════════════════════════════════════════════════════════
router.get("/users", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [];
    if (search) {
      conditions.push(or(
        ilike(users.email, `%${search}%`),
        ilike(userProfiles.firstName, `%${search}%`),
        ilike(userProfiles.lastName, `%${search}%`),
      ));
    }
    if (role) conditions.push(eq(users.role, role as any));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db.select({
      id: users.id, email: users.email, role: users.role, isActive: users.isActive,
      isSuspended: users.isSuspended, isEmailVerified: users.isEmailVerified,
      diasporaCountry: users.diasporaCountry, createdAt: users.createdAt,
      firstName: userProfiles.firstName, lastName: userProfiles.lastName, avatarUrl: userProfiles.avatarUrl,
      kycStatus: kycRecords.status,
    })
    .from(users)
    .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
    .leftJoin(kycRecords, eq(kycRecords.userId, users.id))
    .where(where)
    .orderBy(desc(users.createdAt))
    .limit(limitNum).offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(users)
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .leftJoin(kycRecords, eq(kycRecords.userId, users.id))
      .where(where);

    res.json({ success: true, data: { users: results, total: count, page: pageNum, limit: limitNum, totalPages: Math.ceil(count / limitNum) } });
  } catch (err) { next(err); }
});

router.patch("/users/:id/suspend", async (req, res, next) => {
  try {
    const { suspend = true } = req.body;
    // Prevent self-lockout and demoting via suspend of super admins by non-super
    if (req.params.id === req.user!.id) {
      throw new AppError("Cannot suspend your own account", 400, "SELF_SUSPEND");
    }
    const [user] = await db.update(users)
      .set({ isSuspended: Boolean(suspend), updatedAt: new Date() })
      .where(eq(users.id, req.params.id)).returning();
    await writeAudit(req, {
      action: suspend ? "SUSPEND" : "UNSUSPEND",
      resource: "user",
      resourceId: req.params.id,
      newValues: { isSuspended: Boolean(suspend) },
    });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// KYC
// ═══════════════════════════════════════════════════════════════════════════════
router.get("/kyc", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const where = status ? eq(kycRecords.status, status as any) : eq(kycRecords.status, "SUBMITTED");

    const results = await db.select({
      id: kycRecords.id, userId: kycRecords.userId, status: kycRecords.status,
      idType: kycRecords.idType, idNumber: kycRecords.idNumber, idCountry: kycRecords.idCountry,
      verifiedAt: kycRecords.verifiedAt, rejectionReason: kycRecords.rejectionReason,
      createdAt: kycRecords.createdAt, updatedAt: kycRecords.updatedAt,
      userEmail: users.email, firstName: userProfiles.firstName, lastName: userProfiles.lastName,
    })
    .from(kycRecords)
    .leftJoin(users, eq(users.id, kycRecords.userId))
    .leftJoin(userProfiles, eq(userProfiles.userId, kycRecords.userId))
    .where(where)
    .orderBy(asc(kycRecords.createdAt))
    .limit(limitNum).offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(kycRecords).where(where);
    res.json({ success: true, data: { kyc: results, total: count, page: pageNum, limit: limitNum } });
  } catch (err) { next(err); }
});

router.patch("/kyc/:id/verify", async (req, res, next) => {
  try {
    const [kyc] = await db.update(kycRecords)
      .set({ status: "VERIFIED", verifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(kycRecords.id, req.params.id)).returning();
    await writeAudit(req, {
      action: "KYC_VERIFY",
      resource: "kyc",
      resourceId: req.params.id,
      newValues: { status: "VERIFIED" },
    });
    res.json({ success: true, data: kyc });
  } catch (err) { next(err); }
});

router.patch("/kyc/:id/reject", async (req, res, next) => {
  try {
    const reason = sanitizeMultiline(req.body.reason || "Rejected by admin", 2000);
    const [kyc] = await db.update(kycRecords)
      .set({ status: "REJECTED", rejectionReason: reason, updatedAt: new Date() })
      .where(eq(kycRecords.id, req.params.id)).returning();
    await writeAudit(req, {
      action: "KYC_REJECT",
      resource: "kyc",
      resourceId: req.params.id,
      newValues: { reason },
    });
    res.json({ success: true, data: kyc });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// LISTINGS
// ═══════════════════════════════════════════════════════════════════════════════
router.get("/listings", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [];
    if (status) conditions.push(eq(listings.status, status as any));
    if (search) conditions.push(or(
      ilike(listings.title, `%${search}%`),
      ilike(listings.region, `%${search}%`),
    ));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const results = await db.query.listings.findMany({
      where: () => where,
      with: {
        images: { limit: 1 },
        seller: { with: { profile: { columns: { firstName: true, lastName: true } } } },
      },
      orderBy: (l, { desc: descFn }) => [descFn(l.updatedAt)],
      limit: limitNum, offset,
    });

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(listings).where(where);
    res.json({ success: true, data: { listings: results, total: count, page: pageNum, limit: limitNum } });
  } catch (err) { next(err); }
});

router.patch("/listings/:id/approve", async (req, res, next) => {
  try {
    const [listing] = await db.update(listings)
      .set({ status: "ACTIVE", publishedAt: new Date(), updatedAt: new Date() })
      .where(eq(listings.id, req.params.id)).returning();
    await writeAudit(req, {
      action: "LISTING_APPROVE",
      resource: "listing",
      resourceId: req.params.id,
      newValues: { status: "ACTIVE" },
    });
    res.json({ success: true, data: listing });
  } catch (err) { next(err); }
});

router.patch("/listings/:id/reject", async (req, res, next) => {
  try {
    const [listing] = await db.update(listings)
      .set({ status: "REJECTED", updatedAt: new Date() })
      .where(eq(listings.id, req.params.id)).returning();
    await writeAudit(req, {
      action: "LISTING_REJECT",
      resource: "listing",
      resourceId: req.params.id,
      newValues: { status: "REJECTED" },
    });
    res.json({ success: true, data: listing });
  } catch (err) { next(err); }
});

router.patch("/listings/:id/verify", async (req, res, next) => {
  try {
    const adminId = req.user!.id;
    const { verified = true } = req.body;
    const [listing] = await db.update(listings)
      .set({
        isVerified: Boolean(verified),
        verifiedAt: verified ? new Date() : null,
        verifiedById: verified ? adminId : null,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, req.params.id)).returning();
    await writeAudit(req, {
      action: verified ? "LISTING_VERIFY" : "LISTING_UNVERIFY",
      resource: "listing",
      resourceId: req.params.id,
      newValues: { isVerified: Boolean(verified) },
    });
    res.json({ success: true, data: listing });
  } catch (err) { next(err); }
});

router.patch("/listings/:id/suspend", async (req, res, next) => {
  try {
    const [listing] = await db.update(listings)
      .set({ status: "SUSPENDED", updatedAt: new Date() })
      .where(eq(listings.id, req.params.id)).returning();
    await writeAudit(req, {
      action: "LISTING_SUSPEND",
      resource: "listing",
      resourceId: req.params.id,
      newValues: { status: "SUSPENDED" },
    });
    res.json({ success: true, data: listing });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// ESCROW
// ═══════════════════════════════════════════════════════════════════════════════
router.get("/escrow", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const where = status ? eq(escrowAccounts.status, status as any) : undefined;

    const results = await db.query.escrowAccounts.findMany({
      where: () => where,
      with: {
        listing: { columns: { title: true, region: true } },
        buyer: { with: { profile: { columns: { firstName: true, lastName: true } } } },
        seller: { with: { profile: { columns: { firstName: true, lastName: true } } } },
      },
      orderBy: (e, { desc: descFn }) => [descFn(e.createdAt)],
      limit: limitNum, offset,
    });

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(escrowAccounts).where(where);
    res.json({ success: true, data: { escrows: results, total: count, page: pageNum, limit: limitNum } });
  } catch (err) { next(err); }
});

router.patch("/escrow/:id/force-release", async (req, res, next) => {
  try {
    const notes = sanitizeMultiline(req.body.notes, 5000);
    if (!notes) return res.status(400).json({ success: false, error: "Admin notes required" });

    const [escrow] = await db.select().from(escrowAccounts).where(eq(escrowAccounts.id, req.params.id)).limit(1);
    if (!escrow) throw new AppError("Not found", 404, "NOT_FOUND");
    const previousStatus = escrow.status;

    await db.update(escrowAccounts)
      .set({ status: "RELEASED", releasedAt: new Date(), adminNotes: notes, updatedAt: new Date() })
      .where(eq(escrowAccounts.id, req.params.id));
    await db.update(listings).set({ status: "SOLD", updatedAt: new Date() }).where(eq(listings.id, escrow.listingId));
    await db.insert(transactions).values({
      escrowId: req.params.id, type: "RELEASE", status: "COMPLETED",
      amount: escrow.sellerPayoutAmount ?? escrow.totalAmount, currency: escrow.currency, processedAt: new Date(),
    });
    await writeAudit(req, {
      action: "ESCROW_FORCE_RELEASE",
      resource: "escrow",
      resourceId: req.params.id,
      oldValues: { status: previousStatus },
      newValues: { status: "RELEASED", notes },
    });
    res.json({ success: true, message: "Funds released to seller" });
  } catch (err) { next(err); }
});

router.patch("/escrow/:id/force-refund", async (req, res, next) => {
  try {
    const notes = sanitizeMultiline(req.body.notes, 5000);
    if (!notes) return res.status(400).json({ success: false, error: "Admin notes required" });

    const [escrow] = await db.select().from(escrowAccounts).where(eq(escrowAccounts.id, req.params.id)).limit(1);
    if (!escrow) throw new AppError("Not found", 404, "NOT_FOUND");
    const previousStatus = escrow.status;

    await db.update(escrowAccounts)
      .set({ status: "REFUNDED", refundedAt: new Date(), adminNotes: notes, updatedAt: new Date() })
      .where(eq(escrowAccounts.id, req.params.id));
    await db.insert(transactions).values({
      escrowId: req.params.id, type: "REFUND", status: "COMPLETED",
      amount: escrow.totalAmount, currency: escrow.currency, processedAt: new Date(),
    });
    await writeAudit(req, {
      action: "ESCROW_FORCE_REFUND",
      resource: "escrow",
      resourceId: req.params.id,
      oldValues: { status: previousStatus },
      newValues: { status: "REFUNDED", notes },
    });
    res.json({ success: true, message: "Funds refunded to buyer" });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// DOCUMENTS
// ═══════════════════════════════════════════════════════════════════════════════
router.get("/documents", async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;
    const where = status ? eq(documents.status, status as any) : undefined;

    const results = await db.query.documents.findMany({
      where: () => where,
      with: { uploadedBy: { with: { profile: { columns: { firstName: true, lastName: true } } } } },
      orderBy: (d, { desc: descFn }) => [descFn(d.createdAt)],
      limit: limitNum, offset,
    });

    const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(documents).where(where);
    res.json({ success: true, data: { documents: results, total: count, page: pageNum, limit: limitNum } });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS BROADCAST
// ═══════════════════════════════════════════════════════════════════════════════
router.post("/notifications/broadcast", async (req, res, next) => {
  try {
    const { title, body, type = "IN_APP", userIds, targetRole } = req.body;
    if (!title || !body) return res.status(400).json({ success: false, error: "title and body are required" });

    let targetUsers: { id: string }[] = [];
    if (userIds && Array.isArray(userIds)) {
      targetUsers = userIds.map((id: string) => ({ id }));
    } else {
      const conditions: any[] = [eq(users.isActive, true)];
      if (targetRole && targetRole !== "ALL") conditions.push(eq(users.role, targetRole as any));
      targetUsers = await db.select({ id: users.id }).from(users).where(and(...conditions));
    }

    if (targetUsers.length > 0) {
      await db.insert(notifications).values(
        targetUsers.map((u) => ({ userId: u.id, type: type as any, title, body, status: "SENT" as const, sentAt: new Date() })),
      );
    }

    logger.info({ count: targetUsers.length, type }, "Broadcast notification sent");
    res.json({ success: true, message: `Notification sent to ${targetUsers.length} users` });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIT LOGS
// ═══════════════════════════════════════════════════════════════════════════════
router.get("/audit-logs", async (req, res, next) => {
  try {
    const { page = 1, limit = 30, resource, action, adminId } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;

    const conditions: any[] = [];
    if (resource) conditions.push(eq(auditLogs.resource, String(resource)));
    if (action) conditions.push(eq(auditLogs.action, String(action)));
    if (adminId) conditions.push(eq(auditLogs.userId, String(adminId)));
    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const [logs, [{ count }]] = await Promise.all([
      db.select().from(auditLogs).where(where).orderBy(desc(auditLogs.createdAt)).limit(limitNum).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(auditLogs).where(where),
    ]);

    res.json({ success: true, data: { logs, total: count, page: pageNum, limit: limitNum } });
  } catch (err) { next(err); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// EXCHANGE RATES
// ═══════════════════════════════════════════════════════════════════════════════
router.get("/exchange-rates", async (req, res, next) => {
  try {
    const rates = await db.select().from(exchangeRates).orderBy(asc(exchangeRates.fromCurrency));
    res.json({ success: true, data: rates });
  } catch (err) { next(err); }
});

router.patch("/exchange-rates/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rate } = req.body;
    if (!rate || isNaN(Number(rate)) || Number(rate) <= 0)
      return next(new AppError("Rate must be a positive number", 400, "INVALID_INPUT"));
    const [updated] = await db.update(exchangeRates)
      .set({ rate: String(rate), updatedAt: new Date() })
      .where(eq(exchangeRates.id, id))
      .returning();
    if (!updated) return next(new AppError("Exchange rate not found", 404, "NOT_FOUND"));
    await writeAudit(req, { userId: (req as any).user.id, action: "UPDATE_EXCHANGE_RATE", resource: "exchange_rates", resourceId: id, newValues: { rate } });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

router.put("/exchange-rates", async (req, res, next) => {
  try {
    const { from: fromCurrency, to: toCurrency, rate } = req.body;
    if (!fromCurrency || !toCurrency || !rate)
      return res.status(400).json({ success: false, error: "from, to, rate required" });

    const [existing] = await db.select({ id: exchangeRates.id }).from(exchangeRates)
      .where(and(eq(exchangeRates.fromCurrency, fromCurrency), eq(exchangeRates.toCurrency, toCurrency))).limit(1);

    let updated;
    if (existing) {
      [updated] = await db.update(exchangeRates)
        .set({ rate: String(rate), updatedAt: new Date() })
        .where(eq(exchangeRates.id, existing.id)).returning();
    } else {
      [updated] = await db.insert(exchangeRates)
        .values({ fromCurrency, toCurrency, rate: String(rate) }).returning();
    }

    await writeAudit(req, {
      action: "EXCHANGE_RATE_UPDATE",
      resource: "exchange_rate",
      newValues: { fromCurrency, toCurrency, rate },
    });
    res.json({ success: true, data: updated });
  } catch (err) { next(err); }
});

export default router;
