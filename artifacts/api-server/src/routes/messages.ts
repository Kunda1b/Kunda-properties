import { Router } from "express";
import { body } from "express-validator";
import { db } from "@workspace/db";
import { conversations, messages, listings } from "@workspace/db/schema";
import { eq, and, or, desc, asc, sql } from "drizzle-orm";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { AppError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";
import { notify } from "../lib/notify.js";

const router = Router();
router.use(authenticate);

// ── GET /messages/conversations ───────────────────────────────────────────────
router.get("/conversations", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const convs = await db.query.conversations.findMany({
      where: (c, { or: orFn, eq: eqFn }) => orFn(eqFn(c.buyerId, userId), eqFn(c.sellerId, userId)),
      with: {
        listing: { columns: { title: true, slug: true } },
        buyer: { with: { profile: { columns: { firstName: true, lastName: true, avatarUrl: true } } } },
        seller: { with: { profile: { columns: { firstName: true, lastName: true, avatarUrl: true } } } },
        messages: {
          orderBy: (m, { desc: descFn }) => [descFn(m.createdAt)],
          limit: 1,
        },
      },
      orderBy: (c, { desc: descFn }) => [descFn(c.lastMessageAt)],
    });

    const result = convs.map((c: any) => ({
      ...c,
      otherUser: c.buyerId === userId ? c.seller : c.buyer,
      unread: c.messages?.[0]?.senderId !== userId && !c.messages?.[0]?.readAt,
    }));

    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ── GET /messages/conversations/:convId ───────────────────────────────────────
router.get("/conversations/:convId", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const [conv] = await db.query.conversations.findMany({
      where: (c, { eq: eqFn }) => eqFn(c.id, req.params.convId),
      with: {
        listing: { columns: { title: true, slug: true, price: true, currency: true } },
        buyer: { with: { profile: { columns: { firstName: true, lastName: true, avatarUrl: true } } } },
        seller: { with: { profile: { columns: { firstName: true, lastName: true, avatarUrl: true } } } },
      },
      limit: 1,
    });

    if (!conv) throw new AppError("Conversation not found", 404, "NOT_FOUND");
    if (conv.buyerId !== userId && conv.sellerId !== userId)
      throw new AppError("Access denied", 403, "FORBIDDEN");

    const msgs = await db.query.messages.findMany({
      where: (m, { eq: eqFn }) => eqFn(m.conversationId, conv.id),
      with: { sender: { with: { profile: { columns: { firstName: true, lastName: true, avatarUrl: true } } } } },
      orderBy: (m, { asc: ascFn }) => [ascFn(m.createdAt)],
    });

    // Mark messages as read
    await db.update(messages)
      .set({ readAt: new Date() })
      .where(and(
        eq(messages.conversationId, conv.id),
        eq(messages.senderId, conv.buyerId === userId ? conv.sellerId : conv.buyerId),
        sql`read_at IS NULL`,
      ));

    res.json({ success: true, data: { conversation: conv, messages: msgs } });
  } catch (err) { next(err); }
});

// ── POST /messages/start ──────────────────────────────────────────────────────
router.post(
  "/start",
  validate([
    body("listingId").notEmpty(),
    body("message").trim().isLength({ min: 1, max: 5000 }),
  ]),
  async (req, res, next) => {
    try {
      const userId = (req as any).user.id;
      const { listingId, message, subject } = req.body;

      const [listing] = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
      if (!listing) throw new AppError("Listing not found", 404, "NOT_FOUND");
      if (listing.sellerId === userId) throw new AppError("Cannot message yourself", 400, "SELF_MESSAGE");

      // Find or create conversation
      let [conv] = await db.select().from(conversations)
        .where(and(
          eq(conversations.listingId, listingId),
          eq(conversations.buyerId, userId),
          eq(conversations.sellerId, listing.sellerId),
        ))
        .limit(1) as any[];

      if (!conv) {
        [conv] = await db.insert(conversations).values({
          listingId, buyerId: userId, sellerId: listing.sellerId,
          subject: subject || `Enquiry about "${listing.title}"`,
        }).returning();
      }

      const [msg] = await db.insert(messages).values({
        conversationId: conv.id, senderId: userId, body: message,
      }).returning();

      await db.update(conversations)
        .set({ lastMessageAt: new Date(), updatedAt: new Date() })
        .where(eq(conversations.id, conv.id));

      // Track enquiry
      await db.update(listings)
        .set({ enquiryCount: sql`enquiry_count + 1` })
        .where(eq(listings.id, listingId));

      await notify(
        listing.sellerId,
        "New Enquiry",
        `Someone enquired about "${listing.title}"`,
        { conversationId: conv.id, listingId },
      );

      logger.info({ conversationId: conv.id, listingId }, "Conversation started");
      res.status(201).json({ success: true, data: { conversation: conv, message: msg } });
    } catch (err) { next(err); }
  },
);

// ── POST /messages/conversations/:convId ──────────────────────────────────────
router.post(
  "/conversations/:convId",
  validate([body("message").trim().isLength({ min: 1, max: 5000 })]),
  async (req, res, next) => {
    try {
      const userId = (req as any).user.id;
      const [conv] = await db.select().from(conversations).where(eq(conversations.id, req.params.convId)).limit(1);
      if (!conv) throw new AppError("Conversation not found", 404, "NOT_FOUND");
      if (conv.buyerId !== userId && conv.sellerId !== userId)
        throw new AppError("Access denied", 403, "FORBIDDEN");

      const [msg] = await db.insert(messages).values({
        conversationId: conv.id, senderId: userId, body: req.body.message,
      }).returning();

      await db.update(conversations)
        .set({ lastMessageAt: new Date(), updatedAt: new Date() })
        .where(eq(conversations.id, conv.id));

      const otherPartyId = conv.buyerId === userId ? conv.sellerId : conv.buyerId;
      await notify(
        otherPartyId,
        "New Message",
        `New message regarding your listing`,
        { conversationId: conv.id },
      );

      res.status(201).json({ success: true, data: msg });
    } catch (err) { next(err); }
  },
);

// ── GET /messages/unread-count ────────────────────────────────────────────────
router.get("/unread-count", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const [result] = await db.execute(
      sql`SELECT COUNT(*)::int as count FROM messages m
          JOIN conversations c ON c.id = m.conversation_id
          WHERE m.sender_id != ${userId} AND m.read_at IS NULL
          AND (c.buyer_id = ${userId} OR c.seller_id = ${userId})`
    );
    res.json({ success: true, data: { count: Number(result.count) } });
  } catch (err) { next(err); }
});

export default router;
