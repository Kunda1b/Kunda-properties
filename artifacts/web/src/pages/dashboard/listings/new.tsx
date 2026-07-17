import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft, Loader2, CheckCircle2, Plus, X } from "lucide-react";
import toast from "react-hot-toast";
import { listingsApi } from "@/lib/api";
import { cn } from "@/lib/utils";

/* ── Schemas per step ───────────────────────────────────────────────────────── */
const step1Schema = z.object({
  propertyType: z.enum(["HOUSE","APARTMENT","LAND","COMMERCIAL","VILLA","COMPOUND"]),
  title: z.string().min(10, "Title must be at least 10 characters").max(200),
  description: z.string().min(20, "Description must be at least 20 characters"),
});

const step2Schema = z.object({
  region: z.string().min(1, "Region is required"),
  address: z.string().min(1, "Address is required"),
  area: z.string().optional(),
});

const step3Schema = z.object({
  price: z.number({ invalid_type_error: "Price must be a number" }).positive(),
  currency: z.enum(["GMD","USD","GBP","EUR"]),
  bedrooms: z.number().int().min(0).optional().nullable(),
  bathrooms: z.number().int().min(0).optional().nullable(),
  landSizeSqm: z.number().positive().optional().nullable(),
  buildingSizeSqm: z.number().positive().optional().nullable(),
  isNegotiable: z.boolean().optional(),
  isInstallment: z.boolean().optional(),
  titleDeedAvailable: z.boolean().optional(),
  furnished: z.boolean().optional(),
  hasElectricity: z.boolean().optional(),
  hasWater: z.boolean().optional(),
  hasInternet: z.boolean().optional(),
  hasSecurity: z.boolean().optional(),
});

type Step1 = z.infer<typeof step1Schema>;
type Step2 = z.infer<typeof step2Schema>;
type Step3 = z.infer<typeof step3Schema>;

const REGIONS = [
  "Greater Banjul Area","West Coast Region","North Bank Region",
  "Lower River Region","Central River Region","Upper River Region",
];

const PROPERTY_TYPES = [
  { value: "HOUSE", label: "House", icon: "🏠" },
  { value: "APARTMENT", label: "Apartment", icon: "🏢" },
  { value: "LAND", label: "Land", icon: "🌳" },
  { value: "COMMERCIAL", label: "Commercial", icon: "🏪" },
  { value: "VILLA", label: "Villa", icon: "🏡" },
  { value: "COMPOUND", label: "Compound", icon: "🏘️" },
];

const STEPS = ["Property Type", "Location", "Details", "Images"];

/* ── Step components ─────────────────────────────────────────────────────────── */
function Step1Form({ onNext }: { onNext: (d: Step1) => void }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<Step1>({
    resolver: zodResolver(step1Schema),
    defaultValues: { propertyType: "HOUSE" },
  });
  const type = watch("propertyType");

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Property Type</label>
        <div className="grid grid-cols-3 gap-3">
          {PROPERTY_TYPES.map((pt) => (
            <label key={pt.value} className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-colors",
              type === pt.value ? "border-kunda-700 bg-kunda-50" : "border-gray-200 hover:border-gray-300"
            )}>
              <input {...register("propertyType")} type="radio" value={pt.value} className="sr-only" />
              <span className="text-2xl">{pt.icon}</span>
              <span className="text-xs font-medium text-gray-700">{pt.label}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Listing Title</label>
        <input {...register("title")} className={cn("input-field", errors.title && "border-red-300")}
          placeholder="e.g. 3 Bedroom House with Pool in Kololi" />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea {...register("description")} rows={5} className={cn("input-field resize-none", errors.description && "border-red-300")}
          placeholder="Describe the property — features, condition, nearby landmarks, diaspora appeal…" />
        {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
      </div>
      <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
        Next: Location <ChevronRight className="w-4 h-4" />
      </button>
    </form>
  );
}

function Step2Form({ onNext, onBack }: { onNext: (d: Step2) => void; onBack: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<Step2>({ resolver: zodResolver(step2Schema) });
  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Region</label>
        <select {...register("region")} className={cn("input-field", errors.region && "border-red-300")}>
          <option value="">Select region…</option>
          {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Address / Locality</label>
        <input {...register("address")} className={cn("input-field", errors.address && "border-red-300")}
          placeholder="e.g. Senegambia Strip, Kololi" />
        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Area / Neighbourhood <span className="text-gray-400 font-normal">(optional)</span></label>
        <input {...register("area")} className="input-field" placeholder="e.g. Kololi" />
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-outline flex-1 flex items-center justify-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
          Next: Details <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={cn("flex items-center gap-2 p-3 rounded-lg border cursor-pointer text-sm",
      checked ? "border-kunda-700 bg-kunda-50 text-kunda-700" : "border-gray-200 text-gray-600")}>
      <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className={cn("w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0",
        checked ? "border-kunda-700 bg-kunda-700" : "border-gray-300")}>
        {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
      </span>
      {label}
    </label>
  );
}

function Step3Form({ onNext, onBack }: { onNext: (d: Step3) => void; onBack: () => void }) {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<Step3>({
    resolver: zodResolver(step3Schema),
    defaultValues: { currency: "GMD", isNegotiable: false, isInstallment: false, titleDeedAvailable: false, furnished: false, hasElectricity: false, hasWater: false, hasInternet: false, hasSecurity: false },
  });
  const boolFields = [
    { key: "isNegotiable", label: "Price Negotiable" },
    { key: "isInstallment", label: "Installment Option" },
    { key: "titleDeedAvailable", label: "Title Deed Available" },
    { key: "furnished", label: "Furnished" },
    { key: "hasElectricity", label: "Electricity" },
    { key: "hasWater", label: "Water/Borehole" },
    { key: "hasInternet", label: "Internet Ready" },
    { key: "hasSecurity", label: "Security" },
  ] as const;

  return (
    <form onSubmit={handleSubmit(onNext)} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
          <input {...register("price", { valueAsNumber: true })} type="number" className={cn("input-field", errors.price && "border-red-300")} placeholder="0" />
          {errors.price && <p className="text-red-500 text-xs mt-1">{errors.price.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select {...register("currency")} className="input-field">
            {["GMD","USD","GBP","EUR"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bedrooms <span className="text-gray-400 font-normal">(optional)</span></label>
          <input {...register("bedrooms", { valueAsNumber: true, setValueAs: (v) => v === "" ? null : Number(v) })} type="number" min="0" className="input-field" placeholder="—" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Bathrooms <span className="text-gray-400 font-normal">(optional)</span></label>
          <input {...register("bathrooms", { valueAsNumber: true, setValueAs: (v) => v === "" ? null : Number(v) })} type="number" min="0" className="input-field" placeholder="—" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Land Size (m²) <span className="text-gray-400 font-normal">(optional)</span></label>
          <input {...register("landSizeSqm", { valueAsNumber: true, setValueAs: (v) => v === "" ? null : Number(v) })} type="number" min="0" className="input-field" placeholder="—" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Building Size (m²) <span className="text-gray-400 font-normal">(optional)</span></label>
          <input {...register("buildingSizeSqm", { valueAsNumber: true, setValueAs: (v) => v === "" ? null : Number(v) })} type="number" min="0" className="input-field" placeholder="—" />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Features & Amenities</label>
        <div className="grid grid-cols-2 gap-2">
          {boolFields.map(({ key, label }) => (
            <Checkbox key={key} label={label} checked={!!watch(key)} onChange={(v) => setValue(key, v)} />
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-outline flex-1 flex items-center justify-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2">
          Next: Photos <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </form>
  );
}

function Step4Images({ listingId, onDone }: { listingId: string; onDone: () => void }) {
  const [urls, setUrls] = useState<string[]>([""]);
  const [saving, setSaving] = useState(false);
  const [, navigate] = useLocation();

  const addImage = async (url: string, idx: number) => {
    if (!url.trim()) return;
    try {
      await listingsApi.uploadImages(listingId, { url, isPrimary: idx === 0, order: idx });
    } catch { /* non-blocking */ }
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      const validUrls = urls.filter((u) => u.trim());
      await Promise.all(validUrls.map((u, i) => addImage(u, i)));
      toast.success("Listing saved as draft! Submit it for review when ready.");
      navigate("/dashboard/listings");
    } catch {
      toast.error("Saved listing but some images failed. You can add them later.");
      navigate("/dashboard/listings");
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Add image URLs for your property. Upload photos to Google Drive, Dropbox, or Unsplash and paste the direct link. You can skip this and add images later from your listings page.
      </p>
      <div className="space-y-2">
        {urls.map((url, i) => (
          <div key={i} className="flex gap-2">
            <input
              type="url"
              placeholder="https://…"
              value={url}
              onChange={(e) => {
                const next = [...urls];
                next[i] = e.target.value;
                setUrls(next);
              }}
              className="input-field flex-1"
            />
            {urls.length > 1 && (
              <button type="button" onClick={() => setUrls(urls.filter((_, j) => j !== i))}
                className="p-2 text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
        {urls.length < 10 && (
          <button type="button" onClick={() => setUrls([...urls, ""])}
            className="flex items-center gap-1 text-sm text-kunda-600 hover:text-kunda-700">
            <Plus className="w-4 h-4" /> Add another image
          </button>
        )}
      </div>
      {urls[0] && <img src={urls[0]} alt="Preview" className="w-full h-48 object-cover rounded-xl border border-gray-200" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />}
      <button onClick={handleFinish} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save Listing as Draft
      </button>
      <button type="button" onClick={() => navigate("/dashboard/listings")} className="w-full text-center text-sm text-gray-500 hover:text-gray-700">
        Skip photos for now
      </button>
    </div>
  );
}

/* ── Main page ───────────────────────────────────────────────────────────────── */
export default function NewListingPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<Step1 & Step2 & Step3>>({});
  const [listingId, setListingId] = useState<string | null>(null);
  const [, navigate] = useLocation();

  const createMutation = useMutation({
    mutationFn: (payload: any) => listingsApi.create(payload),
    onSuccess: (res) => {
      setListingId(res.data.data.id);
      setStep(3);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to create listing"),
  });

  const handleStep1 = (d: Step1) => { setData((p) => ({ ...p, ...d })); setStep(1); };
  const handleStep2 = (d: Step2) => { setData((p) => ({ ...p, ...d })); setStep(2); };
  const handleStep3 = (d: Step3) => {
    const merged = { ...data, ...d };
    createMutation.mutate(merged);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate("/dashboard/listings")} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="font-display text-2xl font-bold text-gray-900">Post a Listing</h1>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors",
              i < step ? "bg-kunda-700 text-white" : i === step ? "bg-kunda-700 text-white ring-4 ring-kunda-100" : "bg-gray-100 text-gray-400")}>
              {i < step ? "✓" : i + 1}
            </div>
            <div className="flex-1 mx-1 last:hidden">
              <div className={cn("h-0.5 rounded", i < step ? "bg-kunda-700" : "bg-gray-200")} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-sm text-gray-500 mb-6">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>

      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        {step === 0 && <Step1Form onNext={handleStep1} />}
        {step === 1 && <Step2Form onNext={handleStep2} onBack={() => setStep(0)} />}
        {step === 2 && (
          createMutation.isPending
            ? <div className="flex items-center justify-center py-16 gap-3 text-gray-500"><Loader2 className="w-6 h-6 animate-spin" /> Saving listing…</div>
            : <Step3Form onNext={handleStep3} onBack={() => setStep(1)} />
        )}
        {step === 3 && listingId && <Step4Images listingId={listingId} onDone={() => navigate("/dashboard/listings")} />}
      </div>
    </div>
  );
}
