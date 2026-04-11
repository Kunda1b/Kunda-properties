export type EscrowStatus =
  | "INITIATED"
  | "FUNDED"
  | "TITLE_VERIFIED"
  | "DOCS_SIGNED"
  | "COMPLETED"
  | "DISPUTED"
  | "REFUNDED";

export type PaymentProvider = "STRIPE" | "WAVE" | "ORANGE_MONEY";
export type PaymentMethod = "CARD" | "MOBILE_MONEY";
export type PaymentStatus =
  | "NOT_STARTED"
  | "PENDING"
  | "REQUIRES_ACTION"
  | "SUCCEEDED"
  | "FAILED"
  | "REFUNDED"
  | "CANCELED";

export type EscrowTransaction = {
  id: string;
  listingId: string;
  buyerId: string;
  amountGBP: number;
  amountGMD?: number;
  platformFee: number;
  status: EscrowStatus;
  fundingCurrency: string;
  paymentProvider?: PaymentProvider;
  paymentMethod?: PaymentMethod;
  paymentStatus: PaymentStatus;
  stripePaymentId?: string;
  providerPaymentId?: string;
  providerReference?: string;
  checkoutUrl?: string;
  createdAt: string;
  updatedAt: string;
  fundedAt?: string;
  refundedAt?: string;
};

export type EscrowAuditEvent = {
  id: string;
  escrowId: string;
  event: string;
  fromStatus?: string;
  toStatus: string;
  performedBy?: string;
  note?: string;
  createdAt: string;
};

export type FeeBreakdown = {
  subtotal: number;
  platformFee: number;
  total: number;
  currency: string;
  feePercent: number;
};

export type CreatePaymentRequest = {
  provider: PaymentProvider;
  currency: "GBP" | "EUR" | "USD" | "GMD";
  mobileNumber?: string;
  successUrl?: string;
  cancelUrl?: string;
};

export type PaymentSession = {
  provider: PaymentProvider;
  paymentMethod: PaymentMethod;
  currency: string;
  paymentStatus: PaymentStatus;
  providerPaymentId: string;
  providerReference?: string;
  clientSecret?: string;
  checkoutUrl?: string;
  fees: FeeBreakdown;
};
