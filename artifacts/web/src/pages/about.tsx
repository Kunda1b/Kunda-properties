import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20">
        {/* Hero */}
        <section className="bg-gradient-to-br from-kunda-950 to-kunda-700 text-white py-20 px-4">
          <div className="container mx-auto max-w-3xl text-center">
            <p className="text-sand-400 font-medium text-sm uppercase tracking-widest mb-4">About Kunda</p>
            <h1 className="font-display text-5xl font-bold mb-6">Built for the diaspora,<br />by those who understand it</h1>
            <p className="text-white/70 text-lg leading-relaxed">
              <em>Kunda</em> means "home" in Mandinka. We're building the platform that makes it possible to buy, sell, and invest in Gambian real estate — from wherever you are in the world.
            </p>
          </div>
        </section>

        {/* Mission */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-4xl grid md:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-kunda-700 font-medium text-sm uppercase tracking-widest mb-4">Our Mission</p>
              <h2 className="font-display text-4xl font-bold text-gray-900 mb-6">Connecting diaspora to home, one property at a time</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                For millions of Gambians living abroad, owning land or a home back home is a deeply personal goal. But the process has long been opaque, risky, and difficult to navigate from a distance.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Kunda changes that. We verify listings, protect transactions with escrow, require identity verification, and give both buyers and sellers a clear paper trail at every step.
              </p>
              <p className="text-gray-600 leading-relaxed">
                Whether you're in the UK, US, Germany, or Sweden — you can browse, negotiate, and complete a property transaction in The Gambia with the same confidence you'd expect at home.
              </p>
            </div>
            <div className="space-y-4">
              {[
                { emoji: "🏠", title: "Verified listings", desc: "Every property reviewed before going live" },
                { emoji: "🔒", title: "Secure escrow", desc: "Funds protected until you approve release" },
                { emoji: "🪪", title: "KYC verified buyers", desc: "Identity checks protect all parties" },
                { emoji: "🌍", title: "Diaspora-first", desc: "Built for cross-border transactions" },
              ].map(({ emoji, title, desc }) => (
                <div key={title} className="flex items-start gap-4 bg-kunda-50 rounded-xl p-4">
                  <span className="text-2xl">{emoji}</span>
                  <div>
                    <p className="font-semibold text-gray-900">{title}</p>
                    <p className="text-sm text-gray-500">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-kunda-50 py-16 px-4 text-center">
          <h2 className="font-display text-3xl font-bold text-gray-900 mb-4">Ready to find your kunda?</h2>
          <p className="text-gray-500 mb-8">Browse verified properties across all six regions of The Gambia.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/listings" className="btn-primary inline-flex items-center gap-2">
              Browse Properties <ArrowRight className="w-4 h-4" />
            </Link>
            <Link href="/how-it-works" className="btn-outline inline-flex">How It Works</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
