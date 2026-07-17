import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { escrowAdminApi } from "@/lib/api";
import { ESCROW_STATUS_COLORS, formatPrice, formatRelativeTime } from "@/lib/utils";

export default function EscrowPage() {
  const [status, setStatus] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-escrow", { status }],
    queryFn: () => escrowAdminApi.getAll(status ? { status } : {}).then((r) => r.data.data),
    retry: 1,
  });

  const escrows = data?.escrows || data || [];

  return (
    <div>
      <AdminHeader title="Escrow" subtitle="Monitor all escrow transactions" />
      <div className="flex flex-wrap gap-2 mb-6">
        {["", "INITIATED", "FUNDED", "DISPUTED", "RELEASED", "REFUNDED"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              status === s ? "bg-kunda-700 text-white border-kunda-700" : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading && <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>}
        {!isLoading && escrows.length === 0 && (
          <div className="p-12 text-center">
            <DollarSign className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No escrow transactions found</p>
          </div>
        )}
        <div className="divide-y divide-gray-100">
          {escrows.map((escrow: any) => (
            <div key={escrow.id} className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-mono text-xs text-gray-400">{escrow.referenceNumber}</p>
                <p className="font-medium text-gray-900 text-sm mt-0.5 truncate">{escrow.listing?.title || "Property"}</p>
                <p className="text-xs text-gray-500">
                  Buyer: {escrow.buyer?.profile?.firstName} {escrow.buyer?.profile?.lastName}
                </p>
                {escrow.createdAt && (
                  <p className="text-xs text-gray-400">{formatRelativeTime(escrow.createdAt)}</p>
                )}
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatPrice(Number(escrow.totalAmount), escrow.currency || "GBP")}</p>
                <span className={`badge mt-1 ${ESCROW_STATUS_COLORS[escrow.status] || "bg-gray-100 text-gray-600"}`}>
                  {escrow.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
