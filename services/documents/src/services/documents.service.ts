import * as configModule from "@kunda/config";
import * as dbModule from "@kunda/db";
import {
  buildS3Key,
  getSignedDownloadUrl,
  uploadDocument,
} from "../utils/s3";
import { generateSaleAgreement } from "../utils/pdf";

const { logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");
const { prisma } = ("default" in dbModule ? dbModule.default : dbModule) as typeof import("@kunda/db");

function generateAgreementNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const random = Math.floor(Math.random() * 90000) + 10000;
  return `KP-${year}${month}-${random}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export class DocumentsService {
  async generateSaleAgreement(escrowId: string, adminId: string) {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: {
        listing: {
          include: {
            agent: {
              select: {
                fullName: true,
                phone: true,
              },
            },
          },
        },
        buyer: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            country: true,
          },
        },
      },
    });

    if (!escrow) {
      throw new Error("ESCROW_NOT_FOUND");
    }

    if (!["FUNDED", "TITLE_VERIFIED"].includes(escrow.status)) {
      throw new Error("INVALID_ESCROW_STATE");
    }

    const existing = await prisma.document.findFirst({
      where: {
        escrowId,
        type: "SALE_AGREEMENT",
      },
    });

    if (existing) {
      throw new Error("AGREEMENT_ALREADY_EXISTS");
    }

    const agreementNumber = generateAgreementNumber();
    const amountGBP = Number(escrow.amountGBP);
    const platformFee = Number(escrow.platformFee);

    const pdfBuffer = await generateSaleAgreement({
      agreementNumber,
      date: formatDate(new Date()),
      buyer: {
        fullName: escrow.buyer.fullName,
        email: escrow.buyer.email,
        phone: escrow.buyer.phone ?? undefined,
        country: escrow.buyer.country ?? "Not specified",
      },
      seller: {
        fullName: escrow.listing.agent.fullName,
        phone: escrow.listing.agent.phone ?? "Not specified",
      },
      property: {
        title: escrow.listing.title,
        location: escrow.listing.location,
        region: escrow.listing.region,
        type: escrow.listing.type,
        sizeSqm: escrow.listing.sizeSqm,
        bedrooms: escrow.listing.bedrooms,
      },
      transaction: {
        amountGBP,
        platformFee,
        totalGBP: amountGBP + platformFee,
        escrowId,
      },
    });

    const filename = `sale-agreement-${agreementNumber}.pdf`;
    const s3Key = buildS3Key("sale-agreements", escrowId, filename);
    const s3Url = await uploadDocument(s3Key, pdfBuffer);

    const document = await prisma.document.create({
      data: {
        escrowId,
        listingId: escrow.listingId,
        name: filename,
        s3Key,
        s3Url,
        type: "SALE_AGREEMENT",
      },
    });

    logger.info("Sale agreement generated", {
      documentId: document.id,
      escrowId,
      agreementNumber,
      adminId,
    });

    return document;
  }

  async signDocument(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        escrow: {
          include: {
            buyer: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!document) {
      throw new Error("DOCUMENT_NOT_FOUND");
    }

    if (document.signedAt) {
      throw new Error("ALREADY_SIGNED");
    }

    if (document.escrow?.buyer.id !== userId && !(await this.isAdmin(userId))) {
      throw new Error("FORBIDDEN");
    }

    const signed = await prisma.document.update({
      where: { id: documentId },
      data: { signedAt: new Date() },
    });

    logger.info("Document signed", { documentId, userId });
    return signed;
  }

  async getDownloadUrl(documentId: string, userId: string): Promise<string> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        escrow: {
          include: {
            buyer: {
              select: { id: true },
            },
          },
        },
      },
    });

    if (!document) {
      throw new Error("DOCUMENT_NOT_FOUND");
    }

    const isOwner = document.escrow?.buyer.id === userId;
    const isAdmin = await this.isAdmin(userId);

    if (!isOwner && !isAdmin) {
      throw new Error("FORBIDDEN");
    }

    return getSignedDownloadUrl(document.s3Key, 3600);
  }

  async findByEscrow(escrowId: string, userId: string) {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new Error("ESCROW_NOT_FOUND");
    }

    const isOwner = escrow.buyerId === userId;
    const isAdmin = await this.isAdmin(userId);

    if (!isOwner && !isAdmin) {
      throw new Error("FORBIDDEN");
    }

    return prisma.document.findMany({
      where: { escrowId },
      orderBy: { createdAt: "asc" },
    });
  }

  async findById(documentId: string) {
    return prisma.document.findUnique({
      where: { id: documentId },
    });
  }

  async uploadTitleDeed(
    escrowId: string,
    buffer: Buffer,
    filename: string,
    adminId: string,
  ) {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
    });

    if (!escrow) {
      throw new Error("ESCROW_NOT_FOUND");
    }

    const s3Key = buildS3Key("title-deeds", escrowId, filename);
    const s3Url = await uploadDocument(s3Key, buffer, "application/pdf");

    const document = await prisma.document.create({
      data: {
        escrowId,
        listingId: escrow.listingId,
        name: filename,
        s3Key,
        s3Url,
        type: "TITLE_DEED",
      },
    });

    logger.info("Title deed uploaded", {
      documentId: document.id,
      escrowId,
      adminId,
    });

    return document;
  }

  private async isAdmin(userId: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    return user?.role === "ADMIN";
  }
}

export const documentsService = new DocumentsService();
