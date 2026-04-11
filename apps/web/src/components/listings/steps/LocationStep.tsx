import { type ListingFormData, type FormErrors, GAMBIAN_REGIONS } from "@/lib/listing-form";

type Props = {
  data: ListingFormData;
  errors: FormErrors;
  onChange: (field: keyof ListingFormData, value: string) => void;
};

const inputClass =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors bg-white";

const errorInputClass =
  "w-full px-3 py-2.5 text-sm border border-red-300 rounded-lg outline-none focus:border-red-400 transition-colors bg-white";

export default function LocationStep({ data, errors, onChange }: Props) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Region
        </label>
        <select
          value={data.region}
          onChange={(e) => onChange("region", e.target.value)}
          className={errors.region ? errorInputClass : inputClass}
        >
          <option value="">Select a region...</option>
          {GAMBIAN_REGIONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        {errors.region && (
          <p className="text-xs text-red-500 mt-1">{errors.region}</p>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Full location
        </label>
        <input
          type="text"
          placeholder="e.g. Kololi, West Coast Region"
          value={data.location}
          onChange={(e) => onChange("location", e.target.value)}
          className={errors.location ? errorInputClass : inputClass}
        />
        {errors.location && (
          <p className="text-xs text-red-500 mt-1">{errors.location}</p>
        )}
        <p className="text-xs text-gray-400 mt-1">
          Include the area name and region for clarity
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Latitude{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="number"
            step="0.000001"
            placeholder="13.4549"
            value={data.latitude ?? ""}
            onChange={(e) =>
              onChange("latitude" as keyof ListingFormData, e.target.value)
            }
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1.5">
            Longitude{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="number"
            step="0.000001"
            placeholder="-16.7041"
            value={data.longitude ?? ""}
            onChange={(e) =>
              onChange("longitude" as keyof ListingFormData, e.target.value)
            }
            className={inputClass}
          />
        </div>
      </div>

      <div className="p-4 rounded-xl border border-gray-100 bg-white">
        <p className="text-xs font-medium text-gray-700 mb-1">
          How to find coordinates
        </p>
        <p className="text-xs text-gray-500 leading-relaxed">
          Open Google Maps, right-click your property location, and click the
          coordinates at the top of the menu. They&apos;ll be copied to your
          clipboard in latitude, longitude format.
        </p>
      </div>
    </div>
  );
}
