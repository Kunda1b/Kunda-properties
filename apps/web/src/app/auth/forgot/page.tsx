"use client";

import { useState } from "react";
import type React from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address");
      return;
    }

    setError("");
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 900));
    setLoading(false);
    setSent(true);
  };

  if (sent) {
    return (
      <>
        <h1 className="mb-2 text-xl font-semibold text-gray-900">
          Check your inbox
        </h1>
        <p className="mb-6 text-sm text-gray-500">
          If an account exists for {email}, we’ve sent a password reset link.
        </p>
        <Link
          href="/auth/signin"
          className="flex w-full items-center justify-center rounded-xl px-6 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--kunda-green)" }}
        >
          Back to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="mb-1 text-xl font-semibold text-gray-900">
        Reset your password
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Enter your email address and we’ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-gray-600">
            Email address
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError("");
            }}
            className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors ${
              error
                ? "border-red-300 focus:border-red-400"
                : "border-gray-200 focus:border-gray-400"
            }`}
          />
          {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl py-3 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: "var(--kunda-green)" }}
        >
          {loading ? "Sending link..." : "Send reset link"}
        </button>
      </form>

      <p className="mt-5 text-center text-xs text-gray-500">
        Remembered it?{" "}
        <Link
          href="/auth/signin"
          className="font-medium hover:underline"
          style={{ color: "var(--kunda-green)" }}
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
