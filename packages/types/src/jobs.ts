export const queueNames = {
  enquiryNotifications: "enquiry-notifications",
  listingCacheWarm: "listing-cache-warm",
} as const;

export type EnquiryNotificationJob = {
  enquiryId: string;
  listingId: string;
  recipientName: string;
  recipientPhone: string;
  submittedAt: string;
};

export type ListingCacheWarmJob = {
  listingId?: string;
  reason: "cron" | "mutation" | "seed";
};
