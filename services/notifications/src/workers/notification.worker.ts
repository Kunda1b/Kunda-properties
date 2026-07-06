import Bull from "bull";
import { prisma } from "@kunda/database";
import sgMail from "@sendgrid/mail";
import twilio from "twilio";
import { messaging } from "../utils/firebase";
import { logger } from "../utils/logger";

export const notificationQueue = new Bull("notifications", { redis: process.env.REDIS_URL || "redis://localhost:6379" });

export async function startNotificationWorker() {
  if (process.env.SENDGRID_API_KEY) sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  const twilioClient = process.env.TWILIO_ACCOUNT_SID
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

  notificationQueue.process(async (job) => {
    const { notificationId } = job.data;
    const notification = await prisma.notification.findUnique({ where: { id: notificationId }, include: { user: { include: { profile: true } } } });
    if (!notification || notification.status === "SENT") return;

    const { user, title, body, type } = notification;
    let externalId: string | undefined;
    let success = false;

    try {
      switch (type) {
        case "EMAIL":
          if (user.email && process.env.SENDGRID_API_KEY) {
            await sgMail.send({
              to: user.email, from: { email: process.env.FROM_EMAIL || "noreply@kundaproperties.gm", name: "Kunda Properties" },
              subject: title, html: buildEmailHtml(title, body, user.profile?.firstName || ""),
            });
            success = true;
          }
          break;
        case "SMS":
          if (user.phone && twilioClient) {
            const msg = await twilioClient.messages.create({ body: `${title}: ${body}`, from: process.env.TWILIO_FROM_NUMBER!, to: user.phone });
            externalId = msg.sid; success = true;
          }
          break;
        case "PUSH":
          success = true; // Placeholder — device tokens stored client-side
          break;
        case "IN_APP":
          success = true;
          break;
      }
      await prisma.notification.update({ where: { id: notificationId }, data: { status: success ? "SENT" : "FAILED", sentAt: success ? new Date() : undefined, externalId } });
    } catch (err) {
      logger.error({ err, notificationId }, "Notification delivery failed");
      await prisma.notification.update({ where: { id: notificationId }, data: { status: "FAILED", failureReason: (err as Error).message } });
    }
  });

  logger.info("Notification worker started");
}

function buildEmailHtml(title: string, body: string, firstName: string): string {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#f5f5f5;padding:20px">
    <div style="max-width:600px;margin:0 auto;background:white;border-radius:8px;overflow:hidden">
      <div style="background:#1a5c38;padding:24px;text-align:center"><h1 style="color:white;margin:0">Kunda Properties</h1></div>
      <div style="padding:32px">${firstName ? `<p>Hi ${firstName},</p>` : ""}<h2>${title}</h2><p>${body}</p></div>
    </div></body></html>`;
}
