import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { buyerProfiles } from "@kunda/types";

export const metadata: Metadata = {
  title: "Register",
};

export default function RegisterPage() {
  return (
    <div className="section-padding mx-auto max-w-7xl py-16">
      <AuthCard
        eyebrow="Create account"
        title="Register as a buyer or diaspora investor"
        alternateText="Already have an account?"
        alternateLabel="Sign in"
        alternateHref="/sign-in"
      >
        <form className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="rounded-[24px] bg-white px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
                First name
              </span>
              <input
                placeholder="First name"
                className="mt-2 w-full border-none bg-transparent text-base text-kunda-ink outline-none"
              />
            </label>

            <label className="rounded-[24px] bg-white px-4 py-3">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
                Last name
              </span>
              <input
                placeholder="Last name"
                className="mt-2 w-full border-none bg-transparent text-base text-kunda-ink outline-none"
              />
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                Phone
              </span>
              <input
                placeholder="+220..."
                className="mt-2 w-full border-none bg-transparent text-base text-kunda-ink outline-none"
              />
            </label>
          </div>

          <label className="rounded-[24px] bg-white px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
              Password
            </span>
            <input
              type="password"
              placeholder="Create a secure password"
              className="mt-2 w-full border-none bg-transparent text-base text-kunda-ink outline-none"
            />
          </label>

          <label className="rounded-[24px] bg-white px-4 py-3">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
              Buyer profile
            </span>
            <select className="mt-2 w-full border-none bg-transparent text-base text-kunda-ink outline-none">
              {buyerProfiles.map((profile) => (
                <option key={profile}>
                  {profile
                    .split("-")
                    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                    .join(" ")}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            className="rounded-[22px] bg-kunda-forest px-5 py-3 text-sm font-semibold text-white shadow-glow"
          >
            Create account
          </button>
        </form>
      </AuthCard>
    </div>
  );
}
