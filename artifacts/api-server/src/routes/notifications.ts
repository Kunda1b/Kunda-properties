import { Router } from "express";
import { db } from "@workspace/db";
import { notifications } from "@workspace/db/schema";
import { eq, and, desc, inArray, sql } from "drizzle-orm";
import { authenticate } from "../middleware/authenticate.js";

const router = Router();
router.use(authenticate);

// ── GET /notifications ────────────────────────────────────────────────────────
router.get("/", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 30 } = req.query;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const results = await db.select().from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limitNum)
      .offset((pageNum - 1) * limitNum);

    const [{ unread }] = await db
      .select({ unread: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.status, "SENT")));

    res.json({ success: true, data: { notifications: results, unreadCount: unread, page: pageNum, limit: limitNum } });
  } catch (err) { next(err); }
});

// ── PATCH /notifications/read ─────────────────────────────────────────────────
router.patch("/read", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const { ids } = req.body;
    const now = new Date();

    if (ids === "all") {
      await db.update(notifications)
        .set({ status: "READ", readAt: now })
        .where(eq(notifications.userId, userId));
    } else if (Array.isArray(ids) && ids.length > 0) {
      await db.update(notifications)
        .set({ status: "READ", readAt: now })
        .where(and(eq(notifications.userId, userId), inArray(notifications.id, ids)));
    }

    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
