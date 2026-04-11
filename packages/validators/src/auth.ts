import { z } from "zod";
import { buyerProfiles, otpCodeLength } from "@kunda/types";

export const registerInputSchema = z.object({
  buyerProfile: z.enum(buyerProfiles),
  email: z.string().trim().email("Please enter a valid email address."),
  firstName: z.string().trim().min(1, "First name is required."),
  lastName: z.string().trim().min(1, "Last name is required."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  phone: z.string().trim().min(7, "Please enter a valid phone number."),
});

export const signInInputSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address."),
  keepSignedIn: z.boolean().default(false),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const otpVerificationSchema = z.object({
  code: z
    .string()
    .trim()
    .length(otpCodeLength, `Code must be ${otpCodeLength} digits.`)
    .regex(/^\d+$/, "Code must only contain digits."),
});
