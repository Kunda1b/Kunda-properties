"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Home } from "lucide-react";

const REGIONS = ["Banjul","Kanifing","Kololi","Serrekunda","Bakoteh","Bijilo","Brikama"];

export function HeroSection() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [type, setType] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (region) params.set("region", region);
    if (type) params.set("propertyType", type);
    router.push(`/listings?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[85vh] flex items-center bg-gradient-to-br from-kunda-950 via-kunda-800 to-kunda-700">
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8">
            <span className="text-xl">🇬🇲</span>
            <span className="text-white/90 text-sm font-medium">The Gambia's #1 Diaspora Property Platform</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold text-white leading-tight mb-6">
            Find Your<span className="block text-sand-300"> Home in The Gambia</span>
          </h1>
          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Verified listings, secure escrow, KYC-backed transactions. Buy property back home with confidence.
          </p>
          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-3 shadow-2xl flex flex-col md:flex-row gap-2">
            <div className="flex-1 flex items-center gap-3 px-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input type="text" placeholder="Search listings, areas..." value={query} onChange={(e) => setQuery(e.target.value)}
                className="flex-1 py-2 outline-none text-gray-900 placeholder:text-gray-400" />
            </div>
            <div className="flex items-center gap-2 px-3 border-l border-gray-100 md:w-48">
              <MapPin className="w-5 h-5 text-gray-400" />
              <select value={region} onChange={(e) => setRegion(e.target.value)} className="flex-1 py-2 outline-none text-gray-700 bg-transparent">
                <option value="">All Regions</option>
                {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2 px-3 border-l border-gray-100 md:w-44">
              <Home className="w-5 h-5 text-gray-400" />
              <select value={type} onChange={(e) => setType(e.target.value)} className="flex-1 py-2 outline-none text-gray-700 bg-transparent">
                <option value="">All Types</option>
                <option value="HOUSE">House</option><option value="VILLA">Villa</option>
                <option value="APARTMENT">Apartment</option><option value="LAND">Land</option>
              </select>
            </div>
            <button type="submit" className="btn-primary whitespace-nowrap">Search Properties</button>
          </form>
        </div>
      </div>
    </section>
  );
}
