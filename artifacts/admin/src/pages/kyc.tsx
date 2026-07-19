import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, CheckCircle, XCircle, FileText, X } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { kycAdminApi } from "@/lib/api";
import { KYC_STATUS_COLORS, formatRelativeTime } from "@/lib/utils";
import toast from "react-hot-toast";

export default function KycPage() {
  const [status, setStatus] = useState("SUBMITTED");
  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-kyc", { status }],
    queryFn: () => kycAdminApi.getPending({ status }).then((r) => r.data.data),
    retry: 1,
  });

  const verifyMutation = useMutation({
    mutationFn: (id: string) => kycAdminApi.verify(id),
    onSuccess: () => {
      toast.success("KYC verified");
      qc.invalidateQueries({ queryKey: ["admin-kyc"] });
    },
    onError: () => toast.error("Failed to verify KYC"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      kycAdminApi.reject(id, reason),
    onSuccess: () => {
      toast.success("KYC rejected");
      qc.invalidateQueries({ queryKey: ["admin-kyc"] });
      setRejectTarget(null);
      setRejectReason("");
    },
    onError: () => toast.error("Failed to reject KYC"),
  });

  const handleRejectConfirm = () => {
    if (!rejectReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason.trim() });
  };

  const records = data?.kyc || data || [];

  return (
    <div>
      <AdminHeader title="KYC Verification" subtitle="Review submitted identity documents" />

      {/* Status filter tabs */}
      <div className="flex gap-2 mb-6">
        {["SUBMITTED", "VERIFIED", "REJECTED", "PENDING"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              status === s
                ? "bg-kunda-700 text-white border-kunda-700"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading && (
          <div className="p-8 text-center text-gray-500 text-sm">Loading…</div>
        )}
        {!isLoading && records.length === 0 && (
          <div className="p-12 text-center">
            <Shield className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No KYC records with status: {status}</p>
          </div>
        )}
        <div className="divide-y divide-gray-100">
          {records.map((record: any) => (
            <div key={record.id} className="p-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">
                  {record.user?.profile?.firstName} {record.user?.profile?.lastName}
                </p>
                <p className="text-xs text-gray-500">{record.user?.email}</p>
                <div className="flex items-center gap-3 mt-1">
                  {record.idType && (
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <FileText className="w-3 h-3" /> {record.idType.replace(/_/g, " ")}
                      {record.idCountry && ` · ${record.idCountry}`}
                    </span>
                  )}
                  {record.submittedAt && (
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(record.submittedAt)}
                    </span>
                  )}
                </div>
                {record.rejectionReason && (
                  <p className="text-xs text-red-500 mt-1">Reason: {record.rejectionReason}</p>
                )}
              </div>

              <span className={`badge ${KYC_STATUS_COLORS[record.status] || "bg-gray-100 text-gray-600"}`}>
                {record.status}
              </span>

              {record.status === "SUBMITTED" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => verifyMutation.mutate(record.id)}
                    disabled={verifyMutation.isPending}
                    className="flex items-center gap-1 text-xs font-medium text-green-700 hover:text-green-800 px-2.5 py-1.5 rounded-lg bg-green-50 hover:bg-green-100 transition-colors"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Verify
                  </button>
                  <button
                    onClick={() => { setRejectTarget(record); setRejectReason(""); }}
                    disabled={rejectMutation.isPending}
                    className="flex items-center gap-1 text-xs font-medium text-red-700 hover:text-red-800 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Reject KYC Application</h2>
              <button
                onClick={() => { setRejectTarget(null); setRejectReason(""); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700">
                <p className="font-medium">
                  {rejectTarget.user?.profile?.firstName} {rejectTarget.user?.profile?.lastName}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{rejectTarget.user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Rejection reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                  className="input-field resize-none"
                  placeholder="e.g. Document photo is blurry, ID has expired, name does not match…"
                />
                <p className="text-xs text-gray-400 mt-1">
                  This reason will be shown to the user so they can resubmit.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setRejectTarget(null); setRejectReason(""); }}
                  className="btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectConfirm}
                  disabled={rejectMutation.isPending || !rejectReason.trim()}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  {rejectMutation.isPending ? "Rejecting…" : "Reject Application"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
