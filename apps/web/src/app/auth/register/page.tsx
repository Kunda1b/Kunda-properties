"use client";

import { useState } from "react";
import Link from "next/link";

const COUNTRIES = [
  "United Kingdom",
  "United States",
  "The Gambia",
  "Germany",
  "Norway",
  "Sweden",
  "Spain",
  "France",
  "Netherlands",
  "Canada",
  "Other",
];

export default function RegisterPage() {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    country: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Enter a valid email";
    if (!form.country) newErrors.country = "Select your country";
    if (!form.password) newErrors.password = "Password is required";
    else if (form.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";
    if (form.password !== form.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!form.agreeTerms)
      newErrors.agreeTerms = "You must agree to the terms";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1000));
    setLoading(false);
  };

  const updateField = (field: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <>
      <div className="mb-6 text-center">
        <h1 className="font-display text-2xl font-semibold text-kunda-ink">
          Create your account
        </h1>
        <p className="mt-1.5 text-sm text-kunda-muted">
          Join the Gambian diaspora investing back home
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-kunda-ink">
            Full name
          </label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => updateField("fullName", e.target.value)}
            placeholder="Your full name"
            className={`input-field ${errors.fullName ? "!border-red-400" : ""}`}
          />
          {errors.fullName && (
            <p className="mt-1 text-xs text-red-500">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-kunda-ink">
            Email
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateField("email", e.target.value)}
            placeholder="you@example.com"
            className={`input-field ${errors.email ? "!border-red-400" : ""}`}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-red-500">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-kunda-ink">
            Phone <span className="text-kunda-muted">(optional)</span>
          </label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => updateField("phone", e.target.value)}
            placeholder="+44 7700 123456"
            className="input-field"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-kunda-ink">
            Country of residence
          </label>
          <select
            value={form.country}
            onChange={(e) => updateField("country", e.target.value)}
            className={`input-field cursor-pointer ${errors.country ? "!border-red-400" : ""} ${!form.country ? "text-kunda-muted" : ""}`}
          >
            <option value="">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {errors.country && (
            <p className="mt-1 text-xs text-red-500">{errors.country}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-kunda-ink">
              Password
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              placeholder="8+ characters"
              className={`input-field ${errors.password ? "!border-red-400" : ""}`}
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-kunda-ink">
              Confirm
            </label>
            <input
              type="password"
              value={form.confirmPassword}
              onChange={(e) => updateField("confirmPassword", e.target.value)}
              placeholder="Repeat password"
              className={`input-field ${errors.confirmPassword ? "!border-red-400" : ""}`}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
            )}
          </div>
        </div>

        <label className="flex items-start gap-2.5 pt-1">
          <input
            type="checkbox"
            checked={form.agreeTerms}
            onChange={(e) => updateField("agreeTerms", e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-kunda-border accent-kunda-forest"
          />
          <span className={`text-sm ${errors.agreeTerms ? "text-red-500" : "text-kunda-muted"}`}>
            I agree to the{" "}
            <Link href="/terms" className="text-kunda-forest underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-kunda-forest underline">Privacy Policy</Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-kunda-muted">
        Already have an account?{" "}
        <Link
          href="/auth/signin"
          className="font-semibold text-kunda-forest hover:underline"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
