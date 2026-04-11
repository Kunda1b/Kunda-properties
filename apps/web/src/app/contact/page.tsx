import PublicPageShell from "@/components/layout/PublicPageShell";

const CHANNELS = [
  {
    title: "General support",
    body: "Email hello@kundaproperties.gm for platform support, property questions, and account help.",
  },
  {
    title: "Diaspora onboarding",
    body: "We help new buyers understand the listing, verification, and escrow process before they commit.",
  },
  {
    title: "Agent partnerships",
    body: "Registered agents and sellers can get in touch to discuss onboarding and listing verification.",
  },
];

export default function ContactPage() {
  return (
    <PublicPageShell
      eyebrow="Contact us"
      title="We’re here to help you move confidently"
      description="Whether you’re buying from abroad or preparing to list a property, our team can help you understand the next step."
      actions={[
        { href: "mailto:hello@kundaproperties.gm", label: "Email support" },
        { href: "/how-it-works", label: "How it works", variant: "secondary" },
      ]}
    >
      <div className="grid gap-5 md:grid-cols-3">
        {CHANNELS.map((channel) => (
          <div
            key={channel.title}
            className="rounded-2xl border border-gray-100 bg-white p-6"
          >
            <h2 className="mb-2 text-lg font-semibold text-gray-900">
              {channel.title}
            </h2>
            <p className="text-sm leading-relaxed text-gray-500">
              {channel.body}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6">
        <h2 className="mb-2 text-lg font-semibold text-gray-900">
          Support hours
        </h2>
        <p className="text-sm leading-relaxed text-gray-500">
          Monday to Friday, 9:00 to 17:00 GMT. We typically respond to email
          enquiries within one business day.
        </p>
      </div>
    </PublicPageShell>
  );
}
