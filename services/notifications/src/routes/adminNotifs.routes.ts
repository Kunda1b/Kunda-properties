import { Router } from "express";
import { authenticate, requireRole } from "../middleware/authenticate";
import { prisma } from "@kunda/database";
import { notificationQueue } from "../workers/notification.worker";
import { logger } from "../utils/logger";
const router = Router();
router.use(authenticate, requireRole("ADMIN"));

router.post("/notifications/broadcast", async (req, res, next) => {
  try {
    const { title, body, audience = "all", channels = ["IN_APP"] } = req.body;
    if (!title || !body) return res.status(400).json({ success: false, error: "title and body required" });

    const where: any = { isActive: true, isSuspended: false };
    if (audience === "buyers")  where.role = "BUYER";
    if (audience === "sellers") where.role = { in: ["SELLER","AGENT"] };

    const users = await prisma.user.findMany({ where, select: { id: true } });
    const type = (channels[0] as any) || "IN_APP";

    const notifications = await Promise.all(users.map((u: any) =>
      prisma.notification.create({ data: { userId: u.id, title, body, type, status: "PENDING", data: { broadcast: true, channels, audience } } })
    ));
    await Promise.all(notifications.map((n) => notificationQueue.add({ notificationId: n.id }, { attempts: 2 })));

    await prisma.auditLog.create({ data: { userId: (req as any).user.id, action: "BROADCAST", resource: "notification", newValues: { title, audience, recipientCount: users.length } } });
    logger.info({ recipientCount: users.length }, "Admin broadcast sent");
    return res.json({ success: true, data: { recipientCount: users.length } });
  } catch (e) { next(e); }
});

router.get("/notifications", async (req, res, next) => {
  try {
    const { limit = 20, page = 1 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const notifications = await prisma.notification.findMany({ take: Number(limit), skip, orderBy: { createdAt: "desc" } });
    res.json({ success: true, data: { notifications } });
  } catch (e) { next(e); }
});

export default router;
