import PublicPageShell from "@/components/layout/PublicPageShell";

const PILLARS = [
  {
    title: "Trust first",
    body: "Kunda was designed to reduce the uncertainty diaspora buyers feel when purchasing property from abroad. Verified listings, guided due diligence, and clear communication are built into the experience.",
  },
  {
    title: "Diaspora focused",
    body: "We design for cross-border reality: different currencies, different time zones, and the need to make confident decisions without always being physically present in The Gambia.",
  },
  {
    title: "Built for progress",
    body: "The platform brings property discovery, enquiries, verification, and document workflows into one place so buyers and agents can move from interest to transaction with less friction.",
  },
];

export default function AboutPage() {
  return (
    <PublicPageShell
      eyebrow="About Kunda"
      title="Property trust for the Gambian diaspora"
      description="Kunda Properties helps Gambians abroad discover verified opportunities back home and move forward with more confidence."
      actions={[
        { href: "/listings", label: "Browse listings" },
        { href: "/contact", label: "Contact us", variant: "secondary" },
      ]}
    >
      <div className="grid gap-5 md:grid-cols-3">
        {PILLARS.map((pillar) => (
          <div
            key={pillar.title}
            className="rounded-2xl border border-gray-100 bg-white p-6"
          >
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              {pillar.title}
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">{pillar.body}</p>
          </div>
        ))}
      </div>
    </PublicPageShell>
  );
}
