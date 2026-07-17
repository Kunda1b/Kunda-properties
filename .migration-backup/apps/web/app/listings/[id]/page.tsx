import { notFound } from "next/navigation";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

async function getListing(id: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"}/api/listings/${id}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()).data;
  } catch { return null; }
}

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const listing = await getListing(params.id);
  if (!listing) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="pt-24 container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
          <h1 className="font-display text-3xl font-bold text-gray-900">{listing.title}</h1>
          <p className="text-gray-500 mt-2">{listing.address}, {listing.region}</p>
          <p className="text-2xl font-bold text-kunda-700 mt-4">{listing.currency} {Number(listing.price).toLocaleString()}</p>
          <p className="text-gray-600 mt-6 leading-relaxed whitespace-pre-line">{listing.description}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
