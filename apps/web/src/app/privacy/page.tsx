import PublicPageShell from "@/components/layout/PublicPageShell";

const SECTIONS = [
  {
    title: "What we collect",
    body: "We collect the information you give us directly, such as your name, email address, phone number, saved listings, and enquiry details. We may also collect basic usage data to improve the platform.",
  },
  {
    title: "How we use it",
    body: "Your information is used to operate the platform, respond to enquiries, connect buyers with agents, and support verification and compliance workflows.",
  },
  {
    title: "How we share it",
    body: "We share only the information needed to support a transaction or enquiry, such as sending your message to the relevant listing agent. We do not sell your personal information.",
  },
  {
    title: "Your choices",
    body: "You can update your account details, remove saved listings, and contact us to request account deletion or clarification about how your data is used.",
  },
];

export default function PrivacyPage() {
  return (
    <PublicPageShell
      eyebrow="Privacy policy"
      title="How Kunda handles your information"
      description="This summary explains the information we collect, why we collect it, and how we keep it focused on the services you use."
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
