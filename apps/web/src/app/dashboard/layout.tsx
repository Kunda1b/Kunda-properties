"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const NAV_ITEMS = [
  { href: "/dashboard/saved", label: "Saved listings", icon: "❤️" },
  { href: "/dashboard/enquiries", label: "My enquiries", icon: "✉️" },
  { href: "/dashboard/kyc", label: "Verify identity", icon: "ID" },
  { href: "/dashboard/settings", label: "Account", icon: "⚙️" },
];

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <>
      {/* Header */}
      <div className="border-b border-kunda-border bg-white/60 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl px-5 pb-0 pt-10">
          <div className="mb-6">
            <h1 className="font-display text-3xl font-semibold text-kunda-ink">
              My dashboard
            </h1>
            <p className="mt-1 text-sm text-kunda-muted">
              Manage your saved properties and enquiries
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`-mb-px flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "border-kunda-forest text-kunda-forest"
                      : "border-transparent text-kunda-muted hover:border-kunda-border hover:text-kunda-ink"
                  }`}
                >
                  <span className="text-xs">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-5 py-8">{children}</div>
    </>
  );
}
