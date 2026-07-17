import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ListingsGrid } from "@/components/listings/ListingsGrid";

export default function ListingsPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24">
        <div className="container mx-auto px-4 py-8">
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Properties in The Gambia</h1>
          <Suspense fallback={
            <div className="grid md:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => <div key={i} className="h-80 bg-gray-100 animate-pulse rounded-2xl" />)}
            </div>
          }>
            <ListingsGrid searchParams={searchParams} />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
