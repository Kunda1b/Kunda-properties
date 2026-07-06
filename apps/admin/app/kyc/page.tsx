"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Eye, Clock } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { formatDateTime, getInitials, KYC_BADGES } from "@/lib/utils";

export default function AdminKYCPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("SUBMITTED");
  const [selected, setSelected] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin-kyc", status], queryFn: () => adminApi.getPendingKyc({ status, limit: 50 }).then((r) => r.data.data) });
  const approve = useMutation({ mutationFn: (id: string) => adminApi.approveKyc(id), onSuccess: () => { toast.success("KYC approved"); setSelected(null); qc.invalidateQueries({ queryKey: ["admin-kyc"] }); } });
  const reject = useMutation({ mutationFn: ({ id, reason }: any) => adminApi.rejectKyc(id, reason), onSuccess: () => { toast.success("KYC rejected"); setSelected(null); setRejectReason(""); qc.invalidateQueries({ queryKey: ["admin-kyc"] }); } });

  const records = data?.records || [];

  return (
    <div>
      <AdminHeader title="KYC Review" subtitle="Identity verification queue" />
      <div className="p-6 flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 mb-5">
            {["SUBMITTED","PENDING","VERIFIED","REJECTED"].map((v) => (
              <button key={v} onClick={() => setStatus(v)} className={`px-4 py-2 rounded-lg text-sm font-medium ${status===v?"bg-kunda-700 text-white":"bg-white border border-gray-200 text-gray-600"}`}>{v}</button>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="data-table">
              <thead><tr><th>Applicant</th><th>ID Type</th><th>Country</th><th>Submitted</th><th>Status</th><th className="w-24">Actions</th></tr></thead>
              <tbody>
                {isLoading ? Array.from({length:8}).map((_,i) => <tr key={i}>{Array.from({length:6}).map((_,j) => <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse w-24"/></td>)}</tr>)
                : records.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-gray-400"><Clock className="w-8 h-8 mx-auto mb-2 opacity-30"/>No {status.toLowerCase()} applications</td></tr>
                : records.map((rec: any) => (
                  <tr key={rec.id} className={`hover:bg-gray-50 ${selected?.id===rec.id?"bg-kunda-50":""}`}>
                    <td><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-kunda-700 flex items-center justify-center text-white text-xs font-bold">{getInitials(rec.user?.profile?.firstName, rec.user?.profile?.lastName)}</div><div><p className="font-medium text-sm text-gray-900">{rec.user?.profile?.firstName} {rec.user?.profile?.lastName}</p><p className="text-gray-400 text-xs">{rec.user?.email}</p></div></div></td>
                    <td className="text-sm text-gray-600">{rec.idType?.replace(/_/g," ") || "—"}</td>
                    <td className="text-sm text-gray-600">{rec.idCountry || "—"}</td>
                    <td className="text-xs text-gray-500">{formatDateTime(rec.updatedAt || rec.createdAt)}</td>
                    <td><span className={KYC_BADGES[rec.status]}>{rec.status}</span></td>
                    <td><div className="flex items-center gap-1">
                      <button onClick={() => setSelected(rec)} className="p-1.5 rounded hover:bg-blue-50 text-blue-500"><Eye className="w-4 h-4"/></button>
                      {rec.status === "SUBMITTED" && <>
                        <button onClick={() => approve.mutate(rec.id)} className="p-1.5 rounded hover:bg-green-50 text-green-600"><CheckCircle className="w-4 h-4"/></button>
                        <button onClick={() => setSelected(rec)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><XCircle className="w-4 h-4"/></button>
                      </>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {selected && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24">
              <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-900">KYC Review</h3><button onClick={() => setSelected(null)} className="text-gray-400 text-lg">×</button></div>
              <div className="space-y-3 text-sm mb-5">
                <div className="flex justify-between"><span className="text-gray-500">Name</span><span className="font-medium">{selected.user?.profile?.firstName} {selected.user?.profile?.lastName}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">ID Type</span><span className="font-medium">{selected.idType?.replace(/_/g," ")}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">ID Number</span><span className="font-mono text-xs">{selected.idNumber || "—"}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Country</span><span className="font-medium">{selected.idCountry}</span></div>
              </div>
              {selected.status === "SUBMITTED" && (
                <div className="space-y-2">
                  <button onClick={() => approve.mutate(selected.id)} className="btn-primary w-full flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4"/> Approve KYC</button>
                  <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} placeholder="Rejection reason…" className="input-field resize-none text-xs mb-1.5"/>
                  <button onClick={() => reject.mutate({ id: selected.id, reason: rejectReason })} disabled={!rejectReason.trim()} className="btn-danger w-full flex items-center justify-center gap-2"><XCircle className="w-4 h-4"/> Reject KYC</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
