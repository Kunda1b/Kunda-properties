import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, ArrowUpRight, RotateCcw, X, Loader2 } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { escrowAdminApi } from "@/lib/api";
import { ESCROW_STATUS_COLORS, formatPrice, formatRelativeTime } from "@/lib/utils";
import toast from "react-hot-toast";

type ActionType = "release" | "refund";

interface ModalState {
  escrow: any;
  action: ActionType;
  notes: string;
}

const ACTION_ELIGIBLE_STATUSES = new Set(["FUNDED", "INSPECTING", "APPROVED", "DISPUTED"]);

export default function EscrowPage() {
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState<ModalState | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-escrow", { status }],
    queryFn: () => escrowAdminApi.getAll(status ? { status } : {}).then((r) => r.data.data),
    retry: 1,
  });

  const releaseMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      escrowAdminApi.forceRelease(id, notes),
    onSuccess: () => {
      toast.success("Funds released to seller");
      qc.invalidateQueries({ queryKey: ["admin-escrow"] });
      setModal(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to release funds"),
  });

  const refundMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) =>
      escrowAdminApi.forceRefund(id, notes),
    onSuccess: () => {
      toast.success("Funds refunded to buyer");
      qc.invalidateQueries({ queryKey: ["admin-escrow"] });
      setModal(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to refund"),
  });

  const handleConfirm = () => {
    if (!modal) return;
    if (!modal.notes.trim()) {
      toast.error("Admin notes are required");
      return;
    }
    if (modal.action === "release") {
      releaseMutation.mutate({ id: modal.escrow.id, notes: modal.notes });
    } else {
      refundMutation.mutate({ id: modal.escrow.id, notes: modal.notes });
    }
  };

  const isPending = releaseMutation.isPending || refundMutation.isPending;

  const escrows = data?.escrows || data || [];

  return (
    <div>
      <AdminHeader title="Escrow" subtitle="Monitor all escrow transactions" />

      <div className="flex flex-wrap gap-2 mb-6">
        {["", "INITIATED", "FUNDED", "INSPECTING", "APPROVED", "DISPUTED", "RELEASED", "REFUNDED"].map((s) => (
          <button
            key={s || "all"}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              status === s
                ? "bg-kunda-700 text-white border-kunda-700"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading && (
          <div className="p-8 text-center text-gray-500 text-sm">Loading…</div>
        )}
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
                <p className="font-medium text-gray-900 text-sm mt-0.5 truncate">
                  {escrow.listing?.title || "Property"}
                </p>
                <p className="text-xs text-gray-500">
                  Buyer: {escrow.buyer?.profile?.firstName} {escrow.buyer?.profile?.lastName}
                  {" · "}
                  Seller: {escrow.seller?.profile?.firstName} {escrow.seller?.profile?.lastName}
                </p>
                {escrow.createdAt && (
                  <p className="text-xs text-gray-400 mt-0.5">{formatRelativeTime(escrow.createdAt)}</p>
                )}
              </div>

              <div className="text-right flex-shrink-0">
                <p className="font-bold text-gray-900">
                  {formatPrice(Number(escrow.totalAmount), escrow.currency || "USD")}
                </p>
                <span className={`badge mt-1 ${ESCROW_STATUS_COLORS[escrow.status] || "bg-gray-100 text-gray-600"}`}>
                  {escrow.status}
                </span>
              </div>

              {ACTION_ELIGIBLE_STATUSES.has(escrow.status) && (
                <div className="flex flex-col gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => setModal({ escrow, action: "release", notes: "" })}
                    className="flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" /> Release
                  </button>
                  <button
                    onClick={() => setModal({ escrow, action: "refund", notes: "" })}
                    className="flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Refund
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">
                {modal.action === "release" ? "Force-Release Funds" : "Force-Refund to Buyer"}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                <p className="font-medium text-gray-900 truncate">
                  {modal.escrow.listing?.title || "Property"}
                </p>
                <p className="text-gray-500 mt-0.5">
                  {formatPrice(Number(modal.escrow.totalAmount), modal.escrow.currency || "USD")}
                  {" · "}
                  Ref: {modal.escrow.referenceNumber}
                </p>
              </div>

              {modal.action === "release" ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
                  This will mark the escrow as <strong>RELEASED</strong> and update the listing to <strong>SOLD</strong>. Funds will be paid out to the seller.
                </div>
              ) : (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-xs text-orange-800">
                  This will mark the escrow as <strong>REFUNDED</strong>. Funds will be returned to the buyer. This cannot be undone.
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Admin notes <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={modal.notes}
                  onChange={(e) => setModal((m) => m ? { ...m, notes: e.target.value } : m)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="Reason for this action (logged in audit trail)…"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setModal(null)}
                  disabled={isPending}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={isPending || !modal.notes.trim()}
                  className={`flex-1 flex items-center justify-center gap-2 font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50 text-white ${
                    modal.action === "release"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isPending
                    ? "Processing…"
                    : modal.action === "release"
                    ? "Confirm Release"
                    : "Confirm Refund"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
