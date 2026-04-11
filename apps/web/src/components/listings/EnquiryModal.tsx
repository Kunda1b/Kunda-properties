"use client";

import { useState } from "react";
import { getWhatsAppUrl } from "@/lib/utils";
import { useKundaStore } from "@/store/kunda-store";
import type { PropertyListing } from "@kunda/types";

type EnquiryModalProps = {
  property: PropertyListing;
};

type FieldErrors = {
  email?: string;
  name?: string;
};

export function EnquiryModal({ property }: EnquiryModalProps) {
  const { addEnquiry } = useKundaStore();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState(
    `Hello, I would like to know more about ${property.title}.`,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const whatsappUrl = getWhatsAppUrl(property.agent.whatsapp, message);

  const handleSubmit = () => {
    const nextErrors: FieldErrors = {};

    if (!name.trim()) {
      nextErrors.name = "Your name is required.";
    }

    if (!email.includes("@")) {
      nextErrors.email = "Please enter a valid email address.";
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    addEnquiry({
      createdAt: new Date().toISOString(),
      email,
      message,
      name,
      phone,
      propertyId: property.id,
      propertyTitle: property.title,
    });
    setSubmitted(true);
  };

  const resetModal = () => {
    setIsOpen(false);
    setSubmitted(false);
    setErrors({});
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="rounded-[22px] bg-kunda-gold px-5 py-3 text-sm font-semibold text-white shadow-soft transition-transform duration-200 hover:-translate-y-0.5"
      >
        Enquire now
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4 py-8">
          <div className="surface-card w-full max-w-2xl rounded-[32px] p-6 shadow-soft md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-kunda-forest">
                  Property enquiry
                </p>
                <h3 className="mt-2 font-display text-3xl font-semibold text-kunda-ink">
                  {submitted ? "Message sent" : `Ask about ${property.title}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={resetModal}
                className="rounded-full border border-kunda-border px-3 py-1.5 text-sm text-kunda-muted"
              >
                Close
              </button>
            </div>

            {submitted ? (
              <div className="mt-8 space-y-5">
                <p className="text-base leading-7 text-kunda-muted">
                  Your enquiry has been added to the buyer dashboard. You can
                  continue on WhatsApp if you want a faster reply from the local
                  agent.
                </p>
                <div className="flex flex-col gap-3 md:flex-row">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-[22px] bg-kunda-forest px-5 py-3 text-center text-sm font-semibold text-white"
                  >
                    Continue on WhatsApp
                  </a>
                  <button
                    type="button"
                    onClick={resetModal}
                    className="rounded-[22px] border border-kunda-border px-5 py-3 text-sm font-semibold text-kunda-ink"
                  >
                    Close modal
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-8 grid gap-4">
                <label className="rounded-[24px] bg-white px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
                    Full name
                  </span>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    className="mt-2 w-full border-none bg-transparent text-base text-kunda-ink outline-none"
                    placeholder="Your full name"
                  />
                  {errors.name ? (
                    <span className="mt-2 block text-sm text-red-600">{errors.name}</span>
                  ) : null}
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="rounded-[24px] bg-white px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
                      Email
                    </span>
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="mt-2 w-full border-none bg-transparent text-base text-kunda-ink outline-none"
                      placeholder="you@example.com"
                    />
                    {errors.email ? (
                      <span className="mt-2 block text-sm text-red-600">
                        {errors.email}
                      </span>
                    ) : null}
                  </label>

                  <label className="rounded-[24px] bg-white px-4 py-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
                      Phone
                    </span>
                    <input
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="mt-2 w-full border-none bg-transparent text-base text-kunda-ink outline-none"
                      placeholder="+220..."
                    />
                  </label>
                </div>

                <label className="rounded-[24px] bg-white px-4 py-3">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
                    Message
                  </span>
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    rows={5}
                    className="mt-2 w-full resize-none border-none bg-transparent text-base text-kunda-ink outline-none"
                  />
                </label>

                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-kunda-forest underline-offset-4 hover:underline"
                  >
                    Prefer WhatsApp? Open fallback chat
                  </a>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="rounded-[22px] bg-kunda-forest px-5 py-3 text-sm font-semibold text-white shadow-glow"
                  >
                    Send enquiry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
