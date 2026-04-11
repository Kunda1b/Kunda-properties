import { type ListingFormData, type FormErrors, CURRENCIES } from "@/lib/listing-form";

type Props = {
  data: ListingFormData;
  errors: FormErrors;
  onChange: (field: keyof ListingFormData, value: string) => void;
};

const inputClass =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:border-gray-400 transition-colors bg-white";

function formatPreview(price: string, currency: string): string {
  const num = parseFloat(price);
  if (isNaN(num)) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(num);
}

export default function PricingStep({ data, errors, onChange }: Props) {
  const price = parseFloat(data.price) || 0;
  const fee = parseFloat(((price * 1.5) / 100).toFixed(2));
  const buyerTotal = price + fee;

  return (
    <div className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1.5">
          Asking price
        </label>
        <div className="flex gap-2">
          <select
            value={data.currency}
            onChange={(e) => onChange("currency", e.target.value)}
            className={inputClass}
            style={{ maxWidth: "200px" }}
          >
            {CURRENCIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="0"
            min="0"
            value={data.price}
            onChange={(e) => onChange("price", e.target.value)}
            className={
              errors.price
                ? inputClass.replace("border-gray-200", "border-red-300")
                : inputClass
            }
          />
        </div>
        {errors.price && (
          <p className="text-xs text-red-500 mt-1">{errors.price}</p>
        )}
      </div>

      {price > 0 && (
        <div className="rounded-xl border border-gray-100 overflow-hidden">
          <div
            className="px-4 py-3 border-b border-gray-100"
            style={{ backgroundColor: "var(--kunda-green-light)" }}
          >
            <p
              className="text-xs font-medium"
              style={{ color: "var(--kunda-green)" }}
            >
              Buyer will see
            </p>
          </div>
          <div className="p-4 bg-white space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Your asking price</span>
              <span className="font-medium">
                {formatPreview(data.price, data.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Kunda platform fee (1.5%)</span>
              <span className="font-medium">
                {formatPreview(String(fee), data.currency)}
              </span>
            </div>
            <div className="flex justify-between text-sm font-semibold border-t border-gray-100 pt-2 mt-1">
              <span>Buyer total</span>
              <span style={{ color: "var(--kunda-green)" }}>
                {formatPreview(String(buyerTotal), data.currency)}
              </span>
            </div>
          </div>
        </div>
      )}

      <div
        className="p-4 rounded-xl"
        style={{ backgroundColor: "var(--kunda-green-light)" }}
      >
        <p
          className="text-xs font-medium mb-1"
          style={{ color: "var(--kunda-green)" }}
        >
          How seller payment works
        </p>
        <p
          className="text-xs leading-relaxed"
          style={{ color: "#085041" }}
        >
          You receive your asking price in full via Wave or Orange Money. The
          1.5% Kunda fee is charged to the buyer on top of your price. Payment
          is made in GMD at the prevailing exchange rate upon completion.
        </p>
      </div>
    </div>
  );
}
