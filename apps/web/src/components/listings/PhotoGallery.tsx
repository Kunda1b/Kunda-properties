"use client";

import { useState } from "react";

type Photo = {
  url: string;
  alt: string;
};

export default function PhotoGallery({
  photos,
  title,
}: {
  photos: Photo[];
  title: string;
}) {
  const [active, setActive] = useState(0);
  const [lightbox, setLightbox] = useState(false);

  if (photos.length === 0) {
    return (
      <div
        className="flex h-72 w-full items-center justify-center rounded-2xl md:h-96"
        style={{ backgroundColor: "var(--kunda-green-light)" }}
      >
        <div className="text-center">
          <div className="mb-3 text-6xl opacity-20">🏠</div>
          <p className="text-sm text-gray-400">No photos available</p>
        </div>
      </div>
    );
  }

  const activePhoto = photos[active] ?? photos[0]!;

  return (
    <>
      <div className="space-y-2">
        <div
          className="relative h-72 w-full cursor-zoom-in overflow-hidden rounded-2xl bg-gray-100 md:h-96"
          onClick={() => setLightbox(true)}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter") setLightbox(true);
          }}
        >
          <img
            src={activePhoto.url}
            alt={activePhoto.alt}
            className="h-full w-full object-cover transition-opacity duration-300"
          />
          <div className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
            {active + 1} / {photos.length}
          </div>
          <div className="absolute inset-0 flex items-center justify-between px-3 opacity-0 transition-opacity hover:opacity-100">
            {active > 0 && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setActive(active - 1);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition-colors hover:bg-white"
                aria-label="Previous photo"
              >
                ‹
              </button>
            )}
            {active < photos.length - 1 && (
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setActive(active + 1);
                }}
                className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow transition-colors hover:bg-white"
                aria-label="Next photo"
              >
                ›
              </button>
            )}
          </div>
        </div>

        {photos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {photos.map((photo, index) => (
              <button
                key={photo.url}
                onClick={() => setActive(index)}
                className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg transition-all"
                style={{
                  outline:
                    index === active
                      ? "2px solid var(--kunda-green)"
                      : "2px solid transparent",
                  outlineOffset: "2px",
                }}
                aria-label={`Photo ${index + 1} of ${title}`}
              >
                <img
                  src={photo.url}
                  alt={photo.alt}
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(false)}
        >
          <button
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-3xl text-white transition-colors hover:bg-white/20"
            onClick={() => setLightbox(false)}
            aria-label="Close photo preview"
          >
            ×
          </button>
          <img
            src={activePhoto.url}
            alt={activePhoto.alt}
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
