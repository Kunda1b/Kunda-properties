"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, ExternalLink, FileText } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { formatDateTime, cn } from "@/lib/utils";

export default function AdminDocumentsPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("UPLOADED");
  const [selected, setSelected] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin-docs", status], queryFn: () => adminApi.getPendingDocs({ status: status || undefined, limit: 50 }).then((r) => r.data.data) });
  const verify = useMutation({ mutationFn: (id: string) => adminApi.verifyDoc(id), onSuccess: () => { toast.success("Document verified"); setSelected(null); qc.invalidateQueries({ queryKey: ["admin-docs"] }); } });
  const reject = useMutation({ mutationFn: ({ id, reason }: any) => adminApi.rejectDoc(id, reason), onSuccess: () => { toast.success("Document rejected"); setSelected(null); qc.invalidateQueries({ queryKey: ["admin-docs"] }); } });

  const docs = data?.documents || [];

  return (
    <div>
      <AdminHeader title="Documents" subtitle="Verify property and KYC documents" />
      <div className="p-6 flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex gap-2 mb-5">{["UPLOADED","VERIFIED","REJECTED"].map((v) => <button key={v} onClick={() => setStatus(v)} className={`px-4 py-2 rounded-lg text-sm font-medium ${status===v?"bg-kunda-700 text-white":"bg-white border border-gray-200 text-gray-600"}`}>{v}</button>)}</div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="data-table">
              <thead><tr><th>Document</th><th>Type</th><th>Uploaded By</th><th>Uploaded</th><th>Status</th><th className="w-24">Actions</th></tr></thead>
              <tbody>
                {isLoading ? Array.from({length:8}).map((_,i) => <tr key={i}>{Array.from({length:6}).map((_,j) => <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse w-24"/></td>)}</tr>)
                : docs.length===0 ? <tr><td colSpan={6} className="text-center py-12 text-gray-400"><FileText className="w-8 h-8 mx-auto mb-2 opacity-30"/>No documents found</td></tr>
                : docs.map((doc: any) => (
                  <tr key={doc.id} onClick={() => setSelected(selected?.id===doc.id?null:doc)} className={cn("hover:bg-gray-50 cursor-pointer", selected?.id===doc.id && "bg-kunda-50")}>
                    <td><div className="flex items-center gap-2"><div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center"><FileText className="w-4 h-4 text-gray-500"/></div><p className="font-medium text-sm text-gray-900 truncate max-w-[180px]">{doc.title}</p></div></td>
                    <td className="text-sm text-gray-600">{doc.type?.replace(/_/g," ")}</td>
                    <td className="text-sm text-gray-600">{doc.uploadedBy?.profile?.firstName} {doc.uploadedBy?.profile?.lastName}</td>
                    <td className="text-xs text-gray-500">{formatDateTime(doc.createdAt)}</td>
                    <td><span className={doc.status==="VERIFIED"?"badge-green":doc.status==="REJECTED"?"badge-red":"badge-yellow"}>{doc.status}</span></td>
                    <td onClick={(e) => e.stopPropagation()}><div className="flex items-center gap-1">
                      {doc.url && <a href={doc.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-blue-50 text-blue-500"><ExternalLink className="w-4 h-4"/></a>}
                      {doc.status==="UPLOADED" && <><button onClick={() => verify.mutate(doc.id)} className="p-1.5 rounded hover:bg-green-50 text-green-600"><CheckCircle className="w-4 h-4"/></button><button onClick={() => setSelected(doc)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><XCircle className="w-4 h-4"/></button></>}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {selected && (
          <div className="w-72 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24 space-y-4">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-gray-900 text-sm">Document Review</h3><button onClick={() => { setSelected(null); setRejectReason(""); }} className="text-gray-400">×</button></div>
              <p className="font-semibold text-gray-900">{selected.title}</p>
              {selected.url && <a href={selected.url} target="_blank" rel="noopener noreferrer" className="btn-outline w-full flex items-center justify-center gap-2 text-xs"><ExternalLink className="w-3.5 h-3.5"/> Open Document</a>}
              {selected.status === "UPLOADED" && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <button onClick={() => verify.mutate(selected.id)} className="btn-primary w-full flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4"/> Verify</button>
                  <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={2} placeholder="Rejection reason…" className="input-field resize-none text-xs mb-1.5"/>
                  <button onClick={() => reject.mutate({ id: selected.id, reason: rejectReason })} disabled={!rejectReason.trim()} className="btn-danger w-full flex items-center justify-center gap-2"><XCircle className="w-4 h-4"/> Reject</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
