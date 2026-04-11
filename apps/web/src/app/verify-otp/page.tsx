import type { Metadata } from "next";
import { AuthCard } from "@/components/auth/AuthCard";
import { otpCodeLength } from "@kunda/types";

export const metadata: Metadata = {
  title: "Verify OTP",
};

export default function VerifyOtpPage() {
  return (
    <div className="section-padding mx-auto max-w-7xl py-16">
      <AuthCard
        eyebrow="OTP verification"
        title="Enter the one-time passcode"
        alternateText="Prefer password login?"
        alternateLabel="Go back to sign in"
        alternateHref="/sign-in"
      >
        <div className="space-y-6">
          <p className="text-sm leading-7 text-kunda-muted">
            We sent a six-digit code to your phone and email. This mirrors the
            OTP-first authentication path defined in your architecture.
          </p>

          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: otpCodeLength }).map((_, index) => (
              <input
                key={index}
                maxLength={1}
                className="h-14 rounded-[18px] border border-kunda-border bg-white text-center text-xl font-semibold text-kunda-ink outline-none focus:border-kunda-forest"
              />
            ))}
          </div>

          <button
            type="button"
            className="w-full rounded-[22px] bg-kunda-forest px-5 py-3 text-sm font-semibold text-white shadow-glow"
          >
            Verify code
          </button>

          <button
            type="button"
            className="text-sm font-medium text-kunda-forest"
          >
            Resend code
          </button>
        </div>
      </AuthCard>
    </div>
  );
}
