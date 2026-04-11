export type UploadedFile = {
  file: File;
  base64: string;
  preview: string;
  sizeKB: number;
};

export async function fileToBase64(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(",")[1] ?? "");
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function fileToPreviewURL(file: File): string {
  return URL.createObjectURL(file);
}

export function validateDocumentFile(file: File): string | null {
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];
  const maxSizeMb = 5;

  if (!allowedTypes.includes(file.type)) {
    return "File must be a JPG, PNG, WebP, or PDF";
  }

  if (file.size > maxSizeMb * 1024 * 1024) {
    return `File must be smaller than ${maxSizeMb}MB`;
  }

  return null;
}

export function validateSelfieFile(file: File): string | null {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSizeMb = 3;

  if (!allowedTypes.includes(file.type)) {
    return "Selfie must be a JPG, PNG, or WebP image";
  }

  if (file.size > maxSizeMb * 1024 * 1024) {
    return `Selfie must be smaller than ${maxSizeMb}MB`;
  }

  return null;
}
