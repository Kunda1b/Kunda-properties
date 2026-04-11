import * as configModule from "@kunda/config";
import * as dbModule from "@kunda/db";
import { isVerified, verifyIdentity } from "../utils/smile";
import { uploadKYCDocument } from "../utils/kyc-storage";

const { logger, publishNotification } =
  ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");
const { prisma } =
  ("default" in dbModule ? dbModule.default : dbModule) as typeof import("@kunda/db");

export type KYCSubmissionInput = {
  firstName: string;
  lastName: string;
  country: string;
  idType: string;
  idNumber: string;
  documentImageBase64?: string;
  selfieImageBase64?: string;
};

export class KYCService {
  async submit(userId: string, input: KYCSubmissionInput) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        kycStatus: true,
      },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (user.kycStatus === "APPROVED") {
      throw new Error("ALREADY_VERIFIED");
    }

    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: "SUBMITTED" },
    });

    const existing = await prisma.kYCRecord.findUnique({
      where: { userId },
    });

    if (existing) {
      await prisma.kYCRecord.update({
        where: { userId },
        data: {
          documentType: input.idType,
          documentNumber: input.idNumber,
          issuingCountry: input.country,
          status: "SUBMITTED",
          reviewNote: null,
          rejectionReason: null,
          reviewedAt: null,
        },
      });
    } else {
      await prisma.kYCRecord.create({
        data: {
          userId,
          documentType: input.idType,
          documentNumber: input.idNumber,
          issuingCountry: input.country,
          documentUrl: "pending",
          status: "SUBMITTED",
        },
      });
    }

    let documentUrl = "pending";
    let selfieUrl: string | undefined;

    if (input.documentImageBase64) {
      const docKey = await uploadKYCDocument(
        userId,
        "document",
        input.documentImageBase64,
        "image/jpeg",
      );
      documentUrl = docKey;
    }

    if (input.selfieImageBase64) {
      const selfieKey = await uploadKYCDocument(
        userId,
        "selfie",
        input.selfieImageBase64,
        "image/jpeg",
      );
      selfieUrl = selfieKey;
    }

    await prisma.kYCRecord.update({
      where: { userId },
      data: {
        documentUrl,
        selfieUrl,
      },
    });

    logger.info("KYC submitted", { userId, idType: input.idType });

    void this.processVerification(user, input).catch((error) => {
      logger.error("KYC background processing failed", { userId, error });
    });

    return {
      message: "Verification submitted. We will notify you of the result.",
    };
  }

  private async processVerification(
    user: { id: string; email: string; fullName: string },
    input: KYCSubmissionInput,
  ) {
    try {
      const [firstName, ...rest] = user.fullName.trim().split(/\s+/);
      const result = await verifyIdentity({
        userId: user.id,
        firstName: input.firstName || firstName,
        lastName: input.lastName || rest.join(" "),
        country: input.country,
        idType: input.idType,
        idNumber: input.idNumber,
        selfieImageBase64: input.selfieImageBase64,
        documentImageBase64: input.documentImageBase64,
      });

      const approved = isVerified(result);

      await prisma.user.update({
        where: { id: user.id },
        data: { kycStatus: approved ? "APPROVED" : "REJECTED" },
      });

      await prisma.kYCRecord.update({
        where: { userId: user.id },
        data: {
          smileJobId: result.jobId,
          status: approved ? "APPROVED" : "REJECTED",
          reviewNote: result.resultText,
          rejectionReason: approved ? null : result.resultText,
          reviewedAt: new Date(),
          documentCheckStatus: approved ? "PASSED" : "FAILED",
          livenessStatus: approved ? "PASSED" : "FAILED",
          amlStatus: approved ? "PASSED" : "REVIEW_REQUIRED",
        },
      });

      await publishNotification({
        event: approved ? "KYC_APPROVED" : "KYC_REJECTED",
        channel: "EMAIL",
        recipient: { email: user.email, name: user.fullName },
        payload: {
          name: user.fullName,
          reason: approved ? "" : result.resultText,
        },
      });

      if (approved) {
        await publishNotification({
          event: "KYC_APPROVED",
          channel: "WHATSAPP",
          recipient: { name: user.fullName },
          payload: { name: user.fullName },
        });
      }

      logger.info("KYC processing complete", {
        userId: user.id,
        approved,
        resultCode: result.resultCode,
      });
    } catch (error) {
      logger.error("KYC verification error", { userId: user.id, error });

      await prisma.user.update({
        where: { id: user.id },
        data: { kycStatus: "PENDING" },
      });

      await prisma.kYCRecord.update({
        where: { userId: user.id },
        data: {
          status: "PENDING",
          reviewNote: "Verification failed - please resubmit",
          documentCheckStatus: "PENDING",
          livenessStatus: "PENDING",
          amlStatus: "PENDING",
        },
      });
    }
  }

  async getStatus(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        kycStatus: true,
        kycRecord: {
          select: {
            documentType: true,
            status: true,
            reviewNote: true,
            submittedAt: true,
            reviewedAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    return user;
  }

  async adminApprove(userId: string, adminId: string, note?: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: "APPROVED" },
    });

    await prisma.kYCRecord.update({
      where: { userId },
      data: {
        status: "APPROVED",
        reviewNote: note || "Manually approved by admin",
        rejectionReason: null,
        reviewedAt: new Date(),
        documentCheckStatus: "PASSED",
        livenessStatus: "PASSED",
        amlStatus: "PASSED",
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });

    if (user) {
      await publishNotification({
        event: "KYC_APPROVED",
        channel: "EMAIL",
        recipient: { email: user.email, name: user.fullName },
        payload: { name: user.fullName },
      });
    }

    logger.info("KYC manually approved", { userId, adminId });
  }

  async adminReject(userId: string, adminId: string, reason: string) {
    await prisma.user.update({
      where: { id: userId },
      data: { kycStatus: "REJECTED" },
    });

    await prisma.kYCRecord.update({
      where: { userId },
      data: {
        status: "REJECTED",
        reviewNote: reason,
        rejectionReason: reason,
        reviewedAt: new Date(),
        documentCheckStatus: "FAILED",
        livenessStatus: "FAILED",
        amlStatus: "REVIEW_REQUIRED",
      },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, fullName: true },
    });

    if (user) {
      await publishNotification({
        event: "KYC_REJECTED",
        channel: "EMAIL",
        recipient: { email: user.email, name: user.fullName },
        payload: { name: user.fullName, reason },
      });
    }

    logger.info("KYC manually rejected", { userId, adminId, reason });
  }

  async getPendingQueue() {
    return prisma.kYCRecord.findMany({
      where: { status: "SUBMITTED" },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            country: true,
            createdAt: true,
          },
        },
      },
      orderBy: { submittedAt: "asc" },
    });
  }
}

export const kycService = new KYCService();
