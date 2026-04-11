"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import DocumentUploader from "@/components/kyc/DocumentUploader"
import SelfieCapture from "@/components/kyc/SelfieCapture"
import KYCStatusBadge from "@/components/kyc/KYCStatusBadge"
import { fileToBase64 } from "@/lib/upload"
import { apiRequest } from "@/lib/api"
import type { KYCStatus } from "@kunda/types"

const STEPS = ["personal", "document", "selfie", "review"] as const
type Step = (typeof STEPS)[number]

const COUNTRIES = [
  { code: "GM", name: "The Gambia" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "SE", name: "Sweden" },
  { code: "DE", name: "Germany" },
  { code: "NO", name: "Norway" },
  { code: "NL", name: "Netherlands" },
  { code: "CA", name: "Canada" },
]

const DEFAULT_ID_TYPES = [
  { label: "Passport", value: "PASSPORT" },
  { label: "National ID", value: "NATIONAL_ID" },
]

const ID_TYPES: Record<string, { label: string; value: string }[]> = {
  GM: [
    { label: "Gambian National ID", value: "NATIONAL_ID" },
    { label: "Passport", value: "PASSPORT" },
    { label: "Voter ID", value: "VOTER_ID" },
  ],
  GB: [
    { label: "Passport", value: "PASSPORT" },
    { label: "Driving Licence", value: "DRIVING_LICENSE" },
  ],
  US: [
    { label: "Passport", value: "PASSPORT" },
    { label: "Driver's License", value: "DRIVERS_LICENSE" },
  ],
  DEFAULT: DEFAULT_ID_TYPES,
}

type KYCStatusData = {
  kycStatus: KYCStatus
  kycRecord: {
    documentType: string
    status: KYCStatus
    reviewNote?: string
    submittedAt: string
    reviewedAt?: string
  } | null
}

const inputClass =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg " +
  "outline-none focus:border-gray-400 transition-colors bg-white"

export default function KYCPage() {
  const [step, setStep] = useState<Step>("personal")
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [kycStatus, setKycStatus] = useState<KYCStatusData | null>(null)
  const [loadingStatus, setLoadingStatus] = useState(true)

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    country: "GB",
    idType: "PASSPORT",
    idNumber: "",
  })

  const [documentFile, setDocumentFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }))

  const idTypes = ID_TYPES[form.country] ?? DEFAULT_ID_TYPES

  useEffect(() => {
    apiRequest<{ data: KYCStatusData }>("/api/auth/kyc/status")
      .then((res) => {
        setKycStatus(res.data);
      })
      .catch(() => {
        setKycStatus(null);
      })
      .finally(() => setLoadingStatus(false));
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true)
    setError("")

    try {
      const payload: Record<string, string> = { ...form }

      if (documentFile) {
        payload.documentImageBase64 = await fileToBase64(documentFile)
      }

      if (selfieFile) {
        payload.selfieImageBase64 = await fileToBase64(selfieFile)
      }

      await apiRequest<void>("/api/auth/kyc/submit", {
        method: "POST",
        body: payload,
      })

      setSubmitted(true)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Submission failed — please try again",
      )
    } finally {
      setSubmitting(false)
    }
  }

  const stepIndex = STEPS.indexOf(step)

  if (loadingStatus) {
    return (
      <div className="max-w-lg flex items-center justify-center py-20">
        <div
          className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-green-600 animate-spin"
        />
      </div>
    )
  }

  if (kycStatus?.kycStatus === "APPROVED") {
    return (
      <div className="max-w-lg">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "var(--kunda-green-light)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                stroke="#0F6E56"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Identity verified
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Your identity has been verified. You can now complete property
            purchases through Kunda escrow.
          </p>
          <KYCStatusBadge status="APPROVED" />
          <div className="mt-6">
            <Link
              href="/listings"
              className="inline-block px-8 py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--kunda-green)" }}
            >
              Browse properties
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (kycStatus?.kycStatus === "SUBMITTED") {
    return (
      <div className="max-w-lg">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#FAEEDA" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="#BA7517" strokeWidth="1.8" />
              <path
                d="M12 6v6l4 2"
                stroke="#BA7517"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verification in progress
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            We&apos;re reviewing your documents. This usually takes less than
            5 minutes. You&apos;ll receive an email when it&apos;s complete.
          </p>
          <KYCStatusBadge status="SUBMITTED" />
          {kycStatus.kycRecord?.submittedAt && (
            <p className="text-xs text-gray-400 mt-4">
              Submitted{" "}
              {new Date(kycStatus.kycRecord.submittedAt).toLocaleString("en-GB")}
            </p>
          )}
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="max-w-lg">
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ backgroundColor: "var(--kunda-green-light)" }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M5 12l4 4L19 7"
                stroke="#0F6E56"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verification submitted
          </h2>
          <p className="text-sm text-gray-500 mb-2 max-w-sm mx-auto">
            We&apos;re verifying your identity — usually takes under 5 minutes.
          </p>
          <p className="text-sm text-gray-400 mb-8">
            You&apos;ll get an email and WhatsApp message when it&apos;s done.
          </p>
          <Link
            href="/listings"
            className="inline-block px-8 py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--kunda-green)" }}
          >
            Browse listings while you wait
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900 mb-1">
          Verify your identity
        </h1>
        <p className="text-sm text-gray-500">
          Required before you can initiate an escrow or complete a purchase.
        </p>
        {kycStatus?.kycStatus === "REJECTED" && (
          <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-100">
            <p className="text-xs font-medium text-red-700 mb-0.5">
              Previous submission rejected
            </p>
            <p className="text-xs text-red-600">
              {kycStatus.kycRecord?.reviewNote ||
                "Please resubmit with clearer document photos."}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 flex-1">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 transition-all"
              style={{
                backgroundColor:
                  stepIndex > i
                    ? "var(--kunda-green)"
                    : stepIndex === i
                    ? "var(--kunda-green-light)"
                    : "#f1efe8",
                color:
                  stepIndex > i
                    ? "white"
                    : stepIndex === i
                    ? "var(--kunda-green)"
                    : "#888",
              }}
            >
              {stepIndex > i ? "✓" : i + 1}
            </div>
            <span
              className="text-xs capitalize hidden sm:block"
              style={{
                color: step === s ? "var(--kunda-green)" : "#aaa",
                fontWeight: step === s ? 500 : 400,
              }}
            >
              {s}
            </span>
            {i < STEPS.length - 1 && (
              <div
                className="flex-1 h-px"
                style={{
                  backgroundColor:
                    stepIndex > i ? "var(--kunda-green)" : "#e5e7eb",
                }}
              />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {step === "personal" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">
              Personal details
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  First name
                </label>
                <input
                  type="text"
                  placeholder="Fatou"
                  value={form.firstName}
                  onChange={set("firstName")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Last name
                </label>
                <input
                  type="text"
                  placeholder="Jallow"
                  value={form.lastName}
                  onChange={set("lastName")}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Country of document
              </label>
              <select
                value={form.country}
                onChange={set("country")}
                className={inputClass}
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Document type
              </label>
              <select
                value={form.idType}
                onChange={set("idType")}
                className={inputClass}
              >
                {idTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Document number
              </label>
              <input
                type="text"
                placeholder="e.g. P123456789"
                value={form.idNumber}
                onChange={set("idNumber")}
                className={inputClass}
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter exactly as it appears on your document
              </p>
            </div>

            <button
              onClick={() => setStep("document")}
              disabled={!form.firstName || !form.lastName || !form.idNumber}
              className="w-full py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ backgroundColor: "var(--kunda-green)" }}
            >
              Continue
            </button>
          </div>
        )}

        {step === "document" && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-gray-900">
              Upload your document
            </h2>

            <DocumentUploader
              label={`${idTypes.find((t) => t.value === form.idType)?.label || "Document"} — front`}
              hint="JPG, PNG, WebP or PDF · max 5MB · must be clear and legible"
              onFileSelected={setDocumentFile}
              currentFile={documentFile}
            />

            <div
              className="p-3 rounded-lg text-xs text-gray-500"
              style={{ backgroundColor: "var(--kunda-green-light)" }}
            >
              <p
                className="font-medium mb-1"
                style={{ color: "var(--kunda-green)" }}
              >
                Tips for a good photo
              </p>
              <ul className="space-y-0.5">
                <li>· All four corners of the document are visible</li>
                <li>· Document is flat, not folded or creased</li>
                <li>· Text is sharp and readable</li>
                <li>· No glare or shadows covering the document</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("personal")}
                className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("selfie")}
                disabled={!documentFile}
                className="flex-1 py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "var(--kunda-green)" }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === "selfie" && (
          <div className="space-y-5">
            <h2 className="text-sm font-semibold text-gray-900">
              Take a selfie
            </h2>

            <SelfieCapture
              onCapture={setSelfieFile}
              currentFile={selfieFile}
            />

            <div className="flex gap-3">
              <button
                onClick={() => setStep("document")}
                className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep("review")}
                disabled={!selfieFile}
                className="flex-1 py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "var(--kunda-green)" }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="space-y-4">
            <h2 className="text-sm font-semibold text-gray-900">
              Review and submit
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {documentFile && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Document</p>
                  <div className="rounded-lg overflow-hidden border border-gray-100 h-24 bg-gray-50 flex items-center justify-center">
                    {documentFile.type === "application/pdf" ? (
                      <div className="text-center">
                        <div className="text-2xl mb-1">📄</div>
                        <p className="text-xs text-gray-500">
                          {documentFile.name}
                        </p>
                      </div>
                    ) : (
                      <img
                        src={URL.createObjectURL(documentFile)}
                        alt="Document"
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                </div>
              )}

              {selfieFile && (
                <div>
                  <p className="text-xs text-gray-500 mb-1.5">Selfie</p>
                  <div className="rounded-lg overflow-hidden border border-gray-100 h-24">
                    <img
                      src={URL.createObjectURL(selfieFile)}
                      alt="Selfie"
                      className="w-full h-full object-cover object-top"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5 py-3 border-t border-b border-gray-100">
              {[
                {
                  label: "Name",
                  value: `${form.firstName} ${form.lastName}`,
                },
                {
                  label: "Country",
                  value:
                    COUNTRIES.find((c) => c.code === form.country)?.name ||
                    form.country,
                },
                {
                  label: "Document",
                  value:
                    idTypes.find((t) => t.value === form.idType)?.label ||
                    form.idType,
                },
                { label: "Number", value: form.idNumber },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between"
                >
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className="text-xs font-medium text-gray-900">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              By submitting, you confirm these details are accurate and consent
              to Kunda verifying your identity using Smile Identity&apos;s secure
              system.
            </p>

            {error && (
              <p className="text-xs text-red-500 text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep("selfie")}
                className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "var(--kunda-green)" }}
              >
                {submitting ? "Submitting..." : "Submit verification"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
