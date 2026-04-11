import { type ListingFormData, type FormErrors, PROPERTY_TYPES } from "@/lib/listing-form";

type Props = {
  data: ListingFormData;
  errors: FormErrors;
  onChange: (field: keyof ListingFormData, value: string) => void;
};

const inputClass =
  "w-full px-3 py-2.5 text-sm border rounded-lg outline-none focus:border-gray-400 transition-colors bg-white";

const errorInputClass =
  "w-full px-3 py-2.5 text-sm border border-red-300 rounded-lg outline-none focus:border-red-400 transition-colors bg-white";

export default function DetailsStep({ data, errors, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Property title
        </label>
        <input
          type="text"
          placeholder="e.g. Spacious family compound in Kololi"
          value={data.title}
          onChange={(e) => onChange("title", e.target.value)}
          className={errors.title ? errorInputClass : inputClass}
        />
        {errors.title && (
          <p className="text-xs text-red-500 mt-1">{errors.title}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          {data.title.length}/150 characters
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Property type
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => onChange("type", type.value)}
              className="px-3 py-2.5 rounded-lg text-xs font-medium border transition-colors text-center"
              style={
                data.type === type.value
                  ? {
                      backgroundColor: "var(--kunda-green)",
                      color: "white",
                      borderColor: "var(--kunda-green)",
                    }
                  : {
                      backgroundColor: "white",
                      color: "#555",
                      borderColor: "#e5e7eb",
                    }
              }
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Bedrooms
          </label>
          <select
            value={data.bedrooms}
            onChange={(e) => onChange("bedrooms", e.target.value)}
            className={inputClass}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "N/A" : n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Bathrooms
          </label>
          <select
            value={data.bathrooms}
            onChange={(e) => onChange("bathrooms", e.target.value)}
            className={inputClass}
          >
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>
                {n === 0 ? "N/A" : n}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Size (m²)
          </label>
          <input
            type="number"
            placeholder="0"
            min="0"
            value={data.sizeSqm}
            onChange={(e) => onChange("sizeSqm", e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Description
        </label>
        <textarea
          rows={6}
          placeholder="Describe the property in detail — location advantages, building condition, utilities (water, electricity, generator), nearby landmarks, and what makes it a good investment..."
          value={data.description}
          onChange={(e) => onChange("description", e.target.value)}
          className={
            (errors.description ? errorInputClass : inputClass) + " resize-none"
          }
        />
        {errors.description ? (
          <p className="text-xs text-red-500 mt-1">{errors.description}</p>
        ) : (
          <p className="text-xs text-gray-400 mt-1">
            {data.description.length} characters · minimum 50
          </p>
        )}
      </div>
    </div>
  );
}
