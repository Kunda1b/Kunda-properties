"use client";

import { useState } from "react";
import type { Property } from "@/types/property";
import { useKundaStore } from "@/store/kunda-store";

type EnquiryFormProps = {
  property: Property;
  onSuccess: () => void;
};

export default function EnquiryForm({ property, onSuccess }: EnquiryFormProps) {
  const { addEnquiry } = useKundaStore();
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = "Enter a valid email";
    if (!form.message.trim()) newErrors.message = "Message is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));

    addEnquiry({
      email: form.email,
      name: form.name,
      phone: form.phone,
      propertyId: property.id,
      propertyTitle: property.title,
      message: form.message,
      createdAt: new Date().toISOString(),
    });

    setLoading(false);
    onSuccess();
  };

  const updateField = (field: string, value: string) => {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-kunda-muted">
        Enquiring about{" "}
        <span className="font-semibold text-kunda-ink">{property.title}</span>
      </p>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-kunda-ink">
          Full name
        </label>
        <input
          type="text"
          value={form.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="Your full name"
          className={`input-field ${errors.name ? "!border-red-400 !shadow-[0_0_0_3px_rgba(239,68,68,0.1)]" : ""}`}
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name}</p>
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
          className={`input-field ${errors.email ? "!border-red-400 !shadow-[0_0_0_3px_rgba(239,68,68,0.1)]" : ""}`}
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
          Message
        </label>
        <textarea
          value={form.message}
          onChange={(e) => updateField("message", e.target.value)}
          placeholder="I'm interested in this property..."
          rows={3}
          className={`input-field resize-none ${errors.message ? "!border-red-400 !shadow-[0_0_0_3px_rgba(239,68,68,0.1)]" : ""}`}
        />
        {errors.message && (
          <p className="mt-1 text-xs text-red-500">{errors.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg width="16" height="16" viewBox="0 0 24 24" className="animate-spin">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" strokeDasharray="32" strokeLinecap="round" />
            </svg>
            Sending...
          </span>
        ) : (
          "Send enquiry"
        )}
      </button>

      <div className="pt-2 text-center">
        <p className="text-xs text-kunda-muted">
          Or contact directly via{" "}
          <a
            href={`https://wa.me/${property.agentPhone.replace(/\s/g, "").replace("+", "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-kunda-forest hover:underline"
          >
            WhatsApp →
          </a>
        </p>
      </div>
    </form>
  );
}
