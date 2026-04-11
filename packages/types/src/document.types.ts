export type DocumentType =
  | "SALE_AGREEMENT"
  | "TITLE_DEED"
  | "KYC_DOCUMENT"
  | "RECEIPT"
  | "OTHER";

export type Document = {
  id: string;
  listingId?: string;
  escrowId?: string;
  name: string;
  s3Key: string;
  s3Url: string;
  type: DocumentType;
  signedAt?: string;
  createdAt: string;
};
