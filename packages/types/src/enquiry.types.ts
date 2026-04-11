export type EnquiryStatus = "SENT" | "REPLIED" | "CLOSED";

export type Enquiry = {
  id: string;
  listingId: string;
  buyerId: string;
  message: string;
  phone?: string;
  status: EnquiryStatus;
  createdAt: string;
  updatedAt: string;
};
