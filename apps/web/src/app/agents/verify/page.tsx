import PublicPageShell from "@/components/layout/PublicPageShell";

const STEPS = [
  {
    title: "Confirm your identity",
    body: "Provide a valid government ID and up-to-date contact information so buyers know who they are dealing with.",
  },
  {
    title: "Verify your business details",
    body: "Where applicable, share your agency registration details and the documents that show your authority to market property.",
  },
  {
    title: "Submit listing proof",
    body: "For each property, provide clear location details, title information, and any supporting evidence needed for review.",
  },
];

export default function AgentVerifyPage() {
  return (
    <PublicPageShell
      eyebrow="Verification process"
      title="How Kunda verifies agents and listings"
      description="Verification is a core part of building trust with diaspora buyers. These checks are designed to reduce fraud and improve listing quality."
      actions={[
        { href: "/agents/register", label: "Start onboarding" },
        { href: "/contact", label: "Contact support", variant: "secondary" },
      ]}
    >
      <div className="space-y-4">
        {STEPS.map((step, index) => (
          <div
            key={step.title}
            className="rounded-2xl border border-gray-100 bg-white p-6"
          >
            <p
              className="mb-2 text-sm font-semibold"
              style={{ color: "var(--kunda-green)" }}
            >
              Step {index + 1}
            </p>
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              {step.title}
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">{step.body}</p>
          </div>
        ))}
      </div>
    </PublicPageShell>
  );
}
