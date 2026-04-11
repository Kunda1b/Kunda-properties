export type NotificationChannel = "EMAIL" | "SMS" | "WHATSAPP";

export type NotificationEvent =
  | "ENQUIRY_RECEIVED"
  | "ENQUIRY_REPLIED"
  | "ESCROW_INITIATED"
  | "ESCROW_FUNDED"
  | "ESCROW_COMPLETED"
  | "ESCROW_DISPUTED"
  | "ESCROW_REFUNDED"
  | "KYC_APPROVED"
  | "KYC_REJECTED"
  | "OTP_REQUESTED"
  | "LISTING_PUBLISHED"
  | "LISTING_REJECTED";

export type NotificationJob = {
  event: NotificationEvent;
  channel: NotificationChannel;
  recipient: {
    email?: string;
    phone?: string;
    name: string;
  };
  payload: Record<string, string | number>;
};
