"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, DollarSign, Loader2, Globe } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { AdminHeader } from "@/components/layout/AdminHeader";

const CURRENCY_PAIRS = [
  { from: "USD", to: "GMD", label: "USD → GMD", flag: "🇺🇸→🇬🇲" },
  { from: "GBP", to: "GMD", label: "GBP → GMD", flag: "🇬🇧→🇬🇲" },
  { from: "EUR", to: "GMD", label: "EUR → GMD", flag: "🇪🇺→🇬🇲" },
  { from: "GMD", to: "USD", label: "GMD → USD", flag: "🇬🇲→🇺🇸" },
];

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const [rates, setRates] = useState<Record<string,string>>({});

  const { isLoading } = useQuery({
    queryKey: ["admin-rates"], queryFn: () => adminApi.getRates().then((r) => {
      const map: Record<string,string> = {};
      r.data.data.forEach((rate: any) => { map[`${rate.fromCurrency}_${rate.toCurrency}`] = String(rate.rate); });
      setRates(map); return r.data.data;
    }),
  });
  const updateRate = useMutation({ mutationFn: ({ from, to, rate }: any) => adminApi.updateRate(from, to, rate), onSuccess: () => { toast.success("Rate updated"); qc.invalidateQueries({ queryKey: ["admin-rates"] }); } });

  return (
    <div>
      <AdminHeader title="Settings" subtitle="Platform configuration and exchange rates" />
      <div className="p-6 space-y-6 max-w-3xl">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5"><div className="w-9 h-9 bg-kunda-50 rounded-lg flex items-center justify-center"><Globe className="w-5 h-5 text-kunda-700"/></div><div><h2 className="font-semibold text-gray-900">Platform Settings</h2></div></div>
          <div className="grid grid-cols-2 gap-4">
            {[["Platform Fee (%)","2.5"],["Inspection Period (days)","14"],["Offer Expiry (days)","7"],["Max Images per Listing","20"]].map(([label,value]) => (
              <div key={label as string}><label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{label}</label><input type="number" defaultValue={value} className="input-field"/></div>
            ))}
          </div>
          <button className="btn-primary mt-5 flex items-center gap-2"><Save className="w-4 h-4"/> Save Settings</button>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5"><div className="w-9 h-9 bg-sand-100 rounded-lg flex items-center justify-center"><DollarSign className="w-5 h-5 text-sand-500"/></div><h2 className="font-semibold text-gray-900">Exchange Rates</h2></div>
          {isLoading ? <Loader2 className="w-6 h-6 animate-spin text-kunda-600"/> : (
            <div className="space-y-3">
              {CURRENCY_PAIRS.map(({ from, to, label, flag }) => { const key = `${from}_${to}`; return (
                <div key={key} className="flex items-center gap-3">
                  <span className="text-lg">{flag}</span><span className="text-sm font-medium text-gray-700 w-28">{label}</span>
                  <input type="number" step="0.0001" value={rates[key]||""} onChange={(e) => setRates((p) => ({...p,[key]:e.target.value}))} className="input-field flex-1"/>
                  <button onClick={() => updateRate.mutate({ from, to, rate: parseFloat(rates[key]) })} className="btn-primary px-3 py-2"><Save className="w-4 h-4"/></button>
                </div>
              ); })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
