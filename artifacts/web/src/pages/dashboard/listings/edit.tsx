import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { listingsApi } from "@/lib/api";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const PROPERTY_TYPES = ["HOUSE","APARTMENT","LAND","COMMERCIAL","VILLA","COMPOUND"];
const REGIONS = [
  "Greater Banjul Area","West Coast Region","North Bank Region",
  "Lower River Region","Central River Region","Upper River Region",
];

// Validation rules (mirrors the Zod schemas in new.tsx)
function validate(form: any): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.title || form.title.trim().length < 10)
    errors.title = "Title must be at least 10 characters";
  if (form.title && form.title.trim().length > 200)
    errors.title = "Title must be at most 200 characters";
  if (!form.description || form.description.trim().length < 20)
    errors.description = "Description must be at least 20 characters";
  if (!form.region)
    errors.region = "Region is required";
  if (!form.address || !form.address.trim())
    errors.address = "Address is required";
  const price = Number(form.price);
  if (!form.price || isNaN(price) || price <= 0)
    errors.price = "Price must be a positive number";
  return errors;
}

export default function EditListingPage({ id }: { id: string }) {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const [touched, setTouched] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const { data, isLoading, isError } = useQuery({
    queryKey: ["listing-edit", id],
    queryFn: () => listingsApi.getOne(id).then((r) => r.data.data),
    retry: 1,
  });

  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    if (data && !form) {
      setForm({
        title:              data.title ?? "",
        description:        data.description ?? "",
        propertyType:       data.propertyType ?? "HOUSE",
        region:             data.region ?? "",
        address:            data.address ?? "",
        area:               data.area ?? "",
        price:              data.price ?? "",
        currency:           data.currency ?? "GMD",
        bedrooms:           data.bedrooms ?? "",
        bathrooms:          data.bathrooms ?? "",
        landSizeSqm:        data.landSizeSqm ?? "",
        buildingSizeSqm:    data.buildingSizeSqm ?? "",
        isNegotiable:       data.isNegotiable ?? false,
        isInstallment:      data.isInstallment ?? false,
        titleDeedAvailable: data.titleDeedAvailable ?? false,
        furnished:          data.furnished ?? false,
        hasElectricity:     data.hasElectricity ?? false,
        hasWater:           data.hasWater ?? false,
        hasInternet:        data.hasInternet ?? false,
        hasSecurity:        data.hasSecurity ?? false,
        virtualTourUrl:     data.virtualTourUrl ?? "",
        latitude:           data.latitude ?? "",
        longitude:          data.longitude ?? "",
      });
    }
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: () => listingsApi.update(id, {
      ...form,
      price:           form.price ? Number(form.price) : undefined,
      bedrooms:        form.bedrooms !== "" ? Number(form.bedrooms) : null,
      bathrooms:       form.bathrooms !== "" ? Number(form.bathrooms) : null,
      landSizeSqm:     form.landSizeSqm !== "" ? Number(form.landSizeSqm) : null,
      buildingSizeSqm: form.buildingSizeSqm !== "" ? Number(form.buildingSizeSqm) : null,
      latitude:        form.latitude !== "" ? Number(form.latitude) : undefined,
      longitude:       form.longitude !== "" ? Number(form.longitude) : undefined,
    }),
    onSuccess: () => {
      toast.success("Listing updated");
      qc.invalidateQueries({ queryKey: ["my-listings"] });
      navigate("/dashboard/listings");
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to save"),
  });

  const set = (key: string, val: any) => {
    const next = { ...form, [key]: val };
    setForm(next);
    if (touched) setFormErrors(validate(next));
  };

  const handleSave = () => {
    setTouched(true);
    const errors = validate(form);
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      toast.error("Please fix the errors before saving");
      return;
    }
    updateMutation.mutate();
  };

  if (isError) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <p className="text-gray-500">Failed to load listing</p>
      <p className="text-xs text-gray-400">Please try again later</p>
    </div>
  );

  if (isLoading || !form) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-kunda-600" />
      </div>
    );
  }

  const BoolField = ({ fkey, label }: { fkey: string; label: string }) => (
    <label className={cn("flex items-center gap-2 p-3 rounded-lg border cursor-pointer text-sm",
      form[fkey] ? "border-kunda-700 bg-kunda-50 text-kunda-700" : "border-gray-200 text-gray-600")}>
      <input type="checkbox" className="sr-only" checked={form[fkey]} onChange={(e) => set(fkey, e.target.checked)} />
      <span className={cn("w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 text-white text-[10px]",
        form[fkey] ? "border-kunda-700 bg-kunda-700" : "border-gray-300")}>
        {form[fkey] && "✓"}
      </span>
      {label}
    </label>
  );

  const Field = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate("/dashboard/listings")} className="text-gray-400 hover:text-gray-600">←</button>
        <h1 className="font-display text-2xl font-bold text-gray-900">Edit Listing</h1>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        {/* Basic */}
        <Field label="Property Type">
          <select className="input-field" value={form.propertyType} onChange={(e) => set("propertyType", e.target.value)}>
            {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
          </select>
        </Field>
        <Field label="Title" error={formErrors.title}>
          <input className={cn("input-field", formErrors.title && "border-red-300")}
            value={form.title} onChange={(e) => set("title", e.target.value)} />
        </Field>
        <Field label="Description" error={formErrors.description}>
          <textarea className={cn("input-field resize-none", formErrors.description && "border-red-300")}
            rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} />
        </Field>

        {/* Location */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Region" error={formErrors.region}>
            <select className={cn("input-field", formErrors.region && "border-red-300")}
              value={form.region} onChange={(e) => set("region", e.target.value)}>
              <option value="">Select…</option>
              {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </Field>
          <Field label="Area">
            <input className="input-field" value={form.area} onChange={(e) => set("area", e.target.value)} />
          </Field>
        </div>
        <Field label="Address" error={formErrors.address}>
          <input className={cn("input-field", formErrors.address && "border-red-300")}
            value={form.address} onChange={(e) => set("address", e.target.value)} />
        </Field>

        {/* Pricing */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price" error={formErrors.price}>
            <input type="number" className={cn("input-field", formErrors.price && "border-red-300")}
              value={form.price} onChange={(e) => set("price", e.target.value)} />
          </Field>
          <Field label="Currency">
            <select className="input-field" value={form.currency} onChange={(e) => set("currency", e.target.value)}>
              {["GMD","USD","GBP","EUR"].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Bedrooms">
            <input type="number" min="0" className="input-field" value={form.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} />
          </Field>
          <Field label="Bathrooms">
            <input type="number" min="0" className="input-field" value={form.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} />
          </Field>
          <Field label="Land Size (m²)">
            <input type="number" min="0" className="input-field" value={form.landSizeSqm} onChange={(e) => set("landSizeSqm", e.target.value)} />
          </Field>
          <Field label="Building Size (m²)">
            <input type="number" min="0" className="input-field" value={form.buildingSizeSqm} onChange={(e) => set("buildingSizeSqm", e.target.value)} />
          </Field>
        </div>

        {/* Virtual Tour */}
        <Field label="Virtual Tour URL">
          <input className="input-field" value={form.virtualTourUrl} onChange={(e) => set("virtualTourUrl", e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..." />
        </Field>

        {/* Map Coordinates */}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Latitude">
            <input type="number" step="any" className="input-field" value={form.latitude}
              onChange={(e) => set("latitude", e.target.value)} placeholder="e.g. 13.4438" />
          </Field>
          <Field label="Longitude">
            <input type="number" step="any" className="input-field" value={form.longitude}
              onChange={(e) => set("longitude", e.target.value)} placeholder="e.g. -16.6817" />
          </Field>
        </div>

        {/* Features */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Features</label>
          <div className="grid grid-cols-2 gap-2">
            <BoolField fkey="isNegotiable" label="Negotiable" />
            <BoolField fkey="isInstallment" label="Installment" />
            <BoolField fkey="titleDeedAvailable" label="Title Deed" />
            <BoolField fkey="furnished" label="Furnished" />
            <BoolField fkey="hasElectricity" label="Electricity" />
            <BoolField fkey="hasWater" label="Water/Borehole" />
            <BoolField fkey="hasInternet" label="Internet" />
            <BoolField fkey="hasSecurity" label="Security" />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={() => navigate("/dashboard/listings")} className="btn-outline flex-1">Cancel</button>
          <button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {updateMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
