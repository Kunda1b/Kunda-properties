import { z } from "zod";

export const enquiryInputSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  message: z
    .string()
    .trim()
    .min(10, "Please add a short message so the agent has context."),
  name: z.string().trim().min(1, "Your name is required."),
  phone: z.string().trim().optional().default(""),
});
