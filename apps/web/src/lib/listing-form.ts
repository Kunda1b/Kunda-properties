export type ListingFormData = {
  title: string;
  description: string;
  location: string;
  region: string;
  latitude?: number;
  longitude?: number;
  price: string;
  currency: string;
  bedrooms: string;
  bathrooms: string;
  sizeSqm: string;
  type: "HOUSE" | "LAND" | "APARTMENT" | "COMMERCIAL";
};

export type FormErrors = Partial<Record<keyof ListingFormData, string>>;

export const PROPERTY_TYPES = [
  { value: "HOUSE", label: "House / Compound" },
  { value: "LAND", label: "Land / Plot" },
  { value: "APARTMENT", label: "Apartment" },
  { value: "COMMERCIAL", label: "Commercial" },
] as const;

export const CURRENCIES = [
  { value: "GBP", label: "GBP (£) — British Pound" },
  { value: "EUR", label: "EUR (€) — Euro" },
  { value: "USD", label: "USD ($) — US Dollar" },
  { value: "GMD", label: "GMD — Gambian Dalasi" },
] as const;

export const GAMBIAN_REGIONS = [
  "Banjul Capital City",
  "West Coast Region",
  "North Bank Region",
  "Lower River Region",
  "Central River Region",
  "Upper River Region",
] as const;

export const FORM_STEPS = [
  { id: "details", label: "Details" },
  { id: "location", label: "Location" },
  { id: "pricing", label: "Pricing" },
  { id: "photos", label: "Photos" },
  { id: "review", label: "Review" },
] as const;

export type FormStep = (typeof FORM_STEPS)[number]["id"];

export function validateListingForm(
  data: ListingFormData,
  step: FormStep,
): FormErrors {
  const errors: FormErrors = {};

  if (step === "details" || step === "review") {
    if (!data.title.trim() || data.title.length < 10) {
      errors.title = "Title must be at least 10 characters";
    }
    if (!data.description.trim() || data.description.length < 50) {
      errors.description = "Description must be at least 50 characters";
    }
    if (!data.type) {
      errors.type = "Please select a property type";
    }
  }

  if (step === "location" || step === "review") {
    if (!data.location.trim()) {
      errors.location = "Location is required";
    }
    if (!data.region) {
      errors.region = "Please select a region";
    }
  }

  if (step === "pricing" || step === "review") {
    const price = parseFloat(data.price);
    if (!data.price || isNaN(price) || price <= 0) {
      errors.price = "Enter a valid price";
    }
  }

  return errors;
}

export const EMPTY_FORM: ListingFormData = {
  title: "",
  description: "",
  location: "",
  region: "",
  price: "",
  currency: "GBP",
  bedrooms: "0",
  bathrooms: "0",
  sizeSqm: "0",
  type: "HOUSE",
};
