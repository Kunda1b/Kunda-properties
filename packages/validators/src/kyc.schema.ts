import { z } from "zod";

const fileCaptureSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  contentType: z.string().min(1, "Content type is required"),
  data: z.string().min(20, "Capture payload is incomplete"),
});

const smileImageSchema = z.object({
  image_type_id: z.coerce.number().int().nonnegative(),
  image: z.string().min(20, "Smile image payload is incomplete"),
});

export const submitKycSchema = z
  .object({
    documentType: z.enum([
      "PASSPORT",
      "NATIONAL_ID",
      "DRIVERS_LICENSE",
      "RESIDENCE_PERMIT",
    ]),
    documentNumber: z.string().min(4, "Document number is required").max(50),
    issuingCountry: z.string().min(2, "Issuing country is required").max(100),
    documentFront: fileCaptureSchema,
    documentBack: fileCaptureSchema.optional(),
    selfie: fileCaptureSchema.optional(),
    livenessImages: z.array(fileCaptureSchema).max(8).optional(),
    smileCapture: z
      .object({
        images: z.array(smileImageSchema).optional(),
      })
      .passthrough()
      .optional(),
    consentAccepted: z.literal(true, {
      errorMap: () => ({
        message: "Consent is required before starting verification",
      }),
    }),
  })
  .superRefine((data, context) => {
    const hasSmileImages = Boolean(data.smileCapture?.images?.length);
    const hasManualSelfie = Boolean(data.selfie);

    if (!hasSmileImages && !hasManualSelfie) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Complete the selfie or Smile liveness step",
        path: ["selfie"],
      });
    }
  });

export const reviewKycSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    reviewNote: z.string().max(500).optional(),
    rejectionReason: z.string().max(500).optional(),
  })
  .superRefine((data, context) => {
    if (data.status === "REJECTED" && !data.rejectionReason) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A rejection reason is required when declining KYC",
        path: ["rejectionReason"],
      });
    }
  });

export type SubmitKycInput = z.infer<typeof submitKycSchema>;
export type ReviewKycInput = z.infer<typeof reviewKycSchema>;
