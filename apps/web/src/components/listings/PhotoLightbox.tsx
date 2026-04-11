"use client";

import { useEffect, useCallback } from "react";
import type { Photo } from "@/hooks/use-photo-upload";

type Props = {
  photos: Photo[];
  currentIndex: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export default function PhotoLightbox({
  photos,
  currentIndex,
  onClose,
  onPrev,
  onNext,
}: Props) {
  const current = photos[currentIndex];

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    },
    [onClose, onPrev, onNext],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [handleKey]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Photo lightbox"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 shrink-0">
        <p className="text-sm font-medium text-white opacity-70">
          {currentIndex + 1} / {photos.length}
          {current.isPrimary && (
            <span
              className="ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
              style={{
                backgroundColor: "var(--kunda-green)",
                color: "white",
              }}
            >
              Cover
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full text-white opacity-70 transition-opacity hover:opacity-100"
          aria-label="Close lightbox"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M18 6L6 18M6 6l12 12"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Image */}
      <div
        className="flex flex-1 items-center justify-center p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={current.url}
          alt={`Photo ${currentIndex + 1}`}
          className="max-h-full max-w-full object-contain rounded-xl shadow-2xl"
          style={{ maxHeight: "calc(100vh - 160px)" }}
        />
      </div>

      {/* Navigation */}
      {photos.length > 1 && (
        <div className="flex items-center justify-between px-6 pb-8 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white border-opacity-20 text-white transition-all hover:border-opacity-40"
            aria-label="Previous photo"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M15 18l-6-6 6-6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* Thumbnail strip */}
          <div className="flex gap-2 overflow-x-auto max-w-xs">
            {photos.map((photo, i) => (
              <button
                key={i}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  // Navigate by calling prev/next
                  const diff = i - currentIndex;
                  if (diff > 0) {
                    for (let d = 0; d < diff; d++) onNext();
                  } else if (diff < 0) {
                    for (let d = 0; d < -diff; d++) onPrev();
                  }
                }}
                className="relative shrink-0 rounded-lg overflow-hidden border-2 transition-all"
                style={{
                  borderColor:
                    i === currentIndex
                      ? "var(--kunda-green)"
                      : "transparent",
                  opacity: i === currentIndex ? 1 : 0.6,
                }}
              >
                <img
                  src={photo.url}
                  alt={`Thumbnail ${i + 1}`}
                  className="w-14 h-14 object-cover"
                />
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white border-opacity-20 text-white transition-all hover:border-opacity-40"
            aria-label="Next photo"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 18l6-6-6-6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
