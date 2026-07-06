import { Request, Response, NextFunction } from "express";
import { prisma } from "@kunda/database";
import { notificationQueue } from "../workers/notification.worker";

export async function sendNotification(req: Request, res: Response, next: NextFunction) {
  try {
    const { userId, title, body, type = "IN_APP", data, templateId } = req.body;
    const notification = await prisma.notification.create({ data: { userId, title, body, type, data, templateId, status: "PENDING" } });
    await notificationQueue.add({ notificationId: notification.id }, { attempts: 3, backoff: { type: "exponential", delay: 2000 } });
    res.status(201).json({ success: true, data: { id: notification.id } });
  } catch (error) { next(error); }
}

export async function notifyEscrow(req: Request, res: Response, next: NextFunction) {
  try {
    const { event, escrowId, userIds } = req.body;
    const escrow = await prisma.escrowAccount.findUnique({ where: { id: escrowId }, include: { listing: true } });
    if (!escrow) return res.json({ success: true });

    const templates: Record<string, { title: string; body: string }> = {
      ESCROW_INITIATED:  { title: "Escrow Initiated 🏠", body: `Escrow initiated for "${escrow.listing.title}". Ref: ${escrow.referenceNumber}` },
      PAYMENT_CONFIRMED: { title: "Payment Confirmed ✅", body: `Payment received. Inspection period begins now.` },
      FUNDS_RELEASED:    { title: "Transaction Complete 🎉", body: `Funds released. Thank you for using Kunda Properties!` },
      DISPUTE_RAISED:    { title: "Dispute Raised ⚠️", body: `Dispute raised on ${escrow.referenceNumber}.` },
    };
    const template = templates[event] || { title: "Kunda Update", body: `Escrow ${escrow.referenceNumber} updated` };

    await Promise.all((userIds as string[]).map((userId) =>
      prisma.notification.create({ data: { userId, title: template.title, body: template.body, type: "IN_APP", data: { escrowId, event }, status: "PENDING" } })
        .then((n) => notificationQueue.add({ notificationId: n.id }, { attempts: 3 }))
    ));
    return res.json({ success: true });
  } catch (error) { next(error); }
}

export async function getUserNotifications(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const { page = 1, limit = 20, unreadOnly } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const where: any = { userId };
    if (unreadOnly === "true") where.readAt = null;

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({ where, skip, take: Number(limit), orderBy: { createdAt: "desc" } }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { userId, readAt: null } }),
    ]);
    res.json({ success: true, data: { notifications, total, unreadCount, page: Number(page), limit: Number(limit) } });
  } catch (error) { next(error); }
}

export async function markAsRead(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const { ids } = req.body;
    if (ids === "all") await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: new Date() } });
    else await prisma.notification.updateMany({ where: { id: { in: ids }, userId }, data: { readAt: new Date() } });
    res.json({ success: true });
  } catch (error) { next(error); }
}
