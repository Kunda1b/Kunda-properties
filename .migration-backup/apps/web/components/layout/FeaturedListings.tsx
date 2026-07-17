"use client";
import { useQuery } from "@tanstack/react-query";
import { listingsApi } from "@/lib/api";
import { PropertyCard } from "@/components/ui/PropertyCard";
import Link from "next/link";
export function FeaturedListings() {
  const { data, isLoading } = useQuery({ queryKey: ["featured"], queryFn: () => listingsApi.featured().then((r) => r.data.data) });
  if (isLoading) return (
    <section className="py-20"><div className="container mx-auto px-4">
      <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-8" />
      <div className="grid md:grid-cols-3 gap-6">{[1,2,3].map((i) => <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl" />)}</div>
    </div></section>
  );
  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div><h2 className="section-title">Featured Properties</h2><p className="text-gray-500 mt-2">Hand-picked listings across The Gambia</p></div>
          <Link href="/listings" className="btn-outline hidden md:inline-flex">View all →</Link>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data?.slice(0, 8).map((l: any, i: number) => <PropertyCard key={l.id} listing={l} index={i} />)}
        </div>
      </div>
    </section>
  );
}
