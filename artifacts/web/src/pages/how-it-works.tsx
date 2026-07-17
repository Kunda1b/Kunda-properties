import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { Shield, Search, Handshake, DollarSign, CheckCircle, ArrowRight } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    number: "01",
    title: "Browse Verified Listings",
    desc: "Search properties across all six regions of The Gambia. Every listing is reviewed by our team before going live. Filter by type, price, region, and features like title deed availability.",
  },
  {
    icon: Shield,
    number: "02",
    title: "Verify Your Identity (KYC)",
    desc: "Complete a quick identity check using your passport or national ID. KYC protects all parties and is required before making offers. It takes less than 5 minutes.",
  },
  {
    icon: Handshake,
    number: "03",
    title: "Make an Offer",
    desc: "Submit an offer directly to the seller. Sellers can accept, reject, or counter. All communication is on-platform so there's a clear record.",
  },
  {
    icon: DollarSign,
    number: "04",
    title: "Fund Secure Escrow",
    desc: "Once your offer is accepted, funds are held in escrow — protected until you're satisfied. You get a 14-day inspection period to carry out due diligence.",
  },
  {
    icon: CheckCircle,
    number: "05",
    title: "Approve & Complete",
    desc: "Happy with the property? Approve the release and funds transfer to the seller. If there's an issue, raise a dispute and our team will mediate.",
  },
];

const FAQS = [
  {
    q: "Do I need to be in The Gambia to buy property?",
    a: "No. Kunda is built for the diaspora. You can browse, make offers, and complete transactions entirely online. We recommend engaging a local solicitor for final legal checks.",
  },
  {
    q: "What currencies are supported?",
    a: "Listings can be priced in GMD, USD, GBP, or EUR. Live exchange rates are shown so you can compare prices in your home currency.",
  },
  {
    q: "Is my money safe in escrow?",
    a: "Yes. Funds are held in a dedicated escrow account and never released to the seller until you explicitly approve the release (or the inspection period ends without a dispute).",
  },
  {
    q: "What is KYC and why is it required?",
    a: "Know Your Customer (KYC) is identity verification. It protects sellers from fraudulent offers and ensures all buyers on the platform are who they say they are.",
  },
  {
    q: "What if there's a dispute?",
    a: "Either party can raise a dispute during the escrow inspection period. Our team reviews the evidence within 48 hours and mediates a resolution.",
  },
  {
    q: "How much does Kunda charge?",
    a: "Buyers pay no platform fee. Sellers pay a small percentage of the transaction value at completion. The fee is shown transparently in the escrow breakdown before you commit.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-gradient-to-br from-kunda-950 to-kunda-700 text-white py-20 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <p className="text-sand-400 font-medium text-sm uppercase tracking-widest mb-4">How It Works</p>
            <h1 className="font-display text-5xl font-bold mb-6">Buy Gambian property<br />from anywhere in the world</h1>
            <p className="text-white/70 text-lg leading-relaxed">
              Kunda makes it simple, safe, and transparent. From browsing listings to releasing escrow — everything happens on one trusted platform.
            </p>
            <div className="flex flex-wrap gap-3 justify-center mt-8">
              <Link href="/listings" className="btn-primary bg-sand-400 hover:bg-sand-300 text-kunda-950">Browse Properties</Link>
              <Link href="/auth/register" className="border border-white/30 text-white hover:bg-white/10 rounded-xl px-5 py-3 font-medium text-sm transition-colors">Create Account</Link>
            </div>
          </div>
        </section>

        {/* Steps */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="space-y-12">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <div key={step.number} className="flex gap-8 items-start">
                    <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-kunda-50 flex items-center justify-center relative">
                      <Icon className="w-7 h-7 text-kunda-700" />
                      {i < STEPS.length - 1 && (
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-12 bg-kunda-100 mt-0" />
                      )}
                    </div>
                    <div className="pt-2">
                      <p className="text-xs font-bold text-kunda-400 tracking-widest uppercase mb-1">{step.number}</p>
                      <h3 className="font-display text-2xl font-bold text-gray-900 mb-3">{step.title}</h3>
                      <p className="text-gray-600 leading-relaxed max-w-xl">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Trust stats */}
        <section className="bg-kunda-50 py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { stat: "14 days", label: "Inspection period" },
                { stat: "48 hrs", label: "Dispute resolution" },
                { stat: "6 regions", label: "Coverage across Gambia" },
                { stat: "4 currencies", label: "GMD · USD · GBP · EUR" },
              ].map(({ stat, label }) => (
                <div key={stat}>
                  <p className="font-display text-3xl font-bold text-kunda-700">{stat}</p>
                  <p className="text-sm text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-3xl">
            <h2 className="font-display text-4xl font-bold text-gray-900 text-center mb-12">Frequently asked questions</h2>
            <div className="space-y-6">
              {FAQS.map(({ q, a }) => (
                <div key={q} className="border-b border-gray-100 pb-6">
                  <h3 className="font-display text-lg font-bold text-gray-900 mb-2">{q}</h3>
                  <p className="text-gray-600 leading-relaxed">{a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-kunda-950 text-white py-16 px-4 text-center">
          <h2 className="font-display text-3xl font-bold mb-4">Ready to find your plot?</h2>
          <p className="text-white/70 mb-8">Join thousands of diaspora Gambians buying property back home with confidence.</p>
          <Link href="/auth/register" className="btn-primary bg-sand-400 hover:bg-sand-300 text-kunda-950 inline-flex items-center gap-2">
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  );
}
