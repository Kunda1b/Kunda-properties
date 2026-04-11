import PropertyCard from "@/components/listings/PropertyCard";
import type { Property } from "@/types/property";

type FeaturedListingsProps = {
  listings: Property[];
};

export function FeaturedListings({ listings }: FeaturedListingsProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Featured listings</h2>
        <span className="text-sm text-gray-400">{listings.length} properties</span>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {listings.map((property) => (
          <PropertyCard key={property.id} property={property} />
        ))}
      </div>
    </section>
  );
}
