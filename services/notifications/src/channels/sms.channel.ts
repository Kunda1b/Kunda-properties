import twilio from "twilio";
import * as configModule from "@kunda/config";
import { SMS_TEMPLATES } from "../templates/sms.templates";
import type { NotificationJob } from "@kunda/types";

const { env, logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

let twilioClient: ReturnType<typeof twilio> | null = null;

function getClient() {
  if (twilioClient) {
    return twilioClient;
  }

  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN) {
    throw new Error("Twilio credentials not configured");
  }

  twilioClient = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
  return twilioClient;
}

export async function sendSMS(job: NotificationJob): Promise<void> {
  const { event, payload, recipient } = job;

  if (!recipient.phone) {
    logger.warn("SMS skipped - no phone number", { event });
    return;
  }

  const template = SMS_TEMPLATES[event];

  if (!template) {
    logger.warn("No SMS template found", { event });
    return;
  }

  const body = template(payload);

  if (env.NODE_ENV === "development") {
    logger.info("SMS (dev mode - not sent)", {
      event,
      to: recipient.phone,
      body,
    });
    return;
  }

  const client = getClient();

  await client.messages.create({
    body,
    from: env.TWILIO_PHONE_NUMBER,
    to: recipient.phone,
  });

  logger.info("SMS sent", { event, to: recipient.phone });
}
