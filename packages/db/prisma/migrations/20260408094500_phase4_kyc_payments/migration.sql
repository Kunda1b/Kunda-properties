-- CreateEnum
CREATE TYPE "KYCCheckResult" AS ENUM ('NOT_STARTED', 'PENDING', 'PASSED', 'REVIEW_REQUIRED', 'FAILED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'WAVE', 'ORANGE_MONEY');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CARD', 'MOBILE_MONEY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('NOT_STARTED', 'PENDING', 'REQUIRES_ACTION', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CANCELED');

-- AlterTable
ALTER TABLE "kyc_records"
ADD COLUMN "amlReferenceId" TEXT,
ADD COLUMN "amlStatus" "KYCCheckResult" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "documentBackUrl" TEXT,
ADD COLUMN "documentCheckStatus" "KYCCheckResult" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "documentNumber" TEXT,
ADD COLUMN "issuingCountry" TEXT,
ADD COLUMN "lastCheckedAt" TIMESTAMP(3),
ADD COLUMN "livenessStatus" "KYCCheckResult" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'SMILE_IDENTITY',
ADD COLUMN "rejectionReason" TEXT,
ALTER COLUMN "documentUrl" DROP NOT NULL;

-- AlterTable
ALTER TABLE "escrow_transactions"
ADD COLUMN "checkoutUrl" TEXT,
ADD COLUMN "fundedAt" TIMESTAMP(3),
ADD COLUMN "fundingCurrency" TEXT NOT NULL DEFAULT 'GBP',
ADD COLUMN "paymentMethod" "PaymentMethod",
ADD COLUMN "paymentProvider" "PaymentProvider",
ADD COLUMN "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'NOT_STARTED',
ADD COLUMN "providerPaymentId" TEXT,
ADD COLUMN "providerReference" TEXT,
ADD COLUMN "refundedAt" TIMESTAMP(3);
