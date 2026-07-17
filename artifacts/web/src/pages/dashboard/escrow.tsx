import { useQuery } from "@tanstack/react-query";
import { DollarSign, AlertTriangle } from "lucide-react";
import { escrowApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { ESCROW_STATUS_LABELS } from "@/lib/utils";

export default function EscrowPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-escrows"],
    queryFn: () => escrowApi.getMine().then((r) => r.data.data),
    retry: 1,
  });

  const escrows = data?.escrows || [];

  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Escrow Transactions</h1>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}
        </div>
      )}

      {!isLoading && escrows.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <DollarSign className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <h3 className="font-display text-lg font-bold text-gray-900 mb-2">No escrow transactions</h3>
          <p className="text-gray-500 text-sm">When you buy or sell a property, escrow transactions will appear here.</p>
        </div>
      )}

      <div className="space-y-3">
        {escrows.map((escrow: any) => {
          const status = ESCROW_STATUS_LABELS[escrow.status];
          return (
            <div key={escrow.id} className={`bg-white rounded-xl border p-5 flex items-center gap-4 ${escrow.status === "DISPUTED" ? "border-red-200" : "border-gray-100"}`}>
              <div className="w-12 h-12 rounded-lg bg-kunda-50 flex items-center justify-center flex-shrink-0">
                {escrow.status === "DISPUTED" ? <AlertTriangle className="w-5 h-5 text-red-500" /> : <DollarSign className="w-5 h-5 text-kunda-700" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-gray-400 mb-1">{escrow.referenceNumber}</p>
                <h3 className="font-semibold text-gray-900 truncate">{escrow.listing?.title || "Property"}</h3>
                <p className="text-sm font-bold text-kunda-700 mt-1">{formatPrice(Number(escrow.totalAmount), escrow.currency)}</p>
              </div>
              <div>
                <span className={`badge ${status?.color || "bg-gray-100 text-gray-600"}`}>{status?.label || escrow.status}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
