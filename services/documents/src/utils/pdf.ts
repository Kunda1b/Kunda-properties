import PDFDocument from "pdfkit";
import * as configModule from "@kunda/config";

const { logger } = ("default" in configModule ? configModule.default : configModule) as typeof import("@kunda/config");

export type SaleAgreementData = {
  agreementNumber: string;
  date: string;
  buyer: {
    fullName: string;
    email: string;
    phone?: string;
    country: string;
  };
  seller: {
    fullName: string;
    phone: string;
  };
  property: {
    title: string;
    location: string;
    region: string;
    type: string;
    sizeSqm: number;
    bedrooms: number;
  };
  transaction: {
    amountGBP: number;
    platformFee: number;
    totalGBP: number;
    escrowId: string;
  };
};

const KUNDA_GREEN = "#0F6E56";

export async function generateSaleAgreement(
  data: SaleAgreementData,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 60,
      info: {
        Title: `Kunda Properties - Sale Agreement ${data.agreementNumber}`,
        Author: "Kunda Properties",
        Subject: `Property Sale Agreement - ${data.property.title}`,
        CreationDate: new Date(),
      },
    });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer | Uint8Array) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    });
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.rect(0, 0, doc.page.width, 80).fill(KUNDA_GREEN);

    doc.fillColor("white").fontSize(22).font("Helvetica-Bold").text("KUNDA PROPERTIES", 60, 22);

    doc
      .fontSize(9)
      .font("Helvetica")
      .text("The Gambia's trusted diaspora property platform", 60, 50);

    doc.fillColor("#000000");

    doc
      .moveDown(3)
      .fontSize(16)
      .font("Helvetica-Bold")
      .fillColor(KUNDA_GREEN)
      .text("PROPERTY SALE AGREEMENT", { align: "center" });

    doc
      .moveDown(0.4)
      .fontSize(9)
      .font("Helvetica")
      .fillColor("#666666")
      .text(`Agreement No: ${data.agreementNumber}  ·  Date: ${data.date}`, {
        align: "center",
      });

    doc
      .moveDown(0.4)
      .moveTo(60, doc.y)
      .lineTo(doc.page.width - 60, doc.y)
      .strokeColor(KUNDA_GREEN)
      .lineWidth(1)
      .stroke();

    doc.fillColor("#000000");

    const sectionTitle = (title: string) => {
      doc
        .moveDown(1.2)
        .fontSize(11)
        .font("Helvetica-Bold")
        .fillColor(KUNDA_GREEN)
        .text(title.toUpperCase())
        .moveDown(0.4)
        .fillColor("#000000");
    };

    const field = (label: string, value: string) => {
      doc.fontSize(10).font("Helvetica");
      doc
        .fillColor("#555555")
        .text(`${label}:`, { continued: true, width: 160 })
        .fillColor("#000000")
        .font("Helvetica-Bold")
        .text(` ${value}`);
      doc.font("Helvetica");
    };

    sectionTitle("1. Parties to this Agreement");

    doc
      .fontSize(10)
      .font("Helvetica")
      .fillColor("#333333")
      .text(
        'This Sale Agreement ("Agreement") is entered into between the Buyer and the Seller identified below, facilitated through Kunda Properties as an escrow and transaction platform.',
        { lineGap: 3 },
      );

    doc
      .moveDown(0.8)
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(KUNDA_GREEN)
      .text("BUYER");
    doc.fillColor("#000000").font("Helvetica");

    field("Full name", data.buyer.fullName);
    field("Email", data.buyer.email);
    if (data.buyer.phone) {
      field("Phone", data.buyer.phone);
    }
    field("Country of residence", data.buyer.country);

    doc
      .moveDown(0.8)
      .fontSize(10)
      .font("Helvetica-Bold")
      .fillColor(KUNDA_GREEN)
      .text("SELLER / AGENT");
    doc.fillColor("#000000").font("Helvetica");

    field("Full name", data.seller.fullName);
    field("Phone", data.seller.phone);

    sectionTitle("2. Property Details");

    field("Property name", data.property.title);
    field("Location", data.property.location);
    field("Region", data.property.region);
    field("Property type", data.property.type);
    if (data.property.sizeSqm > 0) {
      field("Plot / floor area", `${data.property.sizeSqm} m²`);
    }
    if (data.property.bedrooms > 0) {
      field("Bedrooms", String(data.property.bedrooms));
    }

    sectionTitle("3. Transaction Details");

    field("Escrow reference", data.transaction.escrowId);
    field(
      "Property price",
      `GBP ${data.transaction.amountGBP.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
    );
    field(
      "Platform fee (1.5%)",
      `GBP ${data.transaction.platformFee.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`,
    );

    doc.moveDown(0.3).rect(60, doc.y, doc.page.width - 120, 28).fill("#E1F5EE");

    doc
      .fillColor(KUNDA_GREEN)
      .fontSize(11)
      .font("Helvetica-Bold")
      .text(
        `TOTAL PAYABLE:  GBP ${data.transaction.totalGBP.toLocaleString("en-GB", {
          minimumFractionDigits: 2,
        })}`,
        70,
        doc.y - 22,
      );

    doc.fillColor("#000000").font("Helvetica");

    sectionTitle("4. Terms and Conditions");

    const terms = [
      "The Buyer confirms that all funds have been deposited into the Kunda Properties escrow account prior to the signing of this Agreement.",
      "Funds held in escrow will be released to the Seller only upon: (a) confirmation of clear title, (b) execution of all required transfer documents, and (c) approval by the Kunda Properties operations team.",
      "The Seller warrants that the property is free from all encumbrances, liens, and third-party claims, and that they have full authority to sell the property.",
      "In the event of a dispute, Kunda Properties will act as a neutral mediator. If the dispute cannot be resolved, the escrowed funds will be returned to the Buyer within 5 business days.",
      "This Agreement is governed by the laws of The Republic of The Gambia.",
      "Both parties confirm they have had the opportunity to seek independent legal advice before signing this Agreement.",
    ];

    terms.forEach((term, index) => {
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#333333")
        .text(`${index + 1}. ${term}`, { lineGap: 2, indent: 10 })
        .moveDown(0.4);
    });

    sectionTitle("5. Signatures");

    doc
      .fontSize(9)
      .fillColor("#555555")
      .text(
        "By signing below, both parties confirm they have read, understood, and agreed to the terms of this Agreement.",
      );

    doc.moveDown(1.5);

    const signY = doc.y;
    const midX = doc.page.width / 2;

    doc.fontSize(9).font("Helvetica").fillColor("#000000");

    doc
      .moveTo(60, signY + 30)
      .lineTo(midX - 20, signY + 30)
      .strokeColor("#cccccc")
      .lineWidth(0.5)
      .stroke();

    doc.moveTo(midX + 20, signY + 30).lineTo(doc.page.width - 60, signY + 30).stroke();

    doc
      .fillColor("#555555")
      .text("Buyer signature", 60, signY + 35)
      .text("Date: _______________", 60, signY + 48);

    doc
      .text("Seller / Agent signature", midX + 20, signY + 35)
      .text("Date: _______________", midX + 20, signY + 48);

    doc
      .fontSize(7)
      .fillColor("#aaaaaa")
      .text(
        `This document was generated by Kunda Properties · ${data.agreementNumber} · Page 1 of 1`,
        60,
        doc.page.height - 40,
        { align: "center", width: doc.page.width - 120 },
      );

    doc.end();

    logger.info("Sale agreement PDF generated", {
      agreementNumber: data.agreementNumber,
    });
  });
}
