import Link from "next/link";
import Navbar from "@/components/layout/Navbar";

const NAV_ITEMS = [
  { href: "/agents/dashboard", label: "Dashboard" },
  { href: "/agents/listings", label: "My listings" },
  { href: "/agents/listings/new", label: "Add listing" },
];

export default function AgentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: "#f9f9f7" }}
    >
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Agent portal
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Manage your listings and track enquiries
            </p>
          </div>
          <Link
            href="/agents/listings/new"
            className="px-5 py-2.5 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--kunda-green)" }}
          >
            + New listing
          </Link>
        </div>

        <div className="flex gap-1 mb-8 border-b border-gray-200">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors border-b-2 border-transparent hover:border-gray-300 -mb-px"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {children}
      </div>
    </div>
  );
}
