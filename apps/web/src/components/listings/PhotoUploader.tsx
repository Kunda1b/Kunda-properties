"use client";

import { useRef, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { validateDocumentFile } from "@/lib/upload";
import PhotoLightbox from "./PhotoLightbox";
import { usePhotoUpload } from "@/hooks/use-photo-upload";

type SortablePhotoProps = {
  photo: {
    id?: string;
    url: string;
    uploading?: boolean;
    error?: string;
    isPrimary?: boolean;
  };
  index: number;
  total: number;
  onRemove: (index: number) => void;
  onRetry: (index: number) => void;
  onSetPrimary: (index: number) => void;
  onPreview: (index: number) => void;
  onMoveUp?: (index: number) => void;
  onMoveDown?: (index: number) => void;
};

function SortablePhoto({
  photo,
  index,
  total,
  onRemove,
  onRetry,
  onSetPrimary,
  onPreview,
  onMoveUp,
  onMoveDown,
}: SortablePhotoProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: photo.id ?? `local-${index}` });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative rounded-xl overflow-hidden border-2 bg-gray-50 aspect-square ${
        isDragging ? "border-dashed border-gray-300" : "border-gray-100"
      }`}
    >
      <img
        src={photo.url}
        alt={`Photo ${index + 1}`}
        className="w-full h-full object-cover cursor-pointer"
        onClick={() => !photo.uploading && onPreview(index)}
      />

      {/* Upload spinner */}
      {photo.uploading && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex flex-col items-center justify-center gap-2">
          <div className="w-7 h-7 rounded-full border-2 border-gray-200 border-t-kunda-forest animate-spin" />
          <p className="text-xs text-gray-400">Uploading...</p>
        </div>
      )}

      {/* Error state */}
      {photo.error && (
        <div className="absolute inset-0 bg-red-50 bg-opacity-90 flex flex-col items-center justify-center p-2 gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="#dc2626" strokeWidth="1.8" />
            <path d="M12 8v4M12 16h.01" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <p className="text-xs text-red-600 text-center leading-tight">
            {photo.error}
          </p>
          <button
            type="button"
            onClick={() => onRetry(index)}
            className="text-xs font-medium text-red-600 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Controls — visible on hover */}
      {!photo.uploading && !photo.error && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
          {/* Cover badge */}
          {photo.isPrimary && (
            <span
              className="absolute top-1.5 left-1.5 rounded-full px-1.5 py-0.5 text-[9px] font-semibold text-white"
              style={{ backgroundColor: "var(--kunda-green)" }}
            >
              Cover
            </span>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-between">
            {/* Mobile: up/down buttons */}
            {onMoveUp && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveUp(index);
                }}
                disabled={index === 0}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white bg-opacity-80 text-gray-600 transition-colors hover:bg-white disabled:opacity-30"
                aria-label="Move up"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M18 15l-6-6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            )}

            {onMoveDown && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveDown(index);
                }}
                disabled={index === total - 1}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white bg-opacity-80 text-gray-600 transition-colors hover:bg-white disabled:opacity-30"
                aria-label="Move down"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </button>
            )}

            {/* Right-side buttons */}
            <div className="flex items-center gap-1 ml-auto">
              {/* Set as cover */}
              {!photo.isPrimary && photo.id && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetPrimary(index);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-lg bg-white bg-opacity-80 text-gray-600 transition-colors hover:bg-white"
                  title="Set as cover"
                  aria-label="Set as cover"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                      fill={photo.isPrimary ? "#0F6E56" : "none"}
                      stroke="#0F6E56"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              )}

              {/* Delete */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(index);
                }}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white bg-opacity-80 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-500"
                aria-label="Remove photo"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Drag handle label */}
          <p className="text-[9px] text-white opacity-70 text-center mt-1">
            Drag to reorder
          </p>
        </div>
      )}

      {/* Drag handle (always visible, more prominent on touch) */}
      {!photo.uploading && !photo.error && (
        <div
          {...attributes}
          {...listeners}
          className="absolute top-1.5 right-1.5 h-7 w-7 flex items-center justify-center rounded-lg bg-black bg-opacity-30 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing touch-none"
          aria-label="Drag to reorder"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <circle cx="9" cy="6" r="1.5" fill="white" />
            <circle cx="15" cy="6" r="1.5" fill="white" />
            <circle cx="9" cy="12" r="1.5" fill="white" />
            <circle cx="15" cy="12" r="1.5" fill="white" />
            <circle cx="9" cy="18" r="1.5" fill="white" />
            <circle cx="15" cy="18" r="1.5" fill="white" />
          </svg>
        </div>
      )}
    </div>
  );
}

type Props = {
  listingId: string;
  initialPhotos?: Array<{
    id: string;
    url: string;
    publicId: string;
    isPrimary: boolean;
  }>;
  onPhotosChange?: (
    photos: Array<{
      id?: string;
      url: string;
      publicId?: string;
      isPrimary?: boolean;
    }>,
  ) => void;
  maxPhotos?: number;
};

export default function PhotoUploader({
  listingId,
  initialPhotos = [],
  onPhotosChange,
  maxPhotos = 10,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
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
  } = usePhotoUpload({
    listingId,
    maxPhotos,
    onPhotosChange,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = photos.findIndex(
        (p) => (p.id ?? `local-${photos.indexOf(p)}`) === active.id,
      );
      const newIndex = photos.findIndex(
        (p) => (p.id ?? `local-${photos.indexOf(p)}`) === over.id,
      );

      if (oldIndex !== -1 && newIndex !== -1) {
        reorderPhotos(oldIndex, newIndex);
      }
    },
    [photos, reorderPhotos],
  );

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files) return;
      const valid = Array.from(files).filter((f) => !validateDocumentFile(f));
      addFiles(valid);
    },
    [addFiles],
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFiles(e.target.files);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [handleFiles],
  );

  const moveUp = useCallback(
    (index: number) => {
      if (index > 0) reorderPhotos(index, index - 1);
    },
    [reorderPhotos],
  );

  const moveDown = useCallback(
    (index: number) => {
      if (index < photos.length - 1) reorderPhotos(index, index + 1);
    },
    [photos.length, reorderPhotos],
  );

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      {canAddMore && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
          }}
          onDrop={(e) => {
            e.preventDefault();
            handleFiles(e.dataTransfer.files);
          }}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-kunda-border rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-kunda-forest hover:bg-kunda-forest-soft"
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: "var(--kunda-forest-soft)" }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect
                x="3"
                y="3"
                width="18"
                height="18"
                rx="2"
                stroke="#0F6E56"
                strokeWidth="1.8"
              />
              <circle cx="8.5" cy="8.5" r="1.5" stroke="#0F6E56" strokeWidth="1.8" />
              <path
                d="M21 15l-5-5L5 21"
                stroke="#0F6E56"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="text-sm font-semibold text-kunda-ink mb-1">
            Add property photos
          </p>
          <p className="text-xs text-kunda-muted">
            Drag and drop or click to browse · JPG, PNG, WebP ·{" "}
            {maxPhotos - photos.length} remaining
          </p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleFileInput}
        className="hidden"
        aria-label="Upload photos"
      />

      {/* Photo grid with drag-to-reorder */}
      {photos.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={photos.map((p, i) => p.id ?? `local-${i}`)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {photos.map((photo, i) => (
                <SortablePhoto
                  key={(photo.id ?? `local-${i}`)}
                  photo={photo}
                  index={i}
                  total={photos.length}
                  onRemove={removePhoto}
                  onRetry={retryUpload}
                  onSetPrimary={setPrimary}
                  onPreview={openLightbox}
                  onMoveUp={moveUp}
                  onMoveDown={moveDown}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Footer hint */}
      {photos.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-kunda-muted">
            {photos.length} / {maxPhotos} photos
            {photos.some((p) => p.isPrimary) && (
              <span className="ml-2">
                · First photo is the{" "}
                <span
                  className="font-medium"
                  style={{ color: "var(--kunda-forest)" }}
                >
                  cover image
                </span>
              </span>
            )}
          </p>
          <p className="text-xs text-kunda-muted">
            {photos.length > 1 ? "Drag photos to reorder" : "Add more to reorder"}
          </p>
        </div>
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={photos}
          currentIndex={lightboxIndex}
          onClose={closeLightbox}
          onPrev={prevLightbox}
          onNext={nextLightbox}
        />
      )}
    </div>
  );
}
