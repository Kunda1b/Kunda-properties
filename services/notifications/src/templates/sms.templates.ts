import type { NotificationEvent } from "@kunda/types";

type SMSTemplate = (payload: Record<string, string | number>) => string;

export const SMS_TEMPLATES: Partial<Record<NotificationEvent, SMSTemplate>> = {
  OTP_REQUESTED: (p) =>
    `Your Kunda verification code is: ${p.code}. Expires in 10 minutes. Do not share this code.`,

  ESCROW_FUNDED: (p) =>
    `Kunda: Payment of ${p.totalGBP} received for ${p.propertyTitle}. Funds secured. Track at kundaproperties.gm`,

  ESCROW_COMPLETED: (p) =>
    `Kunda: Congratulations! Your purchase of ${p.propertyTitle} is complete. Documents in your dashboard.`,

  ESCROW_DISPUTED: (p) =>
    `Kunda: A dispute has been raised on ${p.propertyTitle}. Your funds are safe. We'll contact you within 2 days.`,

  ESCROW_REFUNDED: (p) =>
    `Kunda: Refund of ${p.totalGBP} processed for ${p.propertyTitle}. Allow 5 business days.`,

  KYC_APPROVED: (p) =>
    `Kunda: Hi ${p.name}, your identity is verified. You can now complete property purchases.`,

  KYC_REJECTED: () =>
    "Kunda: Identity verification unsuccessful. Please resubmit documents at kundaproperties.gm",

  ENQUIRY_RECEIVED: (p) =>
    `Kunda: New enquiry from ${p.buyerName} about ${p.propertyTitle}. Check your email for details.`,
};
