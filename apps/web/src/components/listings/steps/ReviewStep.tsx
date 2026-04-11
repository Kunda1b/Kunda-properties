import {
  type ListingFormData,
  PROPERTY_TYPES,
} from "@/lib/listing-form";

type Props = {
  data: ListingFormData;
  photoCount: number;
  onEdit: (step: string) => void;
};

function formatPrice(price: string, currency: string): string {
  const num = parseFloat(price);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

export default function ReviewStep({ data, photoCount, onEdit }: Props) {
  const typeLabel =
    PROPERTY_TYPES.find((t) => t.value === data.type)?.label || data.type;

  const sections = [
    {
      title: "Property details",
      step: "details",
      fields: [
        { label: "Title", value: data.title },
        { label: "Type", value: typeLabel },
        {
          label: "Bedrooms",
          value: data.bedrooms === "0" ? "N/A" : data.bedrooms,
        },
        {
          label: "Bathrooms",
          value: data.bathrooms === "0" ? "N/A" : data.bathrooms,
        },
        {
          label: "Size",
          value: data.sizeSqm === "0" ? "N/A" : `${data.sizeSqm} m²`,
        },
      ],
    },
    {
      title: "Location",
      step: "location",
      fields: [
        { label: "Full location", value: data.location },
        { label: "Region", value: data.region },
        {
          label: "Coordinates",
          value:
            data.latitude && data.longitude
              ? `${data.latitude}, ${data.longitude}`
              : "Not set",
        },
      ],
    },
    {
      title: "Pricing",
      step: "pricing",
      fields: [
        {
          label: "Asking price",
          value: formatPrice(data.price, data.currency),
        },
        { label: "Currency", value: data.currency },
      ],
    },
    {
      title: "Photos",
      step: "photos",
      fields: [
        {
          label: "Uploaded",
          value:
            photoCount > 0
              ? `${photoCount} photo${photoCount > 1 ? "s" : ""}`
              : "No photos uploaded",
        },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div
        className="p-3 rounded-lg text-xs"
        style={{
          backgroundColor: "var(--kunda-gold-soft)",
          color: "var(--kunda-gold)",
        }}
      >
        Your listing will be reviewed by the Kunda team before going live. This
        usually takes 24–48 hours.
      </div>

      {sections.map((section) => (
        <div
          key={section.title}
          className="bg-white rounded-xl border border-gray-100 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50">
            <h3 className="text-xs font-semibold text-gray-900">
              {section.title}
            </h3>
            <button
              onClick={() => onEdit(section.step)}
              className="text-xs font-medium hover:underline"
              style={{ color: "var(--kunda-green)" }}
            >
              Edit
            </button>
          </div>
          <div className="p-4 space-y-2">
            {section.fields.map((field) => (
              <div
                key={field.label}
                className="flex items-start justify-between gap-4"
              >
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {field.label}
                </span>
                <span className="text-xs font-medium text-gray-900 text-right">
                  {field.value || "—"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {data.description && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <h3 className="text-xs font-semibold text-gray-900 mb-2">
            Description
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed">
            {data.description}
          </p>
        </div>
      )}
    </div>
  );
}
