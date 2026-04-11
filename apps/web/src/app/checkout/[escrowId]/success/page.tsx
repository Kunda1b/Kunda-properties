import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

export default function PaymentSuccessPage() {
  return (
    <div className="min-h-screen bg-[#f9f9f7]">
      <Navbar />

      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-kunda-forest-soft">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
            <path
              d="M5 12l4 4L19 7"
              stroke="#0F6E56"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="mb-3 text-2xl font-semibold text-gray-900">Payment received</h1>
        <p className="mx-auto mb-2 max-w-sm text-sm text-gray-500">
          Your funds are now held securely in escrow. We&apos;ll begin title
          verification within 24 hours.
        </p>
        <p className="mx-auto mb-10 max-w-sm text-sm text-gray-400">
          You&apos;ll receive a confirmation email and WhatsApp message shortly.
        </p>

        <div className="mb-10 grid grid-cols-3 gap-3 text-center">
          {[
            { step: "1", label: "Payment secured", done: true },
            { step: "2", label: "Title verification", done: false },
            { step: "3", label: "Documents signed", done: false },
          ].map((item) => (
            <div
              key={item.step}
              className="rounded-xl border p-3"
              style={{
                borderColor: item.done ? "var(--kunda-green)" : "#e5e7eb",
                backgroundColor: item.done ? "var(--kunda-green-light)" : "white",
              }}
            >
              <p
                className="mb-1 text-xs font-medium"
                style={{ color: item.done ? "var(--kunda-green)" : "#9ca3af" }}
              >
                Step {item.step}
              </p>
              <p
                className="text-xs"
                style={{ color: item.done ? "var(--kunda-green)" : "#9ca3af" }}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/dashboard" className="btn-primary px-8 py-3 text-sm">
            Track in dashboard
          </Link>
          <Link
            href="/listings"
            className="rounded-xl border border-gray-200 px-8 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
          >
            Browse more listings
          </Link>
        </div>
      </div>
    </div>
  );
}
