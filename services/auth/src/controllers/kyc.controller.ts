import { Request, Response, NextFunction } from "express";
import axios from "axios";
import crypto from "crypto";
import { prisma } from "@kunda/database";
import { AppError } from "../utils/errors";
import { logger } from "../utils/logger";

const SMILE_BASE_URL = process.env.SMILE_IDENTITY_ENVIRONMENT === "production"
  ? "https://api.smileidentity.com/v1" : "https://testapi.smileidentity.com/v1";

function generateSmileSignature(): string {
  const timestamp = new Date().toISOString();
  const data = `${process.env.SMILE_IDENTITY_PARTNER_ID}:${timestamp}`;
  return crypto.createHmac("sha256", process.env.SMILE_IDENTITY_API_KEY || "").update(data).digest("base64");
}

export async function submitKyc(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const { idType, idNumber, idCountry, firstName, lastName, dateOfBirth } = req.body;

    const existing = await prisma.kycRecord.findUnique({ where: { userId } });
    if (existing?.status === "VERIFIED") throw new AppError("KYC already verified", 400, "KYC_ALREADY_VERIFIED");

    let kycStatus: "VERIFIED"|"REJECTED"|"SUBMITTED" = "SUBMITTED";
    let smileResult: any = {};
    let jobId = `kunda_${userId}_${Date.now()}`;

    try {
      const payload = {
        partner_id: process.env.SMILE_IDENTITY_PARTNER_ID,
        source_sdk: "rest_api", source_sdk_version: "2.0.0",
        timestamp: new Date().toISOString(), signature: generateSmileSignature(),
        job_type: 5, job_id: jobId, user_id: userId,
        id_info: { first_name: firstName, last_name: lastName, dob: dateOfBirth,
          country: idCountry || "GM", id_type: idType, id_number: idNumber, entered: true },
        options: { return_job_status: true, return_history: false, return_images: false },
      };
      const response = await axios.post(`${SMILE_BASE_URL}/id_verification`, payload, {
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.SMILE_IDENTITY_API_KEY}` },
        timeout: 30000,
      });
      smileResult = response.data;
      jobId = smileResult.job_id || jobId;
      const code = smileResult.result?.ResultCode;
      kycStatus = code === "1012" ? "VERIFIED" : code === "1014" ? "REJECTED" : "SUBMITTED";
    } catch (apiErr) {
      logger.warn({ apiErr }, "Smile Identity API unavailable, marking as SUBMITTED for manual review");
    }

    const kyc = await prisma.kycRecord.upsert({
      where: { userId },
      update: { status: kycStatus, smileJobId: jobId, idType, idNumber, idCountry,
        verifiedAt: kycStatus === "VERIFIED" ? new Date() : undefined,
        rejectionReason: kycStatus === "REJECTED" ? (smileResult.result?.ResultText || "Verification failed") : undefined,
        rawResponse: smileResult },
      create: { userId, status: kycStatus, smileJobId: jobId, idType, idNumber, idCountry,
        verifiedAt: kycStatus === "VERIFIED" ? new Date() : undefined, rawResponse: smileResult },
    });

    logger.info({ userId, kycStatus, jobId }, "KYC submitted");
    res.json({ success: true, data: { status: kyc.status, jobId: kyc.smileJobId,
      message: kycStatus === "VERIFIED" ? "Identity verified successfully"
             : kycStatus === "REJECTED" ? "Verification failed. Please check documents and retry."
             : "Verification in progress. You'll be notified within 24 hours." } });
  } catch (error) { next(error); }
}

export async function uploadKycDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const { imageUrl, side } = req.body;
    const updateData: Record<string, string> = {};
    if (side === "front")  updateData.idFrontUrl = imageUrl;
    if (side === "back")   updateData.idBackUrl = imageUrl;
    if (side === "selfie") updateData.selfieImageUrl = imageUrl;

    await prisma.kycRecord.upsert({
      where: { userId }, update: updateData,
      create: { userId, status: "PENDING", ...updateData },
    });
    res.json({ success: true, message: `${side} document uploaded successfully` });
  } catch (error) { next(error); }
}

export async function getKycStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user.id;
    const kyc = await prisma.kycRecord.findUnique({ where: { userId },
      select: { status: true, idType: true, idCountry: true, verifiedAt: true,
        rejectionReason: true, smileJobId: true, createdAt: true, updatedAt: true } });
    res.json({ success: true, data: kyc || { status: "PENDING" } });
  } catch (error) { next(error); }
}

export async function smileWebhook(req: Request, res: Response, next: NextFunction) {
  try {
    const { job_id, ResultCode, ResultText } = req.body;
    const kyc = await prisma.kycRecord.findFirst({ where: { smileJobId: job_id } });
    if (!kyc) { logger.warn({ job_id }, "Webhook for unknown KYC job"); return res.status(200).json({ received: true }); }

    const newStatus = ResultCode === "1012" ? "VERIFIED" : ResultCode === "1014" ? "REJECTED" : "SUBMITTED";
    await prisma.kycRecord.update({ where: { id: kyc.id }, data: {
      status: newStatus, verifiedAt: newStatus === "VERIFIED" ? new Date() : undefined,
      rejectionReason: newStatus === "REJECTED" ? ResultText : undefined, rawResponse: req.body } });

    logger.info({ userId: kyc.userId, newStatus }, "KYC updated via webhook");
    res.status(200).json({ received: true });
  } catch (error) { next(error); }
}
