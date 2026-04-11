import { z } from "zod";

export const initiateEscrowSchema = z.object({
  listingId: z.string().min(1, "Listing ID is required"),
});

export const updateEscrowSchema = z.object({
  status: z.enum([
    "INITIATED",
    "FUNDED",
    "TITLE_VERIFIED",
    "DOCS_SIGNED",
    "COMPLETED",
    "DISPUTED",
    "REFUNDED",
  ]),
  note: z.string().max(500).optional(),
});

export const disputeEscrowSchema = z.object({
  reason: z
    .string()
    .min(20, "Please describe the dispute in at least 20 characters")
    .max(2000, "Reason is too long"),
});

export const createPaymentSchema = z
  .object({
    provider: z.enum(["STRIPE", "WAVE", "ORANGE_MONEY"]),
    currency: z.enum(["GBP", "EUR", "USD", "GMD"]),
    mobileNumber: z.string().min(7).max(20).optional(),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
  })
  .superRefine((data, context) => {
    if (data.provider === "STRIPE" && data.currency === "GMD") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Stripe funding is only available in GBP, EUR, or USD",
        path: ["currency"],
      });
    }

    if (data.provider !== "STRIPE" && data.currency !== "GMD") {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Wave and Orange Money funding must use GMD",
        path: ["currency"],
      });
    }

    if (data.provider !== "STRIPE" && !data.mobileNumber) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A mobile money number is required for local funding",
        path: ["mobileNumber"],
      });
    }
  });

export type InitiateEscrowInput = z.infer<typeof initiateEscrowSchema>;
export type UpdateEscrowInput = z.infer<typeof updateEscrowSchema>;
export type DisputeEscrowInput = z.infer<typeof disputeEscrowSchema>;
export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
