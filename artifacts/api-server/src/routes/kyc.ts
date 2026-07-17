import { Router } from "express";
import { body } from "express-validator";
import { db } from "@workspace/db";
import { kycRecords } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { authenticate } from "../middleware/authenticate.js";
import { validate } from "../middleware/validate.js";
import { logger } from "../lib/logger.js";

const router = Router();
router.use(authenticate);

// ── GET /kyc/status ───────────────────────────────────────────────────────────
router.get("/status", async (req, res, next) => {
  try {
    const userId = (req as any).user.id;
    const [kyc] = await db.select({
      status: kycRecords.status, idType: kycRecords.idType, idCountry: kycRecords.idCountry,
      verifiedAt: kycRecords.verifiedAt, rejectionReason: kycRecords.rejectionReason,
      smileJobId: kycRecords.smileJobId, createdAt: kycRecords.createdAt, updatedAt: kycRecords.updatedAt,
    }).from(kycRecords).where(eq(kycRecords.userId, userId)).limit(1);

    res.json({ success: true, data: kyc || { status: "PENDING" } });
  } catch (err) { next(err); }
});

// ── POST /kyc/submit ──────────────────────────────────────────────────────────
router.post(
  "/submit",
  validate([
    body("idType").isIn(["PASSPORT", "NATIONAL_ID", "DRIVERS_LICENSE", "VOTER_ID"]),
    body("idNumber").notEmpty().trim(),
    body("idCountry").isLength({ min: 2, max: 3 }),
    body("firstName").notEmpty().trim(),
    body("lastName").notEmpty().trim(),
    body("dateOfBirth").isISO8601(),
  ]),
  async (req, res, next) => {
    try {
      const userId = (req as any).user.id;
      const { idType, idNumber, idCountry } = req.body;

      const [existing] = await db.select({ status: kycRecords.status }).from(kycRecords)
        .where(eq(kycRecords.userId, userId)).limit(1);
      if (existing?.status === "VERIFIED") {
        return res.status(400).json({ success: false, error: "KYC already verified", code: "KYC_ALREADY_VERIFIED" });
      }

      // Smile Identity is not configured — mark as SUBMITTED for manual review
      const jobId = `kunda_${userId}_${Date.now()}`;
      const now = new Date();

      if (existing) {
        await db.update(kycRecords).set({
          status: "SUBMITTED", idType, idNumber, idCountry, smileJobId: jobId, updatedAt: now,
        }).where(eq(kycRecords.userId, userId));
      } else {
        await db.insert(kycRecords).values({
          userId, status: "SUBMITTED", idType, idNumber, idCountry, smileJobId: jobId,
        });
      }

      logger.info({ userId, jobId }, "KYC submitted for manual review");
      res.json({
        success: true,
        data: {
          status: "SUBMITTED", jobId,
          message: "Verification submitted. Our team will review within 24 hours.",
        },
      });
    } catch (err) { next(err); }
  },
);

// ── POST /kyc/upload-document ─────────────────────────────────────────────────
router.post(
  "/upload-document",
  validate([
    body("imageUrl").isURL(),
    body("side").isIn(["front", "back", "selfie"]),
  ]),
  async (req, res, next) => {
    try {
      const userId = (req as any).user.id;
      const { imageUrl, side } = req.body;
      const update: Record<string, string> = {};
      if (side === "front")  update.idFrontUrl = imageUrl;
      if (side === "back")   update.idBackUrl = imageUrl;
      if (side === "selfie") update.selfieImageUrl = imageUrl;

      const [existing] = await db.select({ id: kycRecords.id }).from(kycRecords)
        .where(eq(kycRecords.userId, userId)).limit(1);

      if (existing) {
        await db.update(kycRecords).set({ ...update, updatedAt: new Date() }).where(eq(kycRecords.userId, userId));
      } else {
        await db.insert(kycRecords).values({ userId, status: "PENDING", ...update });
      }

      res.json({ success: true, message: `${side} document uploaded successfully` });
    } catch (err) { next(err); }
  },
);

export default router;
