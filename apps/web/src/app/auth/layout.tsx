import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-64px)] flex-col items-center justify-center px-5 py-12">
      {/* Background decoration */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-kunda-forest-soft/30 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-[400px] w-[400px] rounded-full bg-kunda-gold-soft/20 blur-3xl" />
      </div>

      <Link href="/" className="mb-8 flex items-center gap-2.5 group">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-kunda-forest to-kunda-forest-deep shadow-md transition-transform duration-200 group-hover:scale-105">
          <span className="text-sm font-bold text-white">K</span>
        </div>
        <span className="text-xl font-semibold text-kunda-ink tracking-tight">
          Kunda Properties
        </span>
      </Link>

      <div className="w-full max-w-md surface-card rounded-2xl p-8 shadow-card">
        {children}
      </div>

      <p className="mt-6 text-center text-xs text-kunda-muted">
        By continuing you agree to Kunda&apos;s{" "}
        <Link
          href="/terms"
          className="text-kunda-forest underline underline-offset-2 hover:text-kunda-forest-deep"
        >
          Terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="text-kunda-forest underline underline-offset-2 hover:text-kunda-forest-deep"
        >
          Privacy Policy
        </Link>
      </p>
    </div>
  );
}
