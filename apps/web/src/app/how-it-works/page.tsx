import Link from "next/link";

const STEPS = [
  {
    number: "01",
    title: "Browse verified listings",
    description:
      "Every property on Kunda goes through a manual verification process before it is published. We check title documents, confirm agent credentials, and validate property boundaries. You see only properties we have reviewed.",
    detail:
      "Filter by type, location, and price. Save properties you like to your dashboard and come back to them any time.",
    color: "text-kunda-forest",
    bg: "bg-kunda-forest-soft",
  },
  {
    number: "02",
    title: "Verify your identity once",
    description:
      "Before you can make an offer or move money, we verify your identity using your passport or national ID. This protects both you and the seller, and ensures every transaction on the platform is traceable and legal.",
    detail:
      "The verification process takes less than 5 minutes and is powered by Smile Identity, which supports all West African and European ID documents.",
    color: "text-kunda-gold",
    bg: "bg-kunda-gold-soft",
  },
  {
    number: "03",
    title: "Make an offer and fund escrow",
    description:
      "When you find a property you want to buy, your funds go into a secure escrow account — not directly to the seller. The money is only released once title documents are confirmed and both parties sign the sale agreement.",
    detail:
      "Pay in GBP, EUR, or USD from the UK, Europe, or the US. We handle the currency conversion and transfer to GMD automatically.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    number: "04",
    title: "Sign documents digitally",
    description:
      "All sale agreements are generated from legally reviewed templates and signed digitally by both parties. You never need to be physically present in The Gambia to complete a purchase.",
    detail:
      "Documents are stored permanently on your Kunda account and can be downloaded at any time. A PDF copy is emailed to all parties upon completion.",
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
];

const FAQS = [
  {
    q: "Do I need to travel to The Gambia to buy a property?",
    a: "No. The entire process — from browsing to signing — can be completed online. Many diaspora buyers complete their first purchase without visiting. That said, we encourage a site visit before committing if you can arrange one.",
  },
  {
    q: "What currencies can I pay in?",
    a: "We accept GBP, EUR, and USD for diaspora buyers. The equivalent GMD amount is confirmed at the time of escrow funding. Exchange rates are locked at the point of payment to protect both parties.",
  },
  {
    q: "How does Kunda protect me from property fraud?",
    a: "Every listing is manually reviewed by our team before publication. We verify title documents, agent credentials, and property boundaries. Funds are held in escrow and only released after title confirmation — you never pay money directly to a seller before ownership is legally transferred.",
  },
  {
    q: "What happens if a deal falls through?",
    a: "If a transaction does not complete — due to a failed title check, a seller pulling out, or any other reason — your escrowed funds are returned in full within 5 business days. No fees are charged on failed transactions.",
  },
  {
    q: "Can I list my property on Kunda?",
    a: "Yes. Registered agents can list properties after completing our agent verification process. Private sellers can also list directly by applying for a seller account. All listings go through our review process before going live.",
  },
  {
    q: "Is Kunda registered in The Gambia?",
    a: "Yes. Kunda Properties is registered with the Gambia Revenue Authority and complies with Gambian property law. Our sale agreement templates have been reviewed by a Gambian property law advisor.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      {/* Hero */}
      <section className="border-b border-kunda-border bg-white/40">
        <div className="mx-auto max-w-3xl px-5 pb-14 pt-16 text-center">
          <span className="badge badge-green mb-5">How it works</span>
          <h1 className="mb-4 font-display text-4xl font-semibold text-kunda-ink md:text-5xl">
            Buy Gambian property
            <br />
            from anywhere in the world
          </h1>
          <p className="mx-auto max-w-xl text-lg text-kunda-muted">
            Kunda was built specifically for diaspora buyers. Every step of the
            process is designed to work across borders, currencies, and time zones.
          </p>
        </div>
      </section>

      {/* Steps */}
      <section className="mx-auto max-w-4xl px-5 py-16">
        <div className="space-y-6">
          {STEPS.map((step) => (
            <div
              key={step.number}
              className="surface-card flex flex-col gap-6 rounded-2xl p-8 transition-shadow hover:shadow-card-hover md:flex-row"
            >
              <div className="shrink-0">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-2xl ${step.bg} ${step.color} text-xl font-bold`}
                >
                  {step.number}
                </div>
              </div>
              <div className="flex-1">
                <h2 className="mb-2 font-display text-xl font-semibold text-kunda-ink">
                  {step.title}
                </h2>
                <p className="mb-3 text-sm leading-relaxed text-kunda-muted">
                  {step.description}
                </p>
                <p className={`text-sm leading-relaxed font-medium ${step.color}`}>
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-kunda-border bg-white/40">
        <div className="mx-auto max-w-3xl px-5 py-16">
          <div className="mb-10 text-center">
            <h2 className="font-display text-2xl font-semibold text-kunda-ink md:text-3xl">
              Frequently asked questions
            </h2>
            <p className="mt-2 text-sm text-kunda-muted">
              Still have questions?{" "}
              <a
                href="mailto:hello@kundaproperties.gm"
                className="text-kunda-forest font-medium hover:underline"
              >
                Email us
              </a>
            </p>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq) => (
              <div
                key={faq.q}
                className="surface-card rounded-xl p-6 transition-shadow hover:shadow-card"
              >
                <h3 className="mb-2 font-semibold text-kunda-ink">{faq.q}</h3>
                <p className="text-sm leading-relaxed text-kunda-muted">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-2xl px-5 py-16 text-center">
        <h2 className="mb-3 font-display text-2xl font-semibold text-kunda-ink">
          Ready to find your property?
        </h2>
        <p className="mb-8 text-sm text-kunda-muted">
          Join thousands of Gambians in the diaspora who are investing back home
          through Kunda.
        </p>
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/listings" className="btn-primary">
            Browse listings
          </Link>
          <Link href="/auth/register" className="btn-secondary">
            Create an account
          </Link>
        </div>
      </section>
    </>
  );
}
