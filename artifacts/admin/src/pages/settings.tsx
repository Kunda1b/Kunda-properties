import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit2, Save, X, Settings, RefreshCw } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import toast from "react-hot-toast";
import { exchangeRatesAdminApi } from "@/lib/api";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<string>("");

  const { data: rates, isLoading } = useQuery({
    queryKey: ["admin-exchange-rates"],
    queryFn: () => exchangeRatesAdminApi.getAll().then((r) => r.data.data),
    retry: 1,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, rate }: { id: string; rate: number }) =>
      exchangeRatesAdminApi.update(id, rate),
    onSuccess: () => {
      toast.success("Exchange rate updated");
      queryClient.invalidateQueries({ queryKey: ["admin-exchange-rates"] });
      setEditingId(null);
      setEditingRate("");
    },
    onError: () => {
      toast.error("Failed to update exchange rate");
    },
  });

  const handleEdit = (rate: any) => {
    setEditingId(rate.id);
    setEditingRate(String(rate.rate));
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingRate("");
  };

  const handleSave = (id: string) => {
    const parsed = parseFloat(editingRate);
    if (isNaN(parsed) || parsed <= 0) {
      toast.error("Enter a valid positive rate");
      return;
    }
    updateMutation.mutate({ id, rate: parsed });
  };

  return (
    <div>
      <AdminHeader title="Settings" subtitle="Platform configuration and exchange rates" />

      <div className="space-y-6">
        {/* Exchange Rates Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-kunda-50">
              <RefreshCw className="w-5 h-5 text-kunda-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Exchange Rates</h2>
              <p className="text-xs text-gray-500">Manage currency conversion rates</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 font-medium text-gray-600">From Currency</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">To Currency</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Rate</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Last Updated</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading &&
                  [1, 2, 3].map((i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded w-16 animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded w-16 animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded w-20 animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded w-24 animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded w-28 animate-pulse" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded w-16 animate-pulse" />
                      </td>
                    </tr>
                  ))}

                {!isLoading && (!rates || rates.length === 0) && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-gray-400 text-sm">
                      No exchange rates found
                    </td>
                  </tr>
                )}

                {!isLoading &&
                  rates &&
                  rates.map((rate: any) => (
                    <tr key={rate.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {rate.fromCurrency || rate.from}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {rate.toCurrency || rate.to}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === rate.id ? (
                          <input
                            type="number"
                            step="any"
                            value={editingRate}
                            onChange={(e) => setEditingRate(e.target.value)}
                            className="border border-kunda-700 rounded px-2 py-1 text-sm w-28 outline-none focus:ring-2 focus:ring-kunda-700/30"
                            autoFocus
                          />
                        ) : (
                          <span className="font-mono text-gray-900">
                            {typeof rate.rate === "number" ? rate.rate.toFixed(6) : rate.rate}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <span className="badge bg-gray-100 text-gray-600">
                          {rate.source || "Manual"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {rate.updatedAt
                          ? new Date(rate.updatedAt).toLocaleString()
                          : rate.lastUpdated
                          ? new Date(rate.lastUpdated).toLocaleString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {editingId === rate.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSave(rate.id)}
                              disabled={updateMutation.isPending}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-kunda-700 text-white text-xs font-medium hover:bg-kunda-800 disabled:opacity-50 transition-colors"
                            >
                              <Save className="w-3 h-3" />
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors"
                            >
                              <X className="w-3 h-3" />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(rate)}
                            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-kunda-50 hover:text-kunda-700 transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Settings Info Card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2 rounded-lg bg-kunda-50">
              <Settings className="w-5 h-5 text-kunda-700" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">Platform Settings</h2>
              <p className="text-xs text-gray-500">Read-only configuration overview</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-sand-50 border border-sand-200">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Platform Fee</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  2.5%{" "}
                  <span className="text-gray-400 text-xs">
                    (configurable via PLATFORM_FEE_PERCENT env var)
                  </span>
                </p>
              </div>
              <span className="badge bg-kunda-100 text-kunda-700">Active</span>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg bg-sand-50 border border-sand-200">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">KYC Verification</p>
                <p className="text-sm text-gray-600 mt-0.5">
                  Required before offers and escrow
                </p>
              </div>
              <span className="badge bg-green-100 text-green-700">Enforced</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
