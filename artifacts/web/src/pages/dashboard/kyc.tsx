import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, CheckCircle, Clock, XCircle, ChevronRight, ChevronLeft, Loader2 } from "lucide-react";
import { kycApi } from "@/lib/api";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const STATUS_MAP: Record<string, { icon: any; label: string; color: string; desc: string }> = {
  VERIFIED: { icon: CheckCircle, label: "Verified ✅", color: "text-green-700 bg-green-50 border-green-200", desc: "Your identity has been verified. You can now make offers and initiate escrow." },
  SUBMITTED: { icon: Clock, label: "Under Review", color: "text-yellow-700 bg-yellow-50 border-yellow-200", desc: "Your documents are under review. This usually takes 1–2 business days." },
  REJECTED: { icon: XCircle, label: "Rejected", color: "text-red-700 bg-red-50 border-red-200", desc: "Your verification was rejected. Please resubmit with correct documents." },
  PENDING: { icon: Shield, label: "Not Verified", color: "text-gray-700 bg-gray-50 border-gray-200", desc: "Complete identity verification to make offers and initiate escrow." },
};

const ID_TYPES = [
  { value: "PASSPORT", label: "Passport" },
  { value: "NATIONAL_ID", label: "National ID Card" },
  { value: "DRIVERS_LICENSE", label: "Driver's Licence" },
  { value: "VOTER_ID", label: "Voter Registration Card" },
];

const COUNTRIES = [
  { code: "GM", name: "Gambia" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "DE", name: "Germany" },
  { code: "SE", name: "Sweden" },
  { code: "NO", name: "Norway" },
  { code: "NG", name: "Nigeria" },
  { code: "SN", name: "Senegal" },
  { code: "FR", name: "France" },
  { code: "ES", name: "Spain" },
];

function StatusBanner({ status }: { status: string }) {
  const info = STATUS_MAP[status] || STATUS_MAP.PENDING;
  const Icon = info.icon;
  return (
    <div className={`rounded-2xl p-5 flex items-center gap-4 border ${info.color} mb-6`}>
      <Icon className="w-8 h-8 flex-shrink-0" />
      <div>
        <p className="font-bold">{info.label}</p>
        <p className="text-sm mt-0.5 opacity-80">{info.desc}</p>
      </div>
    </div>
  );
}

function VerificationForm({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    idType: "PASSPORT",
    idNumber: "",
    idCountry: "GM",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    idFrontUrl: "",
    idBackUrl: "",
    selfieImageUrl: "",
  });

  const uploadDocMutation = useMutation({
    mutationFn: (payload: { imageUrl: string; side: string }) => kycApi.uploadDoc(payload),
  });

  const submitMutation = useMutation({
    mutationFn: () =>
      kycApi.submit({
        idType: form.idType,
        idNumber: form.idNumber,
        idCountry: form.idCountry,
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
      }),
    onSuccess: () => {
      toast.success("Verification submitted! We'll review within 24 hours.");
      onDone();
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Submission failed"),
  });

  const handleUpload = async (side: "front" | "back" | "selfie") => {
    const url = form[side === "front" ? "idFrontUrl" : side === "back" ? "idBackUrl" : "selfieImageUrl"];
    if (!url) return;
    await uploadDocMutation.mutateAsync({ imageUrl: url, side });
  };

  const steps = ["Identity", "ID Documents", "Selfie", "Review"];

  return (
    <div>
      {/* Step indicators */}
      <div className="flex items-center gap-0 mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
              i < step ? "bg-kunda-700 text-white" : i === step ? "bg-kunda-700 text-white ring-4 ring-kunda-100" : "bg-gray-100 text-gray-400")}>
              {i < step ? "✓" : i + 1}
            </div>
            <div className="flex-1 mx-1 last:hidden"><div className={cn("h-0.5 rounded", i < step ? "bg-kunda-700" : "bg-gray-200")} /></div>
          </div>
        ))}
      </div>

      {/* Step 0: Identity */}
      {step === 0 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-gray-900">Your Identity</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">First Name</label>
              <input className="input-field" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Last Name</label>
              <input className="input-field" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date of Birth</label>
            <input type="date" className="input-field" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">ID Type</label>
            <select className="input-field" value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value })}>
              {ID_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">ID Number</label>
              <input className="input-field" value={form.idNumber} onChange={(e) => setForm({ ...form, idNumber: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Issuing Country</label>
              <select className="input-field" value={form.idCountry} onChange={(e) => setForm({ ...form, idCountry: e.target.value })}>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <button
            onClick={() => setStep(1)}
            disabled={!form.firstName || !form.lastName || !form.idNumber || !form.dateOfBirth}
            className="btn-primary w-full flex items-center justify-center gap-2">
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 1: ID Documents */}
      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-gray-900">Upload ID Documents</h3>
          <p className="text-sm text-gray-500">Upload photos of your {ID_TYPES.find(t => t.value === form.idType)?.label}. Use a direct image URL (e.g. from Google Drive or Dropbox).</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Front of ID — image URL</label>
            <input className="input-field" type="url" placeholder="https://…" value={form.idFrontUrl}
              onChange={(e) => setForm({ ...form, idFrontUrl: e.target.value })} />
            {form.idFrontUrl && <img src={form.idFrontUrl} alt="ID front preview" className="mt-2 h-28 object-cover rounded-lg border border-gray-200 w-full" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Back of ID — image URL <span className="text-gray-400 font-normal">(if applicable)</span></label>
            <input className="input-field" type="url" placeholder="https://…" value={form.idBackUrl}
              onChange={(e) => setForm({ ...form, idBackUrl: e.target.value })} />
            {form.idBackUrl && <img src={form.idBackUrl} alt="ID back preview" className="mt-2 h-28 object-cover rounded-lg border border-gray-200 w-full" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(0)} className="btn-outline flex-1 flex items-center justify-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={async () => { await Promise.all([form.idFrontUrl && handleUpload("front"), form.idBackUrl && handleUpload("back")]); setStep(2); }}
              disabled={!form.idFrontUrl}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Selfie */}
      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-gray-900">Selfie Photo</h3>
          <p className="text-sm text-gray-500">Upload a clear, recent photo of your face. It must match your ID.</p>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Selfie — image URL</label>
            <input className="input-field" type="url" placeholder="https://…" value={form.selfieImageUrl}
              onChange={(e) => setForm({ ...form, selfieImageUrl: e.target.value })} />
            {form.selfieImageUrl && <img src={form.selfieImageUrl} alt="Selfie preview" className="mt-2 h-40 object-cover rounded-lg border border-gray-200 w-full" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="btn-outline flex-1 flex items-center justify-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={async () => { if (form.selfieImageUrl) await handleUpload("selfie"); setStep(3); }}
              disabled={!form.selfieImageUrl}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              Review <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Submit */}
      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-display text-lg font-bold text-gray-900">Review & Submit</h3>
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{form.firstName} {form.lastName}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Date of Birth</span><span className="font-medium">{form.dateOfBirth}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ID Type</span><span className="font-medium">{ID_TYPES.find(t => t.value === form.idType)?.label}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ID Number</span><span className="font-medium">{form.idNumber}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Country</span><span className="font-medium">{COUNTRIES.find(c => c.code === form.idCountry)?.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">ID Front</span><span className={form.idFrontUrl ? "text-green-600 font-medium" : "text-red-500"}>✓ Uploaded</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Selfie</span><span className={form.selfieImageUrl ? "text-green-600 font-medium" : "text-red-500"}>✓ Uploaded</span></div>
          </div>
          <p className="text-xs text-gray-400">By submitting, you confirm that all information is accurate and matches your government-issued ID.</p>
          <div className="flex gap-3">
            <button onClick={() => setStep(2)} className="btn-outline flex-1 flex items-center justify-center gap-2"><ChevronLeft className="w-4 h-4" /> Back</button>
            <button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}
              className="btn-primary flex-1 flex items-center justify-center gap-2">
              {submitMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Submit Verification
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function KycPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["kyc-status"],
    queryFn: () => kycApi.getStatus().then((r) => r.data.data),
    retry: 1,
  });

  const kycStatus = data?.status || "PENDING";

  return (
    <div className="max-w-xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Identity Verification</h1>

      {isLoading ? (
        <div className="h-20 bg-gray-100 animate-pulse rounded-2xl mb-6" />
      ) : (
        <StatusBanner status={kycStatus} />
      )}

      {kycStatus === "VERIFIED" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="font-display text-lg font-bold text-gray-900">You're verified</p>
          <p className="text-sm text-gray-500 mt-1">You can now make offers and initiate secure escrow transactions.</p>
        </div>
      )}

      {kycStatus === "SUBMITTED" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 text-center">
          <Clock className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
          <p className="font-display text-lg font-bold text-gray-900">Review in progress</p>
          <p className="text-sm text-gray-500 mt-1">Our team will verify your documents within 1–2 business days.</p>
        </div>
      )}

      {(kycStatus === "PENDING" || kycStatus === "REJECTED") && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          {!showForm ? (
            <div className="text-center">
              <Shield className="w-12 h-12 text-kunda-600 mx-auto mb-4" />
              <h2 className="font-display text-lg font-bold text-gray-900 mb-2">
                {kycStatus === "REJECTED" ? "Resubmit Verification" : "Begin Verification"}
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                {kycStatus === "REJECTED" ? "Your previous submission was rejected. Please resubmit with clear, valid documents." : "Verify your identity to unlock offers and secure escrow. Takes less than 5 minutes."}
              </p>
              <ul className="text-left space-y-2 text-sm text-gray-600 mb-6">
                {["A government-issued photo ID (front + back)", "A selfie matching your ID", "Name and date of birth"].map((item, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-kunda-50 text-kunda-700 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                    {item}
                  </li>
                ))}
              </ul>
              <button onClick={() => setShowForm(true)} className="btn-primary w-full flex items-center justify-center gap-2">
                Start Verification <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <VerificationForm onDone={() => { setShowForm(false); qc.invalidateQueries({ queryKey: ["kyc-status"] }); }} />
          )}
        </div>
      )}
    </div>
  );
}
