export type Role = "BUYER" | "AGENT" | "ADMIN";

export type KYCStatus = "PENDING" | "SUBMITTED" | "APPROVED" | "REJECTED";
export type KYCCheckResult =
  | "NOT_STARTED"
  | "PENDING"
  | "PASSED"
  | "REVIEW_REQUIRED"
  | "FAILED";

export type User = {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  country?: string;
  role: Role;
  kycStatus: KYCStatus;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PublicUser = Omit<User, "createdAt" | "updatedAt">;

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export type SessionPayload = {
  userId: string;
  email: string;
  role: Role;
  kycStatus: KYCStatus;
};

export type KYCRecord = {
  id: string;
  userId: string;
  documentType: string;
  documentNumber?: string;
  issuingCountry?: string;
  documentUrl?: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  smileJobId?: string;
  amlReferenceId?: string;
  provider: string;
  status: KYCStatus;
  documentCheckStatus: KYCCheckResult;
  livenessStatus: KYCCheckResult;
  amlStatus: KYCCheckResult;
  reviewNote?: string;
  rejectionReason?: string;
  submittedAt: string;
  reviewedAt?: string;
  lastCheckedAt?: string;
};

export type KycFileCapture = {
  fileName: string;
  contentType: string;
  data: string;
};

export type SmileImageDetail = {
  image_type_id: number;
  image: string;
};

export type KycSubmission = {
  documentType: "PASSPORT" | "NATIONAL_ID" | "DRIVERS_LICENSE" | "RESIDENCE_PERMIT";
  documentNumber: string;
  issuingCountry: string;
  documentFront: KycFileCapture;
  documentBack?: KycFileCapture;
  selfie?: KycFileCapture;
  livenessImages?: KycFileCapture[];
  smileCapture?: {
    images?: SmileImageDetail[];
    [key: string]: unknown;
  };
  consentAccepted: true;
};

export type KycDecision = {
  status: Extract<KYCStatus, "APPROVED" | "REJECTED">;
  reviewNote?: string;
  rejectionReason?: string;
};
