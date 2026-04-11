"use client";

import { useState, useCallback } from "react";
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

export default function NewListingPage() {
  const router = useRouter();
  const [step, setStep] = useState<FormStep>("details");
  const [completedSteps, setCompletedSteps] = useState<FormStep[]>([]);
  const [form, setForm] = useState<ListingFormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [listingId, setListingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);

  const onChange = useCallback(
    (field: keyof ListingFormData, value: string) => {
      setForm((p) => ({ ...p, [field]: value }));
      setErrors((p) => ({ ...p, [field]: undefined }));
    },
    [],
  );

  const stepIndex = FORM_STEPS.findIndex((s) => s.id === step);

  const goNext = async () => {
    const stepErrors = validateListingForm(form, step);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      return;
    }

    if (step === "details" && !listingId) {
      setSubmitting(true);
      try {
        const res = await apiRequest<{ data: { id: string } }>(
          "/api/listings",
          {
            method: "POST",
            body: {
              title: form.title,
              description: form.description,
              type: form.type,
              bedrooms: parseInt(form.bedrooms),
              bathrooms: parseInt(form.bathrooms),
              sizeSqm: parseInt(form.sizeSqm),
              location: form.location || "TBD",
              region: form.region || "TBD",
              price: parseFloat(form.price) || 0,
              currency: form.currency,
            },
          },
        );
        setListingId(res.data.id);
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Failed to create listing",
        );
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }

    if (step === "location" && listingId) {
      setSubmitting(true);
      try {
        await apiRequest(`/api/listings/${listingId}`, {
          method: "PATCH",
          body: {
            location: form.location,
            region: form.region,
            latitude: form.latitude
              ? parseFloat(String(form.latitude))
              : undefined,
            longitude: form.longitude
              ? parseFloat(String(form.longitude))
              : undefined,
          },
        });
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Failed to save location",
        );
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }

    if (step === "pricing" && listingId) {
      setSubmitting(true);
      try {
        await apiRequest(`/api/listings/${listingId}`, {
          method: "PATCH",
          body: {
            price: parseFloat(form.price),
            currency: form.currency,
          },
        });
      } catch (err) {
        setSubmitError(
          err instanceof Error ? err.message : "Failed to save pricing",
        );
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    }

    setErrors({});
    setSubmitError("");

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

  const handleSubmit = async () => {
    if (!listingId) return;

    setSubmitting(true);
    setSubmitError("");

    try {
      await apiRequest(`/api/listings/${listingId}`, {
        method: "PATCH",
        body: {
          title: form.title,
          description: form.description,
          type: form.type,
          bedrooms: parseInt(form.bedrooms),
          bathrooms: parseInt(form.bathrooms),
          sizeSqm: parseInt(form.sizeSqm),
          location: form.location,
          region: form.region,
          price: parseFloat(form.price),
          currency: form.currency,
          latitude: form.latitude ? parseFloat(String(form.latitude)) : undefined,
          longitude: form.longitude
            ? parseFloat(String(form.longitude))
            : undefined,
        },
      });

      setSuccess(true);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Submission failed",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
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
          Listing submitted for review
        </h2>
        <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">
          Our team will review your listing within 24–48 hours. You&apos;ll receive
          an email when it&apos;s approved and live.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => router.push("/agents/listings")}
            className="px-6 py-2.5 rounded-xl text-white text-sm font-medium hover:opacity-90 transition-opacity"
            style={{ backgroundColor: "var(--kunda-green)" }}
          >
            View my listings
          </button>
          <button
            onClick={() => {
              setSuccess(false);
              setForm(EMPTY_FORM);
              setStep("details");
              setCompletedSteps([]);
              setListingId(null);
              setPhotos([]);
            }}
            className="px-6 py-2.5 rounded-xl text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Add another
          </button>
        </div>
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

        {step === "photos" && listingId && (
          <div className="space-y-4">
            <div className="mb-2">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">
                Property photos
              </h2>
              <p className="text-xs text-gray-500">
                Upload up to 10 photos. The first photo will be the cover image.
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
            className="flex-1 py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "var(--kunda-green)" }}
          >
            {submitting ? "Saving..." : step === "photos" ? "Continue" : "Save and continue"}
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 rounded-xl text-white text-sm font-medium transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: "var(--kunda-green)" }}
          >
            {submitting ? "Submitting..." : "Submit for review"}
          </button>
        )}
      </div>
    </div>
  );
}
