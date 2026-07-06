import { Suspense } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/layout/HeroSection";
import { FeaturedListings } from "@/components/layout/FeaturedListings";
import { HowItWorks } from "@/components/layout/HowItWorks";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main>
        <HeroSection />
        <Suspense fallback={<div className="h-96 animate-pulse bg-gray-50" />}>
          <FeaturedListings />
        </Suspense>
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
}
