import nodemailer from "nodemailer";
import * as configModule from "@kunda/config";
import { EMAIL_TEMPLATES } from "../templates/email.templates";
import type { NotificationJob } from "@kunda/types";

const { env, logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

function getTransporter() {
  if (env.NODE_ENV === "development") {
    return nodemailer.createTransport({
      host: "localhost",
      port: 1025,
      ignoreTLS: true,
    });
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function sendEmail(job: NotificationJob): Promise<void> {
  const { event, payload, recipient } = job;

  if (!recipient.email) {
    logger.warn("Email skipped - no email address", { event });
    return;
  }

  const template = EMAIL_TEMPLATES[event];

  if (!template) {
    logger.warn("No email template found", { event });
    return;
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from: '"Kunda Properties" <hello@kundaproperties.gm>',
    to: recipient.email,
    subject: template.subject,
    html: template.html(payload),
  });

  logger.info("Email sent", {
    event,
    to: recipient.email,
  });
}
