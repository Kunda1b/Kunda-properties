import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    body: `By creating an account or using the Kunda platform, you agree to these Terms of Service. If you do not agree, do not use the platform.`,
  },
  {
    title: "2. Eligibility",
    body: `You must be at least 18 years old and legally able to enter contracts in your jurisdiction. You must provide accurate registration information and complete identity verification (KYC) before participating in transactions.`,
  },
  {
    title: "3. Listings",
    body: `Sellers are responsible for the accuracy of their listings. Kunda reviews all submissions but does not guarantee title, legal compliance, or physical condition of any property. Misrepresentation may result in account suspension and legal liability.`,
  },
  {
    title: "4. Offers and Transactions",
    body: `Making an offer is a binding expression of intent. Accepting an offer creates a contractual obligation. Kunda facilitates the transaction but is not a party to the sale contract between buyer and seller. You are strongly advised to engage an independent Gambian solicitor for all conveyancing.`,
  },
  {
    title: "5. Escrow",
    body: `Funds held in escrow are managed by Kunda on behalf of both parties. Escrow is released only upon buyer approval or expiry of the inspection period without a raised dispute. Platform fees are deducted from the seller payout. Kunda reserves the right to mediate disputes and decisions are binding on the platform.`,
  },
  {
    title: "6. KYC and Compliance",
    body: `We are obligated to comply with The Gambia's anti-money laundering and counter-terrorist financing regulations. You must complete KYC verification to participate in transactions. We may suspend or terminate accounts where we have compliance concerns.`,
  },
  {
    title: "7. Prohibited Conduct",
    body: `You may not: list fraudulent properties; impersonate others; use the platform for money laundering; circumvent escrow; manipulate pricing; or engage in any unlawful activity. Violations result in immediate account termination and may be reported to authorities.`,
  },
  {
    title: "8. Fees",
    body: `Buyers pay no platform fee. Sellers are charged a transaction fee (shown in the escrow breakdown before commitment). Fees are subject to change with 30 days' notice to registered users.`,
  },
  {
    title: "9. Limitation of Liability",
    body: `To the maximum extent permitted by law, Kunda's liability is limited to the platform fees paid by you in the 12 months preceding the claim. We are not liable for property defects, failed transactions between parties, or losses arising from your use of the platform.`,
  },
  {
    title: "10. Governing Law",
    body: `These Terms are governed by the laws of The Republic of The Gambia. Disputes shall be resolved by the courts of Banjul, The Gambia, except where local consumer protection laws require otherwise.`,
  },
  {
    title: "11. Changes",
    body: `We may update these Terms. Material changes will be communicated 14 days in advance. Continued use of the platform after that constitutes acceptance.`,
  },
  {
    title: "12. Contact",
    body: `For legal queries, contact legal@kunda.gm or Kunda Properties Ltd, Banjul, The Gambia.`,
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="pt-20">
        <section className="bg-kunda-950 text-white py-16 px-4 text-center">
          <h1 className="font-display text-4xl font-bold mb-3">Terms of Service</h1>
          <p className="text-white/60">Last updated: July 2026</p>
        </section>
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-3xl">
            <p className="text-gray-600 leading-relaxed mb-10">
              These Terms of Service govern your use of the Kunda Properties platform. Please read them carefully.
            </p>
            <div className="space-y-8">
              {SECTIONS.map(({ title, body }) => (
                <div key={title}>
                  <h2 className="font-display text-xl font-bold text-gray-900 mb-3">{title}</h2>
                  <p className="text-gray-600 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
