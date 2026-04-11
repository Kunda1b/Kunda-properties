"use client";

import { useState, useRef, useEffect } from "react";

const OTP_LENGTH = 6;

export default function VerifyOTPPage() {
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const char = value.slice(-1);
    const newOtp = [...otp];
    newOtp[index] = char;
    setOtp(newOtp);
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, OTP_LENGTH);
    const newOtp = [...otp];
    for (let i = 0; i < pasted.length; i++) {
      newOtp[i] = pasted[i] || "";
    }
    setOtp(newOtp);
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== OTP_LENGTH) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
  };

  const handleResend = () => {
    setCountdown(60);
  };

  const isComplete = otp.every((d) => d !== "");

  return (
    <>
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-kunda-forest-soft">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-kunda-forest">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="currentColor" strokeWidth="1.6" />
            <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-semibold text-kunda-ink">
          Check your email
        </h1>
        <p className="mt-1.5 text-sm text-kunda-muted">
          We sent a 6-digit code to your email address.
          <br />
          Enter it below to verify your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2.5" onPaste={handlePaste}>
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-14 w-12 rounded-xl border-2 border-kunda-border bg-white text-center text-xl font-semibold text-kunda-ink transition-all duration-200 outline-none focus:border-kunda-forest focus:shadow-[0_0_0_3px_rgba(15,110,86,0.12)]"
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={!isComplete || loading}
          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "Verifying..." : "Verify email"}
        </button>
      </form>

      <div className="mt-6 text-center">
        {countdown > 0 ? (
          <p className="text-sm text-kunda-muted">
            Resend code in{" "}
            <span className="font-semibold text-kunda-ink">{countdown}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-sm font-semibold text-kunda-forest hover:underline"
          >
            Resend verification code
          </button>
        )}
      </div>
    </>
  );
}
