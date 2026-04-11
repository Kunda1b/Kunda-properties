import type { NotificationEvent } from "@kunda/types";

type WhatsAppTemplate = (payload: Record<string, string | number>) => string;

export const WHATSAPP_TEMPLATES: Partial<
  Record<NotificationEvent, WhatsAppTemplate>
> = {
  OTP_REQUESTED: (p) =>
    `*Kunda Properties*\n\nYour verification code is:\n\n*${p.code}*\n\nExpires in 10 minutes. Do not share this code with anyone.`,

  ESCROW_FUNDED: (p) =>
    `*Kunda Properties* ✅\n\nHi ${p.name},\n\nYour payment of *${p.totalGBP}* for *${p.propertyTitle}* has been received and secured in escrow.\n\nNext step: title verification (24-48 hours).\n\nTrack your purchase at kundaproperties.gm`,

  ESCROW_COMPLETED: (p) =>
    `*Kunda Properties* 🎉\n\nCongratulations ${p.name}!\n\nYour purchase of *${p.propertyTitle}* is complete. Funds have been released and your documents are ready.\n\nView your documents at kundaproperties.gm/dashboard`,

  ESCROW_DISPUTED: (p) =>
    `*Kunda Properties* ⚠️\n\nHi ${p.name},\n\nA dispute has been raised on *${p.propertyTitle}*. Your funds remain safely held in escrow.\n\nOur team will contact you within 2 business days. You can also reply to this message.`,

  ESCROW_REFUNDED: (p) =>
    `*Kunda Properties*\n\nHi ${p.name},\n\nYour refund of *${p.totalGBP}* for *${p.propertyTitle}* has been processed. Please allow 5 business days for the funds to appear.`,

  KYC_APPROVED: (p) =>
    `*Kunda Properties* ✅\n\nHi ${p.name},\n\nYour identity has been verified! You can now initiate escrow transactions and complete property purchases.\n\nBrowse properties at kundaproperties.gm/listings`,

  ENQUIRY_RECEIVED: (p) =>
    `*Kunda Properties*\n\nHi ${p.agentName},\n\nNew enquiry from *${p.buyerName}* about *${p.propertyTitle}*:\n\n"${p.message}"\n\nContact: ${p.buyerEmail}${p.buyerPhone ? ` · ${p.buyerPhone}` : ""}`,
};
