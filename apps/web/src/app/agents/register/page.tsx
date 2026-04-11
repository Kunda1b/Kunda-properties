import PublicPageShell from "@/components/layout/PublicPageShell";

const REQUIREMENTS = [
  "Your agency or seller profile information",
  "A valid Gambian phone number and email address",
  "Proof of identity and business registration where applicable",
  "Clear listing details and supporting documents for each property",
];

export default function AgentRegisterPage() {
  return (
    <PublicPageShell
      eyebrow="Agent sign up"
      title="Start your Kunda agent onboarding"
      description="We review every new agent application before allowing listings to go live. That keeps the marketplace safer for buyers and stronger for trusted agents."
      actions={[
        { href: "mailto:hello@kundaproperties.gm", label: "Apply by email" },
        { href: "/agents/verify", label: "View requirements", variant: "secondary" },
      ]}
    >
      <div className="rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">
          What to prepare
        </h2>
        <ul className="space-y-3 text-sm text-gray-500">
          {REQUIREMENTS.map((item) => (
            <li key={item} className="flex items-start gap-3">
              <span
                className="mt-1 inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: "var(--kunda-green)" }}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>
    </PublicPageShell>
  );
}
