import type { NotificationEvent } from "@kunda/types";

type EmailTemplate = {
  subject: string;
  html: (payload: Record<string, string | number>) => string;
};

const BASE_STYLE = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  max-width: 520px;
  margin: 0 auto;
  color: #1a1a18;
`;

const BUTTON = (href: string, text: string) => `
  <a href="${href}" style="
    display: inline-block;
    background: #0F6E56;
    color: white;
    padding: 12px 28px;
    border-radius: 10px;
    text-decoration: none;
    font-weight: 500;
    font-size: 14px;
    margin-top: 20px;
  ">${text}</a>
`;

const HEADER = () => `
  <div style="background: #0F6E56; padding: 24px 32px; border-radius: 12px 12px 0 0;">
    <span style="color: white; font-size: 20px; font-weight: 700;">Kunda Properties</span>
  </div>
`;

const FOOTER = () => `
  <div style="margin-top: 32px; padding-top: 20px; border-top: 1px solid #e5e5e3;">
    <p style="font-size: 12px; color: #888; margin: 0;">
      Kunda Properties · Built for the Gambian diaspora<br/>
      <a href="mailto:hello@kundaproperties.gm" style="color: #0F6E56;">hello@kundaproperties.gm</a>
    </p>
  </div>
`;

const WRAP = (content: string) => `
  <div style="${BASE_STYLE}">
    ${HEADER()}
    <div style="padding: 32px; background: white; border-radius: 0 0 12px 12px; border: 1px solid #e5e5e3; border-top: none;">
      ${content}
      ${FOOTER()}
    </div>
  </div>
`;

export const EMAIL_TEMPLATES: Partial<Record<NotificationEvent, EmailTemplate>> = {
  OTP_REQUESTED: {
    subject: "Your Kunda verification code",
    html: (p) => WRAP(`
      <h2 style="margin: 0 0 8px; color: #0F6E56;">Verify your email</h2>
      <p style="color: #555; font-size: 14px;">Hi ${p.name}, your verification code is:</p>
      <div style="
        font-size: 40px;
        font-weight: 700;
        letter-spacing: 12px;
        color: #0F6E56;
        background: #E1F5EE;
        border-radius: 12px;
        text-align: center;
        padding: 20px;
        margin: 24px 0;
      ">${p.code}</div>
      <p style="font-size: 13px; color: #888;">
        This code expires in 10 minutes. If you didn't request this, please ignore this email.
      </p>
    `),
  },
  ESCROW_INITIATED: {
    subject: "Your Kunda escrow has been created",
    html: (p) => WRAP(`
      <h2 style="margin: 0 0 8px; color: #0F6E56;">Escrow initiated</h2>
      <p style="font-size: 14px; color: #555;">Hi ${p.name},</p>
      <p style="font-size: 14px; color: #555;">
        Your escrow for <strong>${p.propertyTitle}</strong> has been created successfully.
      </p>
      <div style="background: #f9f9f7; border-radius: 10px; padding: 16px; margin: 20px 0;">
        <p style="margin: 0 0 6px; font-size: 13px; color: #888;">Amount to fund</p>
        <p style="margin: 0; font-size: 22px; font-weight: 700; color: #0F6E56;">${p.totalGBP}</p>
        <p style="margin: 6px 0 0; font-size: 12px; color: #aaa;">
          Includes ${p.platformFee} Kunda platform fee
        </p>
      </div>
      <p style="font-size: 14px; color: #555;">
        Your funds are protected until title is verified and all documents are signed.
      </p>
      ${BUTTON("https://kundaproperties.gm/dashboard", "View your escrow")}
    `),
  },
  ESCROW_FUNDED: {
    subject: "Payment received - your funds are secure",
    html: (p) => WRAP(`
      <h2 style="margin: 0 0 8px; color: #0F6E56;">Funds secured in escrow</h2>
      <p style="font-size: 14px; color: #555;">Hi ${p.name},</p>
      <p style="font-size: 14px; color: #555;">
        We've received your payment of <strong>${p.totalGBP}</strong> for
        <strong>${p.propertyTitle}</strong>.
      </p>
      <p style="font-size: 14px; color: #555;">
        Your funds are now held securely. The next step is title verification by our team,
        which takes 24-48 hours.
      </p>
      ${BUTTON("https://kundaproperties.gm/dashboard", "Track your purchase")}
    `),
  },
  ESCROW_COMPLETED: {
    subject: "Congratulations - your property purchase is complete",
    html: (p) => WRAP(`
      <h2 style="margin: 0 0 8px; color: #0F6E56;">Purchase complete</h2>
      <p style="font-size: 14px; color: #555;">Hi ${p.name},</p>
      <p style="font-size: 14px; color: #555;">
        Congratulations on your purchase of <strong>${p.propertyTitle}</strong>.
        All documents have been signed and funds have been released to the seller.
      </p>
      <p style="font-size: 14px; color: #555;">
        Your signed sale agreement and title documents are available in your Kunda dashboard.
      </p>
      ${BUTTON("https://kundaproperties.gm/dashboard", "View your documents")}
    `),
  },
  ESCROW_DISPUTED: {
    subject: "Dispute raised on your Kunda transaction",
    html: (p) => WRAP(`
      <h2 style="margin: 0 0 8px; color: #993C1D;">Dispute raised</h2>
      <p style="font-size: 14px; color: #555;">Hi ${p.name},</p>
      <p style="font-size: 14px; color: #555;">
        A dispute has been raised on your transaction for <strong>${p.propertyTitle}</strong>.
        Your funds remain safely held in escrow while we investigate.
      </p>
      <p style="font-size: 14px; color: #555;">
        Our team will be in touch within 2 business days. You can also reach us at
        <a href="mailto:hello@kundaproperties.gm" style="color: #0F6E56;">hello@kundaproperties.gm</a>.
      </p>
    `),
  },
  ESCROW_REFUNDED: {
    subject: "Your Kunda escrow has been refunded",
    html: (p) => WRAP(`
      <h2 style="margin: 0 0 8px; color: #0F6E56;">Refund processed</h2>
      <p style="font-size: 14px; color: #555;">Hi ${p.name},</p>
      <p style="font-size: 14px; color: #555;">
        Your escrow for <strong>${p.propertyTitle}</strong> has been refunded.
        The amount of <strong>${p.totalGBP}</strong> will appear in your account
        within 5 business days.
      </p>
    `),
  },
  KYC_APPROVED: {
    subject: "Identity verified - you can now use Kunda escrow",
    html: (p) => WRAP(`
      <h2 style="margin: 0 0 8px; color: #0F6E56;">Identity verified</h2>
      <p style="font-size: 14px; color: #555;">Hi ${p.name},</p>
      <p style="font-size: 14px; color: #555;">
        Your identity has been verified. You can now initiate escrow transactions
        and complete property purchases on Kunda.
      </p>
      ${BUTTON("https://kundaproperties.gm/listings", "Browse properties")}
    `),
  },
  KYC_REJECTED: {
    subject: "Identity verification unsuccessful",
    html: (p) => WRAP(`
      <h2 style="margin: 0 0 8px; color: #993C1D;">Verification unsuccessful</h2>
      <p style="font-size: 14px; color: #555;">Hi ${p.name},</p>
      <p style="font-size: 14px; color: #555;">
        We were unable to verify your identity with the documents provided.
        ${p.reason ? `Reason: <strong>${p.reason}</strong>.` : ""}
      </p>
      <p style="font-size: 14px; color: #555;">
        Please resubmit with a clear photo of a valid passport or national ID.
      </p>
      ${BUTTON("https://kundaproperties.gm/dashboard/settings", "Resubmit documents")}
    `),
  },
  ENQUIRY_RECEIVED: {
    subject: "New enquiry on your Kunda listing",
    html: (p) => WRAP(`
      <h2 style="margin: 0 0 8px; color: #0F6E56;">New enquiry received</h2>
      <p style="font-size: 14px; color: #555;">Hi ${p.agentName},</p>
      <p style="font-size: 14px; color: #555;">
        <strong>${p.buyerName}</strong> has sent an enquiry about
        <strong>${p.propertyTitle}</strong>.
      </p>
      <div style="background: #f9f9f7; border-radius: 10px; padding: 16px; margin: 20px 0; font-size: 14px; color: #333;">
        "${p.message}"
      </div>
      <p style="font-size: 14px; color: #555;">
        Contact: <a href="mailto:${p.buyerEmail}" style="color: #0F6E56;">${p.buyerEmail}</a>
        ${p.buyerPhone ? ` · ${p.buyerPhone}` : ""}
      </p>
    `),
  },
  LISTING_PUBLISHED: {
    subject: "Your Kunda listing is now live",
    html: (p) => WRAP(`
      <h2 style="margin: 0 0 8px; color: #0F6E56;">Listing published</h2>
      <p style="font-size: 14px; color: #555;">Hi ${p.name},</p>
      <p style="font-size: 14px; color: #555;">
        Your listing <strong>${p.propertyTitle}</strong> has been reviewed and
        published on Kunda Properties.
      </p>
      ${BUTTON(`https://kundaproperties.gm/listings/${p.listingId}`, "View your listing")}
    `),
  },
  LISTING_REJECTED: {
    subject: "Your Kunda listing needs attention",
    html: (p) => WRAP(`
      <h2 style="margin: 0 0 8px; color: #993C1D;">Listing not approved</h2>
      <p style="font-size: 14px; color: #555;">Hi ${p.name},</p>
      <p style="font-size: 14px; color: #555;">
        Your listing <strong>${p.propertyTitle}</strong> was not approved.
        ${p.reason ? `Reason: <strong>${p.reason}</strong>.` : ""}
      </p>
      <p style="font-size: 14px; color: #555;">
        Please update your listing and resubmit for review.
      </p>
      ${BUTTON("https://kundaproperties.gm/agents/dashboard", "Edit listing")}
    `),
  },
};
