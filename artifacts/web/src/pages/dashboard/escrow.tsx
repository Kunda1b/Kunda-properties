import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DollarSign, AlertTriangle, CheckCircle, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { escrowApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/auth.store";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  INITIATED:  { label: "Initiated",         color: "bg-blue-100 text-blue-700" },
  FUNDED:     { label: "Funded",            color: "bg-indigo-100 text-indigo-700" },
  INSPECTING: { label: "Inspection Period", color: "bg-yellow-100 text-yellow-700" },
  APPROVED:   { label: "Approved",          color: "bg-green-100 text-green-700" },
  RELEASED:   { label: "Released",          color: "bg-green-100 text-green-700" },
  DISPUTED:   { label: "Disputed",          color: "bg-red-100 text-red-700" },
  CANCELLED:  { label: "Cancelled",         color: "bg-gray-100 text-gray-600" },
  REFUNDED:   { label: "Refunded",          color: "bg-gray-100 text-gray-600" },
};

function EscrowCard({ escrow }: { escrow: any }) {
  const user = useAuthStore((s) => s.user);
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeCategory, setDisputeCategory] = useState("");
  const [showDisputeForm, setShowDisputeForm] = useState(false);

  const isBuyer = user?.id === escrow.buyerId;
  const status = STATUS_LABELS[escrow.status] || { label: escrow.status, color: "bg-gray-100 text-gray-600" };

  const fundMutation = useMutation({
    mutationFn: () => escrowApi.createPayment(escrow.id),
    onSuccess: () => { toast.success("Escrow funded! 14-day inspection period started."); qc.invalidateQueries({ queryKey: ["my-escrows"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Payment failed"),
  });

  const approveMutation = useMutation({
    mutationFn: () => escrowApi.approve(escrow.id),
    onSuccess: () => { toast.success("Release approved! Admin will process the payout."); qc.invalidateQueries({ queryKey: ["my-escrows"] }); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to approve"),
  });

  const disputeMutation = useMutation({
    mutationFn: () => escrowApi.dispute(escrow.id, disputeCategory ? `[${disputeCategory}] ${disputeReason}` : disputeReason),
    onSuccess: () => { toast.success("Dispute raised. Our team will review within 48 hours."); qc.invalidateQueries({ queryKey: ["my-escrows"] }); setShowDisputeForm(false); },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to raise dispute"),
  });

  const inspectionDeadline = escrow.inspectionDeadline ? new Date(escrow.inspectionDeadline) : null;
  const daysLeft = inspectionDeadline ? Math.max(0, Math.ceil((inspectionDeadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : null;

  return (
    <div className={cn("bg-white rounded-xl border p-5", escrow.status === "DISPUTED" ? "border-red-200" : "border-gray-100")}>
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-lg bg-kunda-50 flex items-center justify-center flex-shrink-0">
          {escrow.status === "DISPUTED"
            ? <AlertTriangle className="w-5 h-5 text-red-500" />
            : escrow.status === "APPROVED" || escrow.status === "RELEASED"
              ? <CheckCircle className="w-5 h-5 text-green-600" />
              : <DollarSign className="w-5 h-5 text-kunda-700" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs text-gray-400 mb-0.5">{escrow.referenceNumber}</p>
          <h3 className="font-semibold text-gray-900 truncate">{escrow.listing?.title || "Property"}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{escrow.listing?.region}</p>
          <p className="text-sm font-bold text-kunda-700 mt-1">{formatPrice(Number(escrow.totalAmount), escrow.currency)}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={cn("badge text-xs", status.color)}>{status.label}</span>
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 p-1">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
          {/* Parties */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-gray-400 mb-1">Buyer</p>
              <p className="font-medium text-gray-900">{escrow.buyer?.profile?.firstName} {escrow.buyer?.profile?.lastName}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Seller</p>
              <p className="font-medium text-gray-900">{escrow.seller?.profile?.firstName} {escrow.seller?.profile?.lastName}</p>
            </div>
          </div>

          {/* Milestone timeline */}
          {escrow.milestones?.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 mb-2">Milestones</p>
              <div className="space-y-2">
                {escrow.milestones.map((m: any, i: number) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0",
                      m.status === "COMPLETED" ? "bg-green-500 text-white" : i === 0 && ["FUNDED","INSPECTING","APPROVED","RELEASED"].includes(escrow.status) ? "bg-kunda-700 text-white" : "bg-gray-100 text-gray-400")}>
                      {m.status === "COMPLETED" ? "✓" : i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{m.title}</p>
                      <p className="text-xs text-gray-500">{m.description}</p>
                    </div>
                    {Number(m.amount) > 0 && <span className="text-xs font-medium text-gray-700">{formatPrice(Number(m.amount), escrow.currency)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inspection countdown */}
          {(escrow.status === "FUNDED" || escrow.status === "INSPECTING") && daysLeft !== null && (
            <div className="bg-yellow-50 rounded-lg p-3 text-sm">
              <p className="font-medium text-yellow-800">⏱ Inspection period: <span className="font-bold">{daysLeft} day{daysLeft !== 1 ? "s" : ""} left</span></p>
              <p className="text-xs text-yellow-700 mt-0.5">Inspect the property carefully. Approve release when satisfied, or raise a dispute.</p>
            </div>
          )}

          {/* Platform fee breakdown */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs space-y-1">
            <div className="flex justify-between text-gray-600"><span>Property price</span><span>{formatPrice(Number(escrow.totalAmount), escrow.currency)}</span></div>
            <div className="flex justify-between text-gray-600"><span>Platform fee ({escrow.platformFeePercent}%)</span><span>{formatPrice(Number(escrow.platformFeeAmount), escrow.currency)}</span></div>
            <div className="flex justify-between font-medium text-gray-900 pt-1 border-t border-gray-200"><span>Seller receives</span><span>{formatPrice(Number(escrow.sellerPayoutAmount), escrow.currency)}</span></div>
          </div>

          {/* Buyer actions */}
          {isBuyer && (
            <div className="flex flex-wrap gap-2">
              {escrow.status === "INITIATED" && (
                <button onClick={() => fundMutation.mutate()} disabled={fundMutation.isPending}
                  className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                  {fundMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Fund Escrow
                </button>
              )}
              {(escrow.status === "FUNDED" || escrow.status === "INSPECTING") && (
                <>
                  <button onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending}
                    className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
                    {approveMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Approve Release
                  </button>
                  <button onClick={() => setShowDisputeForm(!showDisputeForm)}
                    className="text-sm border border-red-200 text-red-600 rounded-lg py-2 px-4 hover:bg-red-50">
                    Raise Dispute
                  </button>
                </>
              )}
            </div>
          )}

          {/* Seller: raise dispute */}
          {!isBuyer && (escrow.status === "FUNDED" || escrow.status === "INSPECTING") && (
            <button onClick={() => setShowDisputeForm(!showDisputeForm)}
              className="text-sm border border-red-200 text-red-600 rounded-lg py-2 px-4 hover:bg-red-50">
              Raise Dispute
            </button>
          )}

          {showDisputeForm && (
            <div className="bg-red-50 rounded-lg p-4 space-y-3">
              <p className="text-sm font-medium text-red-800">Raise a Dispute</p>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Issue Category</label>
                <select
                  value={disputeCategory}
                  onChange={(e) => setDisputeCategory(e.target.value)}
                  className="input-field text-sm"
                >
                  <option value="">Select a category…</option>
                  <option value="Property condition mismatch">Property condition doesn't match listing</option>
                  <option value="Seller unresponsive">Seller is unresponsive</option>
                  <option value="Title deed issue">Title deed or ownership dispute</option>
                  <option value="Fraudulent listing">Suspected fraud or misrepresentation</option>
                  <option value="Inspection failed">Inspection revealed major defects</option>
                  <option value="Other">Other issue</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Describe the issue <span className="text-gray-400 font-normal">({Math.max(0, 20 - disputeReason.length)} chars min)</span>
                </label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  rows={4}
                  className="input-field resize-none text-sm"
                  placeholder="Explain the problem clearly with as much detail as possible…"
                />
                {disputeReason.length > 0 && disputeReason.length < 20 && (
                  <p className="text-xs text-red-600 mt-1">Please provide at least 20 characters ({20 - disputeReason.length} more needed)</p>
                )}
              </div>
              <button
                onClick={() => disputeMutation.mutate()}
                disabled={!disputeCategory || disputeReason.length < 20 || disputeMutation.isPending}
                className="bg-red-600 text-white rounded-lg text-sm py-2 px-4 font-medium hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {disputeMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />} Submit Dispute
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function EscrowPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-escrows"],
    queryFn: () => escrowApi.getMine().then((r) => r.data.data),
    retry: 1,
  });

  const escrows = data?.escrows || [];

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Escrow Transactions</h1>

      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map((i) => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-xl" />)}
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
        {escrows.map((escrow: any) => (
          <EscrowCard key={escrow.id} escrow={escrow} />
        ))}
      </div>
    </div>
  );
}
