import Link from "next/link";
import HeroSearch from "@/components/listings/HeroSearch";
import PropertyCard from "@/components/listings/PropertyCard";
import { LISTINGS } from "@/lib/listings";

const FEATURED = LISTINGS.filter((listing) => listing.verified).slice(0, 3);

const STATS = [
  { value: "200K+", label: "Gambians in the diaspora" },
  { value: "$650M", label: "Remittances sent annually" },
  { value: "100%", label: "Verified listings" },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Browse verified properties",
    desc: "Every listing is manually reviewed. We check title documents, agent credentials, and boundaries.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    step: "02",
    title: "Verify your identity once",
    desc: "Quick KYC using your passport or national ID. Protects you and the seller in every transaction.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="3" y="5" width="18" height="14" rx="3" />
      </svg>
    ),
  },
  {
    step: "03",
    title: "Invest securely via escrow",
    desc: "Funds held safely until title is confirmed. Pay in GBP, EUR, or USD — we handle conversion.",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
        <rect x="2" y="6" width="20" height="14" rx="3" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
];

export default function HomePage() {
  return (
    <>
      {/* ─── Hero Section ─── */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute right-0 top-0 h-[600px] w-[600px] rounded-full bg-kunda-forest-soft/40 blur-3xl" />
          <div className="absolute -left-32 bottom-0 h-[400px] w-[400px] rounded-full bg-kunda-gold-soft/30 blur-3xl" />
        </div>

        <div className="mx-auto max-w-6xl px-5 pb-16 pt-20 text-center md:pt-28">
          <span className="badge badge-green mb-6 animate-fade-in">
            <span className="mr-1">🇬🇲</span>
            Built for the Gambian diaspora
          </span>

          <h1 className="mx-auto mb-5 max-w-3xl font-display text-4xl font-semibold leading-tight text-kunda-ink animate-slide-up md:text-5xl lg:text-6xl">
            Find your family&apos;s{" "}
            <span className="text-kunda-forest">next home</span>{" "}
            in The Gambia
          </h1>

          <p className="mx-auto mb-10 max-w-xl text-lg text-kunda-muted animate-slide-up">
            Browse verified properties, invest securely from abroad, and manage
            everything in one place — in your currency.
          </p>

          <div className="animate-slide-up">
            <HeroSearch />
          </div>
        </div>
      </section>

      {/* ─── Stats Strip ─── */}
      <section className="border-y border-kunda-border bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-3xl px-5 py-8">
          <div className="grid grid-cols-3 gap-6 text-center">
            {STATS.map((stat) => (
              <div key={stat.label}>
                <p className="mb-0.5 font-display text-2xl font-semibold text-kunda-forest md:text-3xl">
                  {stat.value}
                </p>
                <p className="text-xs text-kunda-muted md:text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Featured Listings ─── */}
      <section className="mx-auto max-w-6xl px-5 py-20">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <span className="badge badge-green mb-3">Featured</span>
            <h2 className="font-display text-2xl font-semibold text-kunda-ink md:text-3xl">
              Verified listings
            </h2>
            <p className="mt-1.5 text-sm text-kunda-muted">
              Properties reviewed and ready for diaspora buyers
            </p>
          </div>
          <Link
            href="/listings"
            className="btn-ghost text-kunda-forest font-semibold hidden sm:inline-flex"
          >
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURED.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link href="/listings" className="btn-secondary">
            View all listings →
          </Link>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="border-t border-kunda-border bg-white/40">
        <div className="mx-auto max-w-5xl px-5 py-20">
          <div className="mb-12 text-center">
            <span className="badge badge-gold mb-3">Process</span>
            <h2 className="font-display text-2xl font-semibold text-kunda-ink md:text-3xl">
              How Kunda works
            </h2>
            <p className="mt-2 text-sm text-kunda-muted">
              Three simple steps to buy property from abroad
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <div
                key={item.step}
                className="surface-card rounded-2xl p-6 transition-all duration-300 hover:shadow-card-hover hover:-translate-y-1"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-kunda-forest-soft text-kunda-forest">
                  {item.icon}
                </div>
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-kunda-muted">
                  Step {item.step}
                </span>
                <h3 className="mb-2 font-display text-lg font-semibold text-kunda-ink">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-kunda-muted">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Link href="/how-it-works" className="btn-secondary">
              Learn more about the process →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="mx-auto max-w-4xl px-5 py-20 text-center">
        <div className="surface-card rounded-3xl p-10 md:p-14">
          <h2 className="mb-3 font-display text-2xl font-semibold text-kunda-ink md:text-3xl">
            Ready to invest in The Gambia?
          </h2>
          <p className="mx-auto mb-8 max-w-lg text-sm text-kunda-muted">
            Join thousands of Gambians in the diaspora who are investing back home.
            Browse verified listings or create your free account to get started.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/listings" className="btn-primary">
              Browse listings
            </Link>
            <Link href="/auth/register" className="btn-secondary">
              Create free account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
