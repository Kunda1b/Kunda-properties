import Link from "next/link";
import type { ReactNode } from "react";
import Navbar from "@/components/layout/Navbar";

type Action = {
  href: string;
  label: string;
  variant?: "primary" | "secondary";
};

type PublicPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  actions?: Action[];
};

export default function PublicPageShell({
  eyebrow,
  title,
  description,
  children,
  actions = [],
}: PublicPageShellProps) {
  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="mx-auto max-w-3xl px-4 pb-10 pt-16 text-center">
        <span
          className="mb-4 inline-block rounded-full px-3 py-1 text-sm font-medium"
          style={{
            backgroundColor: "var(--kunda-green-light)",
            color: "var(--kunda-green)",
          }}
        >
          {eyebrow}
        </span>
        <h1 className="mb-4 text-4xl font-semibold text-gray-900">{title}</h1>
        <p className="mx-auto max-w-2xl text-lg text-gray-500">{description}</p>

        {actions.length > 0 && (
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {actions.map((action) => (
              action.href.startsWith("mailto:") ? (
                <a
                  key={action.href}
                  href={action.href}
                  className={
                    action.variant === "secondary"
                      ? "rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      : "rounded-xl px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  }
                  style={
                    action.variant === "secondary"
                      ? undefined
                      : { backgroundColor: "var(--kunda-green)" }
                  }
                >
                  {action.label}
                </a>
              ) : (
                <Link
                  key={action.href}
                  href={action.href}
                  className={
                    action.variant === "secondary"
                      ? "rounded-xl border border-gray-200 px-6 py-3 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                      : "rounded-xl px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
                  }
                  style={
                    action.variant === "secondary"
                      ? undefined
                      : { backgroundColor: "var(--kunda-green)" }
                  }
                >
                  {action.label}
                </Link>
              )
            ))}
          </div>
        )}
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20">{children}</section>
    </div>
  );
}
