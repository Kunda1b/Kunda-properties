import Image from "next/image";
import type { PropertyListing } from "@kunda/types";

type PropertyGalleryProps = {
  property: PropertyListing;
};

export function PropertyGallery({ property }: PropertyGalleryProps) {
  const [heroImage, ...supportingImages] = property.gallery;

  return (
    <section className="grid gap-4 lg:grid-cols-[1.45fr_0.8fr]">
      <div className="relative min-h-[420px] overflow-hidden rounded-[32px] shadow-soft">
        {heroImage ? (
          <Image
            src={heroImage}
            alt={property.title}
            fill
            priority
            sizes="(min-width: 1280px) 60vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-kunda-forest-soft" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-2">
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-kunda-forest">
            {property.verified ? "Verified title" : "Title review pending"}
          </span>
          <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-kunda-ink">
            {property.completion}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        {supportingImages.slice(0, 3).map((image, index) => (
          <div
            key={`${property.id}-${index}`}
            className="relative min-h-[128px] overflow-hidden rounded-[26px] shadow-soft"
          >
            <Image
              src={image}
              alt={`${property.title} photo ${index + 2}`}
              fill
              sizes="(min-width: 1024px) 25vw, 33vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
