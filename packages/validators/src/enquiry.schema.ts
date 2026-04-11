import { z } from "zod";

export const createEnquirySchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(2000, "Message is too long"),
  phone: z.string().min(7).max(20).optional(),
});

export const updateEnquirySchema = z.object({
  status: z.enum(["SENT", "REPLIED", "CLOSED"]),
});

export type CreateEnquiryInput = z.infer<typeof createEnquirySchema>;
export type UpdateEnquiryInput = z.infer<typeof updateEnquirySchema>;
