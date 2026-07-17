import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, CheckCircle, XCircle } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { kycAdminApi } from "@/lib/api";
import { KYC_STATUS_COLORS, formatRelativeTime } from "@/lib/utils";
import toast from "react-hot-toast";

export default function KycPage() {
  const [status, setStatus] = useState("SUBMITTED");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-kyc", { status }],
    queryFn: () => kycAdminApi.getPending({ status }).then((r) => r.data.data),
    retry: 1,
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "VERIFIED" | "REJECTED" }) =>
      kycAdminApi.verify(id, { status: action }),
    onSuccess: () => { toast.success("KYC updated"); qc.invalidateQueries({ queryKey: ["admin-kyc"] }); },
    onError: () => toast.error("Failed to update KYC"),
  });

  const records = data?.kyc || data || [];

  return (
    <div>
      <AdminHeader title="KYC Verification" subtitle="Review submitted identity documents" />

      <div className="flex gap-2 mb-6">
        {["SUBMITTED", "VERIFIED", "REJECTED", "PENDING"].map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
              status === s ? "bg-kunda-700 text-white border-kunda-700" : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading && (
          <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>
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
                {record.submittedAt && (
                  <p className="text-xs text-gray-400 mt-0.5">Submitted {formatRelativeTime(record.submittedAt)}</p>
                )}
              </div>
              <span className={`badge ${KYC_STATUS_COLORS[record.status]}`}>{record.status}</span>
              {record.status === "SUBMITTED" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => verifyMutation.mutate({ id: record.id, action: "VERIFIED" })}
                    disabled={verifyMutation.isPending}
                    className="flex items-center gap-1 text-xs font-medium text-green-600 hover:text-green-800 px-2.5 py-1.5 rounded-lg bg-green-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Verify
                  </button>
                  <button
                    onClick={() => verifyMutation.mutate({ id: record.id, action: "REJECTED" })}
                    disabled={verifyMutation.isPending}
                    className="flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-800 px-2.5 py-1.5 rounded-lg bg-red-50"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
