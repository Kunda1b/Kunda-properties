"use client";

import PropertyCard from "@/components/listings/PropertyCard";
import type { Property } from "@/types/property";

type ListingsExplorerProps = {
  properties: Property[];
};

export function ListingsExplorer({ properties }: ListingsExplorerProps) {
  if (!properties.length) {
    return (
      <div className="rounded-xl border border-gray-100 bg-white py-16 text-center text-sm text-gray-400">
        No listings found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
    </div>
  );
}
