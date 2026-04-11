import PublicPageShell from "@/components/layout/PublicPageShell";

const BENEFITS = [
  {
    title: "Reach diaspora buyers",
    body: "Publish listings to buyers in the UK, Europe, the US, and beyond through a platform designed around diaspora trust and cross-border decision-making.",
  },
  {
    title: "Verification support",
    body: "Kunda helps structure the information buyers need, from listing accuracy to document readiness and response expectations.",
  },
  {
    title: "Simpler follow-up",
    body: "Manage enquiries from one place, respond faster, and keep your active pipeline visible as more features come online.",
  },
];

export default function AgentsPage() {
  return (
    <PublicPageShell
      eyebrow="For agents"
      title="List property with more trust and reach"
      description="Kunda gives verified agents a stronger way to present properties to Gambians in the diaspora and manage serious enquiries."
      actions={[
        { href: "/agents/register", label: "Agent sign up" },
        { href: "/agents/verify", label: "Verification process", variant: "secondary" },
      ]}
    >
      <div className="grid gap-5 md:grid-cols-3">
        {BENEFITS.map((benefit) => (
          <div
            key={benefit.title}
            className="rounded-2xl border border-gray-100 bg-white p-6"
          >
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              {benefit.title}
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              {benefit.body}
            </p>
          </div>
        ))}
      </div>
    </PublicPageShell>
  );
}
