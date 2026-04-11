"use client";

import { useState, useCallback, type SetStateAction } from "react";

export type Photo = {
  id?: string;
  url: string;
  publicId?: string;
  file?: File;
  uploading?: boolean;
  error?: string;
  isPrimary?: boolean;
};

type UsePhotoUploadOptions = {
  listingId: string;
  maxPhotos?: number;
  onPhotosChange?: (photos: Photo[]) => void;
};

type UploadSignature = {
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
};

type CloudinaryUploadResult = {
  public_id: string;
  secure_url: string;
};

const API_BASE =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000")
    : "http://localhost:4000";

export function usePhotoUpload({
  listingId,
  maxPhotos = 10,
  onPhotosChange,
}: UsePhotoUploadOptions) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const notify = useCallback(
    (next: SetStateAction<Photo[]>) => {
      setPhotos((current) => {
        const resolved =
          typeof next === "function"
            ? (next as (previous: Photo[]) => Photo[])(current)
            : next;
        onPhotosChange?.(resolved);
        return resolved;
      });
    },
    [onPhotosChange],
  );

  const uploadPhoto = useCallback(
    async (file: File): Promise<Photo> => {
      const token = localStorage.getItem("kunda_access_token");

      let signatureData: UploadSignature | null = null;

      try {
        const sigRes = await fetch(
          `${API_BASE}/api/listings/${listingId}/upload-signature`,
          {
            headers: {
              Authorization: `Bearer ${token ?? ""}`,
            },
          },
        );
        if (!sigRes.ok) throw new Error("Failed to get upload signature");
        const sigJson = (await sigRes.json()) as {
          data?: UploadSignature;
          error?: string;
        };
        signatureData = sigJson.data ?? null;
      } catch {
        throw new Error("Upload signature unavailable");
      }

      if (!signatureData) {
        throw new Error("Upload signature unavailable");
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", signatureData.apiKey);
      formData.append("timestamp", String(signatureData.timestamp));
      formData.append("signature", signatureData.signature);
      formData.append("folder", signatureData.folder);

      let uploadResult: CloudinaryUploadResult | null = null;

      try {
        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${signatureData.cloudName}/image/upload`,
          { method: "POST", body: formData },
        );
        if (!uploadRes.ok) {
          const errData = (await uploadRes.json()) as { error?: { message?: string } };
          throw new Error(errData.error?.message ?? "Upload failed");
        }
        uploadResult = (await uploadRes.json()) as CloudinaryUploadResult;
      } catch {
        throw new Error("Cloudinary upload failed");
      }

      if (!uploadResult) throw new Error("Cloudinary upload failed");

      let photoId: string | undefined;

      try {
        const photoRes = await fetch(
          `${API_BASE}/api/listings/${listingId}/photos/register`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token ?? ""}`,
            },
            body: JSON.stringify({
              publicId: uploadResult.public_id,
              url: uploadResult.secure_url,
              isPrimary: photos.length === 0,
            }),
          },
        );
        if (!photoRes.ok) {
          const errData = (await photoRes.json()) as { error?: string };
          throw new Error(errData.error ?? "Failed to register photo");
        }
        const photoJson = (await photoRes.json()) as {
          data?: { photo?: { id?: string } };
        };
        photoId = photoJson.data?.photo?.id;
      } catch {
        throw new Error("Failed to register photo");
      }

      return {
        id: photoId,
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        uploading: false,
      };
    },
    [listingId, photos.length],
  );

  const addFiles = useCallback(
    async (files: File[]) => {
      const remaining = maxPhotos - photos.length;
      const toAdd = files.slice(0, remaining);
      if (!toAdd.length) return;

      const placeholderPhotos = toAdd.map((file, i) => ({
        url: URL.createObjectURL(file),
        file,
        uploading: true as const,
        error: undefined as string | undefined,
        isPrimary: photos.length + i === 0,
      }));

      notify([...photos, ...placeholderPhotos]);

      await Promise.allSettled(
        toAdd.map(async (file, i) => {
          try {
            const uploaded = await uploadPhoto(file);
            const newIndex = photos.length + i;
            notify((prev) =>
              prev.map((p, idx) =>
                idx === newIndex ? { ...uploaded, isPrimary: newIndex === 0 } : p,
              ),
            );
          } catch (err) {
            const newIndex = photos.length + i;
            notify((prev) =>
              prev.map((p, idx) =>
                idx === newIndex
                  ? {
                      ...p,
                      uploading: false,
                      error:
                        err instanceof Error
                          ? err.message
                          : "Upload failed — try again",
                    }
                  : p,
              ),
            );
          }
        }),
      );
    },
    [photos, maxPhotos, notify, uploadPhoto],
  );

  const removePhoto = useCallback(
    async (index: number) => {
      const photo = photos[index];
      if (!photo) return;

      if (photo.id && photo.publicId) {
        try {
          const token = localStorage.getItem("kunda_access_token");
          await fetch(
            `${API_BASE}/api/listings/${listingId}/photos/${photo.id}`,
            {
              method: "DELETE",
              headers: {
                Authorization: `Bearer ${token ?? ""}`,
              },
            },
          );
        } catch {
          // continue even if delete fails
        }
      }

      notify(photos.filter((_, i) => i !== index));
    },
    [photos, listingId, notify],
  );

  const reorderPhotos = useCallback(
    async (from: number, to: number) => {
      const next = [...photos];
      const [moved] = next.splice(from, 1);
      if (!moved) {
        return;
      }
      next.splice(to, 0, moved);

      const newIsPrimary = next.map((p, i) => ({ ...p, isPrimary: i === 0 }));
      notify(newIsPrimary);

      const orderedIds = newIsPrimary
        .filter((p) => p.id)
        .map((p) => p.id as string);

      if (!orderedIds.length) return;

      try {
        const token = localStorage.getItem("kunda_access_token");
        await fetch(`${API_BASE}/api/listings/${listingId}/photos/reorder`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token ?? ""}`,
          },
          body: JSON.stringify({ orderedIds }),
        });
      } catch {
        // revert on failure
        notify(photos);
      }
    },
    [photos, listingId, notify],
  );

  const setPrimary = useCallback(
    async (index: number) => {
      const photo = photos[index];
      if (!photo?.id) return;

      const next = photos.map((p, i) => ({ ...p, isPrimary: i === index }));
      notify(next);

      try {
        const token = localStorage.getItem("kunda_access_token");
        await fetch(
          `${API_BASE}/api/listings/${listingId}/photos/${photo.id}/set-primary`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token ?? ""}`,
            },
          },
        );
      } catch {
        notify(photos);
      }
    },
    [photos, listingId, notify],
  );

  const retryUpload = useCallback(
    async (index: number) => {
      const photo = photos[index];
      if (!photo?.file) return;

      notify(
        photos.map((p, i) =>
          i === index ? { ...p, uploading: true, error: undefined } : p,
        ),
      );

      try {
        const uploaded = await uploadPhoto(photo.file);
        notify((prev) =>
          prev.map((p, i) =>
            i === index ? { ...uploaded, isPrimary: index === 0 } : p,
          ),
        );
      } catch (err) {
        notify((prev) =>
          prev.map((p, i) =>
            i === index
              ? {
                  ...p,
                  uploading: false,
                  error:
                    err instanceof Error ? err.message : "Upload failed",
                }
              : p,
          ),
        );
      }
    },
    [photos, uploadPhoto, notify],
  );

  const openLightbox = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  const closeLightbox = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  const prevLightbox = useCallback(() => {
    setLightboxIndex((i) =>
      i !== null ? (i - 1 + photos.length) % photos.length : null,
    );
  }, [photos.length]);

  const nextLightbox = useCallback(() => {
    setLightboxIndex((i) =>
      i !== null ? (i + 1) % photos.length : null,
    );
  }, [photos.length]);

  const canAddMore = photos.length < maxPhotos;

  return {
    photos,
    lightboxIndex,
    canAddMore,
    addFiles,
    removePhoto,
    reorderPhotos,
    setPrimary,
    retryUpload,
    openLightbox,
    closeLightbox,
    prevLightbox,
    nextLightbox,
  };
}
