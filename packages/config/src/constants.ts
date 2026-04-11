export const ESCROW_PLATFORM_FEE_PERCENT = 1.5;

export const KYC_CACHE_TTL_HOURS = 12;

export const SESSION_TTL_SECONDS = {
  web: 60 * 60 * 24,
  mobile: 60 * 60 * 24 * 30,
};

export const SUPPORTED_CURRENCIES = ["GBP", "EUR", "USD", "GMD"] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const LISTING_PHOTOS_MAX = 10;

export const PAGINATION_DEFAULT_LIMIT = 20;
export const PAGINATION_MAX_LIMIT = 100;

export const QUEUE_PREFIX = "kunda";

export const QUEUE_NAMES = {
  EMAIL: "email",
  SMS: "sms",
  WHATSAPP: "whatsapp",
  KYC_WEBHOOK: "kyc-webhook",
  PAYMENT_WEBHOOK: "payment-webhook",
} as const;

export const SERVICE_PORTS = {
  AUTH: 4101,
  LISTINGS: 4102,
  ESCROW: 4103,
  DOCUMENTS: 4104,
  NOTIFICATIONS: 4105,
  GATEWAY: 4000,
} as const;
