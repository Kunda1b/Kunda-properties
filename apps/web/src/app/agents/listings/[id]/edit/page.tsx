"use client";

import { use, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import StepIndicator from "@/components/listings/StepIndicator";
import DetailsStep from "@/components/listings/steps/DetailsStep";
import LocationStep from "@/components/listings/steps/LocationStep";
import PricingStep from "@/components/listings/steps/PricingStep";
import ReviewStep from "@/components/listings/steps/ReviewStep";
import PhotoUploader from "@/components/listings/PhotoUploader";
import { apiRequest } from "@/lib/api";
import {
  EMPTY_FORM,
  FORM_STEPS,
  validateListingForm,
  type FormStep,
  type ListingFormData,
  type FormErrors,
} from "@/lib/listing-form";

type UploadedPhoto = { url: string; id?: string };

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const listingId = resolvedParams.id;

  const router = useRouter();
  const [step, setStep] = useState<FormStep>("details");
  const [completedSteps, setCompletedSteps] = useState<FormStep[]>([]);
  const [form, setForm] = useState<ListingFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiRequest<{ data: { title: string; description: string; type: string; bedrooms: number; bathrooms: number; sizeSqm: number; location: string; region: string; latitude?: number; longitude?: number; price: number; currency: string; photos: { url: string; id: string }[] } }>(`/api/listings/${listingId}`)
      .then((res) => {
        const d = res.data;
        setForm({
          title: d.title,
          description: d.description,
          type: d.type as ListingFormData["type"],
          bedrooms: String(d.bedrooms),
          bathrooms: String(d.bathrooms),
          sizeSqm: String(d.sizeSqm),
          location: d.location,
          region: d.region,
          latitude: d.latitude,
          longitude: d.longitude,
          price: String(d.price),
          currency: d.currency,
        });
        setPhotos(d.photos.map((p) => ({ url: p.url, id: p.id })));
      })
      .catch(() => {
        setSubmitError("Failed to load listing");
      })
      .finally(() => setLoading(false));
  }, [listingId]);

  const onChange = useCallback(
    (field: keyof ListingFormData, value: string) => {
      setForm((p) => ({ ...p, [field]: value }));
      setErrors((p) => ({ ...p, [field]: undefined }));
    },
    [],
  );

  const stepIndex = FORM_STEPS.findIndex((s) => s.id === step);

  const saveAndAdvance = async (patchBody: Record<string, unknown>) => {
    setSubmitting(true);
    setSubmitError("");
    try {
      await apiRequest(`/api/listings/${listingId}`, {
        method: "PATCH",
        body: patchBody,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Failed to save");
      setSubmitting(false);
      return false;
    }
    setSubmitting(false);
    return true;
  };

  const goNext = async () => {
    const stepErrors = validateListingForm(form, step);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      return;
    }

    let ok = true;

    if (step === "details") {
      ok = await saveAndAdvance({
        title: form.title,
        description: form.description,
        type: form.type,
        bedrooms: parseInt(form.bedrooms),
        bathrooms: parseInt(form.bathrooms),
        sizeSqm: parseInt(form.sizeSqm),
      });
    } else if (step === "location") {
      ok = await saveAndAdvance({
        location: form.location,
        region: form.region,
        latitude: form.latitude ? parseFloat(String(form.latitude)) : undefined,
        longitude: form.longitude ? parseFloat(String(form.longitude)) : undefined,
      });
    } else if (step === "pricing") {
      ok = await saveAndAdvance({
        price: parseFloat(form.price),
        currency: form.currency,
      });
    }

    if (!ok) return;

    setErrors({});
    if (!completedSteps.includes(step)) {
      setCompletedSteps((p) => [...p, step]);
    }

    const nextIndex = stepIndex + 1;
    const nextStep = FORM_STEPS[nextIndex];
    if (nextStep) {
      setStep(nextStep.id as FormStep);
    }
  };

  const goBack = () => {
    const prevIndex = stepIndex - 1;
    const previousStep = FORM_STEPS[prevIndex];
    if (previousStep) {
      setStep(previousStep.id as FormStep);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 rounded-full border-2 border-gray-200 border-t-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <StepIndicator currentStep={step} completedSteps={completedSteps} />

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-4">
        {step === "details" && (
          <DetailsStep data={form} errors={errors} onChange={onChange} />
        )}
        {step === "location" && (
          <LocationStep data={form} errors={errors} onChange={onChange} />
        )}
        {step === "pricing" && (
          <PricingStep data={form} errors={errors} onChange={onChange} />
        )}
        {step === "photos" && (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">
                Property photos
              </h2>
              <p className="text-xs text-gray-500">
                Upload up to 10 photos. Drag to reorder. The first photo is the cover.
              </p>
            </div>
            <PhotoUploader
              listingId={listingId}
              onPhotosChange={setPhotos}
              maxPhotos={10}
            />
          </div>
        )}
        {step === "review" && (
          <ReviewStep
            data={form}
            photoCount={photos.length}
            onEdit={(s) => setStep(s as FormStep)}
          />
        )}
      </div>

      {submitError && (
        <p className="text-xs text-red-500 mb-4 text-center">{submitError}</p>
      )}

      <div className="flex gap-3">
        <button
          onClick={() => router.push("/agents/listings")}
          className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Back to listings
        </button>

        {stepIndex > 0 && (
          <button
            onClick={goBack}
            className="flex-1 py-3 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Back
          </button>
        )}

        {step !== "review" ? (
          <button
            onClick={goNext}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60 relative"
            style={{ backgroundColor: "var(--kunda-green)" }}
          >
            {submitting ? "Saving..." : saved ? "Saved!" : step === "photos" ? "Continue" : "Save and continue"}
          </button>
        ) : (
          <button
            onClick={async () => {
              setSubmitting(true);
              setSubmitError("");
              try {
                await apiRequest(`/api/listings/${listingId}`, {
                  method: "PATCH",
                  body: { status: "PENDING_REVIEW" },
                });
                router.push("/agents/listings");
              } catch (err) {
                setSubmitError(err instanceof Error ? err.message : "Submission failed");
              } finally {
                setSubmitting(false);
              }
            }}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "var(--kunda-green)" }}
          >
            {submitting ? "Submitting..." : "Resubmit for review"}
          </button>
        )}
      </div>
    </div>
  );
}
