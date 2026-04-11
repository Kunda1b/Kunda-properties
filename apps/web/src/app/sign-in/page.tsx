import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

export const metadata: Metadata = {
  title: "Sign in",
};

export default function SignInPage() {
  return (
    <div className="section-padding mx-auto max-w-7xl py-16">
      <AuthCard
        eyebrow="Welcome back"
        title="Sign in to your buyer account"
        alternateText="Need an account?"
        alternateLabel="Register here"
        alternateHref="/register"
      >
        <form className="grid gap-4">
          <label className="rounded-[24px] bg-white px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
              Email
            </span>
            <input
              type="email"
              placeholder="you@example.com"
              className="mt-2 w-full border-none bg-transparent text-base text-kunda-ink outline-none"
            />
          </label>

          <label className="rounded-[24px] bg-white px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
              Password
            </span>
            <input
              type="password"
              placeholder="Enter your password"
              className="mt-2 w-full border-none bg-transparent text-base text-kunda-ink outline-none"
            />
          </label>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-kunda-muted">
              <input type="checkbox" className="accent-kunda-forest" />
              Keep me signed in
            </label>
            <Link href="/verify-otp" className="font-semibold text-kunda-forest">
              Use OTP instead
            </Link>
          </div>

          <button
            type="button"
            className="rounded-[22px] bg-kunda-forest px-5 py-3 text-sm font-semibold text-white shadow-glow"
          >
            Sign in
          </button>
        </form>
      </AuthCard>
    </div>
  );
}
