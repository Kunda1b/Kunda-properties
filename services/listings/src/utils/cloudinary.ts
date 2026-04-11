import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { env, logger } from "@kunda/config";
import { unlink } from "node:fs/promises";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type UploadResult = {
  url: string;
  secureUrl: string;
  publicId: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
};

export type ImageVariants = {
  original: string;
  card: string;
  thumbnail: string;
  hero: string;
};

function buildVariants(publicId: string, cloudName: string): ImageVariants {
  const base = `https://res.cloudinary.com/${cloudName}/image/upload`;

  return {
    original: `${base}/${publicId}`,
    card: `${base}/c_fill,w_640,h_480,q_auto,f_auto/${publicId}`,
    thumbnail: `${base}/c_fill,w_400,h_300,q_auto,f_auto/${publicId}`,
    hero: `${base}/c_limit,w_1200,h_900,q_auto,f_auto/${publicId}`,
  };
}

export async function uploadListingPhoto(
  filePath: string,
  listingId: string,
  isPrimary = false,
): Promise<UploadResult> {
  if (env.NODE_ENV === "development" && !env.CLOUDINARY_CLOUD_NAME) {
    logger.info("Cloudinary upload skipped (not configured)", { listingId });
    const mockId = `kunda/listings/${listingId}/mock-${Date.now()}`;
    return {
      url: "https://placehold.co/1200x900/E1F5EE/0F6E56?text=Property+Photo",
      secureUrl: "https://placehold.co/1200x900/E1F5EE/0F6E56?text=Property+Photo",
      publicId: mockId,
      thumbnailUrl: "https://placehold.co/400x300/E1F5EE/0F6E56?text=Property",
      width: 1200,
      height: 900,
      format: "jpeg",
      bytes: 0,
    };
  }

  try {
    const result: UploadApiResponse = await cloudinary.uploader.upload(
      filePath,
      {
        folder: `kunda/listings/${listingId}`,
        use_filename: false,
        unique_filename: true,
        overwrite: false,
        resource_type: "image",
        transformation: [
          { width: 1200, height: 900, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
        tags: ["listing", listingId, isPrimary ? "primary" : "gallery"],
      },
    );

    const variants = buildVariants(
      result.public_id,
      env.CLOUDINARY_CLOUD_NAME!,
    );

    logger.info("Photo uploaded to Cloudinary", {
      listingId,
      publicId: result.public_id,
      bytes: result.bytes,
    });

    try {
      await unlink(filePath);
    } catch {
      logger.warn("Could not delete temp file", { filePath });
    }

    return {
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      thumbnailUrl: variants.thumbnail,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error: unknown) {
    logger.error("Cloudinary upload failed", {
      listingId,
      error: error instanceof Error ? error.message : "Unknown upload error",
    });

    try {
      await unlink(filePath);
    } catch {
      // ignore
    }

    throw new Error("UPLOAD_FAILED");
  }
}

export async function uploadListingPhotoFromBuffer(
  buffer: Buffer,
  listingId: string,
  filename: string,
): Promise<UploadResult> {
  if (env.NODE_ENV === "development" && !env.CLOUDINARY_CLOUD_NAME) {
    const mockId = `kunda/listings/${listingId}/mock-${Date.now()}`;
    return {
      url: "https://placehold.co/1200x900/E1F5EE/0F6E56?text=Property+Photo",
      secureUrl: "https://placehold.co/1200x900/E1F5EE/0F6E56?text=Property+Photo",
      publicId: mockId,
      thumbnailUrl: "https://placehold.co/400x300/E1F5EE/0F6E56?text=Property",
      width: 1200,
      height: 900,
      format: "jpeg",
      bytes: 0,
    };
  }

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `kunda/listings/${listingId}`,
        use_filename: false,
        unique_filename: true,
        resource_type: "image",
        transformation: [
          { width: 1200, height: 900, crop: "limit" },
          { quality: "auto" },
          { fetch_format: "auto" },
        ],
        tags: ["listing", listingId],
      },
      (error, result) => {
        if (error || !result) {
          logger.error("Cloudinary stream upload failed", {
            listingId,
            error,
          });
          reject(new Error("UPLOAD_FAILED"));
          return;
        }

        const variants = buildVariants(
          result.public_id,
          env.CLOUDINARY_CLOUD_NAME!,
        );

        resolve({
          url: result.url,
          secureUrl: result.secure_url,
          publicId: result.public_id,
          thumbnailUrl: variants.thumbnail,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
        });
      },
    );

    uploadStream.end(buffer);
  });
}

export async function deleteListingPhoto(publicId: string): Promise<void> {
  if (env.NODE_ENV === "development" && !env.CLOUDINARY_CLOUD_NAME) {
    logger.info("Cloudinary delete skipped (not configured)", { publicId });
    return;
  }

  try {
    await cloudinary.uploader.destroy(publicId);
    logger.info("Photo deleted from Cloudinary", { publicId });
  } catch (error: unknown) {
    logger.error("Cloudinary delete failed", {
      publicId,
      error: error instanceof Error ? error.message : "Unknown delete error",
    });
  }
}

export async function deleteListingFolder(listingId: string): Promise<void> {
  if (env.NODE_ENV === "development" && !env.CLOUDINARY_CLOUD_NAME) {
    return;
  }

  try {
    await cloudinary.api.delete_resources_by_prefix(
      `kunda/listings/${listingId}`,
    );
    logger.info("Listing folder deleted from Cloudinary", { listingId });
  } catch (error: unknown) {
    logger.error("Cloudinary folder delete failed", {
      listingId,
      error: error instanceof Error ? error.message : "Unknown delete error",
    });
  }
}

export function getImageVariants(publicId: string): ImageVariants {
  return buildVariants(publicId, env.CLOUDINARY_CLOUD_NAME || "demo");
}

export async function generateSignedUploadParams(
  listingId: string,
): Promise<{
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}> {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const folder = `kunda/listings/${listingId}`;

  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    env.CLOUDINARY_API_SECRET!,
  );

  return {
    signature,
    timestamp,
    apiKey: env.CLOUDINARY_API_KEY!,
    cloudName: env.CLOUDINARY_CLOUD_NAME!,
    folder,
  };
}

export function getPlaceholderUrl(type: string): string {
  const PLACEHOLDERS: Record<string, string> = {
    HOUSE: "https://res.cloudinary.com/kunda/image/upload/v1/placeholders/house.jpg",
    LAND: "https://res.cloudinary.com/kunda/image/upload/v1/placeholders/land.jpg",
    APARTMENT: "https://res.cloudinary.com/kunda/image/upload/v1/placeholders/apartment.jpg",
    COMMERCIAL: "https://res.cloudinary.com/kunda/image/upload/v1/placeholders/commercial.jpg",
  };

  return PLACEHOLDERS[type] ?? PLACEHOLDERS.HOUSE;
}
