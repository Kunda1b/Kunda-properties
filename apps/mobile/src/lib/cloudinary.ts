const cloudName = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "demo";
const uploadPreset =
  process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "kunda-agent";

export function createCloudinaryUploadTarget(folder = "agent-drafts") {
  return {
    cloudName,
    endpoint: `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    folder,
    uploadPreset,
  };
}
