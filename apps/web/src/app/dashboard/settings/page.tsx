"use client";

import { useLocalStorageState } from "@/hooks/use-local-storage-state";

const CURRENCIES = ["GBP", "EUR", "USD"];
const REGIONS = ["West Coast", "Kanifing", "Banjul", "North Bank", "Central River"];

export default function SettingsPage() {
  const { isHydrated, setValue: setSettings, value: settings } =
    useLocalStorageState("kunda.account-settings", {
      currency: "GBP",
      emailAlerts: true,
      preferredRegion: "West Coast",
    });

  if (!isHydrated) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl bg-kunda-forest-soft/30" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Currency */}
      <div className="surface-card rounded-2xl p-5">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
            Preferred currency
          </span>
          <p className="mt-0.5 text-sm text-kunda-muted">
            Property prices will display in this currency where possible
          </p>
          <div className="mt-3 flex gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() =>
                  setSettings((prev) => ({ ...prev, currency: c }))
                }
                className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  settings.currency === c
                    ? "bg-kunda-forest text-white shadow-sm"
                    : "bg-white border border-kunda-border text-kunda-muted hover:text-kunda-ink"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </label>
      </div>

      {/* Region */}
      <div className="surface-card rounded-2xl p-5">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
            Preferred region
          </span>
          <p className="mt-0.5 text-sm text-kunda-muted">
            We&apos;ll prioritize listings in this area
          </p>
          <select
            value={settings.preferredRegion}
            onChange={(e) =>
              setSettings((prev) => ({
                ...prev,
                preferredRegion: e.target.value,
              }))
            }
            className="input-field mt-3 max-w-xs cursor-pointer"
          >
            {REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Email Alerts */}
      <div className="surface-card rounded-2xl p-5">
        <label className="flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-kunda-muted">
              Email alerts
            </span>
            <p className="mt-0.5 text-sm text-kunda-muted">
              Receive updates when saved listings change price or status
            </p>
          </div>
          <div className="relative">
            <input
              type="checkbox"
              checked={settings.emailAlerts}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  emailAlerts: e.target.checked,
                }))
              }
              className="peer sr-only"
            />
            <div
              onClick={() =>
                setSettings((prev) => ({
                  ...prev,
                  emailAlerts: !prev.emailAlerts,
                }))
              }
              className={`h-7 w-12 cursor-pointer rounded-full transition-colors duration-200 ${
                settings.emailAlerts ? "bg-kunda-forest" : "bg-kunda-border"
              }`}
            >
              <div
                className={`mt-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  settings.emailAlerts ? "translate-x-5.5" : "translate-x-0.5"
                }`}
              />
            </div>
          </div>
        </label>
      </div>

      {/* Danger Zone */}
      <div className="surface-card rounded-2xl border-red-100 p-5">
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
          Danger zone
        </span>
        <p className="mt-1 text-sm text-kunda-muted">
          Permanently delete your account and all associated data.
        </p>
        <button
          type="button"
          className="mt-3 rounded-xl border border-red-200 px-4 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
        >
          Delete account
        </button>
      </div>
    </div>
  );
}
