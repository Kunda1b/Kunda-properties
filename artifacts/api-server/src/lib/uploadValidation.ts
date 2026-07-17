import { AppError } from "./errors.js";
import { sanitizeUrl } from "./sanitize.js";

/** Allowed MIME types for property / KYC document uploads. */
export const ALLOWED_DOCUMENT_MIMES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

/** Allowed MIME types for KYC ID photos / selfies. */
export const ALLOWED_KYC_MIMES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

/** Max file size: 10 MB for documents, 5 MB for KYC images. */
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const MAX_KYC_BYTES = 5 * 1024 * 1024;

const EXT_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

function extensionOf(url: string): string {
  try {
    const path = new URL(url).pathname.toLowerCase();
    const m = path.match(/(\.[a-z0-9]+)$/i);
    return m ? m[1] : "";
  } catch {
    return "";
  }
}

function normalizeMime(mime: string | null | undefined): string | null {
  if (!mime) return null;
  return mime.split(";")[0].trim().toLowerCase();
}

export interface UploadValidationInput {
  fileUrl: string;
  mimeType?: string | null;
  fileSize?: number | null;
  /** "document" | "kyc" */
  kind?: "document" | "kyc";
}

export interface UploadValidationResult {
  fileUrl: string;
  mimeType: string;
  fileSize: number | null;
}

/**
 * Validate a user-supplied file URL + claimed MIME/size for document/KYC flows.
 * Uploads are currently URL-based (external hosting); we still enforce type/size/MIME.
 */
export function validateUpload(input: UploadValidationInput): UploadValidationResult {
  const kind = input.kind ?? "document";
  const allowed = kind === "kyc" ? ALLOWED_KYC_MIMES : ALLOWED_DOCUMENT_MIMES;
  const maxBytes = kind === "kyc" ? MAX_KYC_BYTES : MAX_DOCUMENT_BYTES;

  const fileUrl = sanitizeUrl(input.fileUrl);
  if (!fileUrl) {
    throw new AppError(
      "Invalid file URL. Only http(s) URLs are allowed.",
      400,
      "INVALID_FILE_URL",
    );
  }

  let mimeType = normalizeMime(input.mimeType);
  if (!mimeType) {
    const ext = extensionOf(fileUrl);
    mimeType = EXT_TO_MIME[ext] ?? null;
  }

  if (!mimeType || !allowed.has(mimeType)) {
    throw new AppError(
      `Unsupported file type${mimeType ? ` (${mimeType})` : ""}. Allowed: ${[...allowed].join(", ")}`,
      400,
      "INVALID_FILE_TYPE",
    );
  }

  // Extension must match claimed MIME when both are present (anti-spoof)
  const ext = extensionOf(fileUrl);
  const expectedMime = EXT_TO_MIME[ext];
  if (ext && expectedMime && expectedMime !== mimeType) {
    throw new AppError(
      "File extension does not match declared MIME type",
      400,
      "MIME_EXTENSION_MISMATCH",
    );
  }

  const fileSize: number | null =
    input.fileSize == null ? null : Number(input.fileSize);

  if (fileSize != null) {
    if (!Number.isFinite(fileSize) || fileSize < 0) {
      throw new AppError("Invalid file size", 400, "INVALID_FILE_SIZE");
    }
    if (fileSize > maxBytes) {
      throw new AppError(
        `File too large. Maximum size is ${Math.floor(maxBytes / (1024 * 1024))}MB`,
        400,
        "FILE_TOO_LARGE",
      );
    }
  }

  return { fileUrl, mimeType, fileSize };
}
