import PublicPageShell from "@/components/layout/PublicPageShell";

const SECTIONS = [
  {
    title: "Using the platform",
    body: "By using Kunda Properties, you agree to provide accurate information, use the platform lawfully, and respect the rights of buyers, sellers, agents, and service providers on the platform.",
  },
  {
    title: "Listings and enquiries",
    body: "Listing information is reviewed before publication, but buyers should still complete their own due diligence before entering a transaction. Enquiry tools are provided to help buyers and agents communicate clearly.",
  },
  {
    title: "Transactions and verification",
    body: "Some platform actions may require identity checks, document review, or additional compliance steps before a transaction can proceed. Kunda may pause activity when verification is incomplete or concerns are raised.",
  },
  {
    title: "Changes and contact",
    body: "We may update these terms as the service evolves. If you have questions about these terms, contact hello@kundaproperties.gm.",
  },
];

export default function TermsPage() {
  return (
    <PublicPageShell
      eyebrow="Terms of service"
      title="The core terms for using Kunda"
      description="These terms describe the basic rules and expectations for using the platform, communicating through it, and moving toward a property transaction."
    >
      <div className="space-y-4">
        {SECTIONS.map((section) => (
          <div
            key={section.title}
            className="rounded-2xl border border-gray-100 bg-white p-6"
          >
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              {section.title}
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </PublicPageShell>
  );
}
