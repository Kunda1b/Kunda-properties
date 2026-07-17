"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle, RefreshCw, DollarSign } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { formatPrice, formatDateTime, ESCROW_STATUS_BADGES, cn } from "@/lib/utils";

export default function AdminEscrowPage() {
  const qc = useQueryClient();
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [notes, setNotes] = useState("");

  const { data, isLoading } = useQuery({ queryKey: ["admin-escrows", status], queryFn: () => adminApi.getAllEscrows({ status: status || undefined, limit: 20 }).then((r) => r.data.data) });
  const mutOpts = (msg: string) => ({ onSuccess: () => { toast.success(msg); setSelected(null); setNotes(""); qc.invalidateQueries({ queryKey: ["admin-escrows"] }); } });
  const forceRelease = useMutation({ mutationFn: () => adminApi.forceRelease(selected.id, notes), ...mutOpts("Funds released") });
  const forceRefund = useMutation({ mutationFn: () => adminApi.forceRefund(selected.id, notes), ...mutOpts("Funds refunded") });

  const escrows = data?.escrows || [];
  const STATUS_TABS = ["", "INITIATED", "FUNDED", "INSPECTING", "DISPUTED", "RELEASED", "REFUNDED"];

  return (
    <div>
      <AdminHeader title="Escrow Management" subtitle="Transaction oversight & disputes" />
      <div className="p-6 flex gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap gap-2 mb-5">
            {STATUS_TABS.map((s) => { const info = s ? ESCROW_STATUS_BADGES[s] : null; return <button key={s} onClick={() => setStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium ${status===s?"bg-kunda-700 text-white":"bg-white border border-gray-200 text-gray-600"}`}>{s ? info?.label||s : "All"}</button>; })}
          </div>
          <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="data-table">
              <thead><tr><th>Reference</th><th>Property</th><th>Amount</th><th>Buyer → Seller</th><th>Created</th><th>Status</th></tr></thead>
              <tbody>
                {isLoading ? Array.from({length:10}).map((_,i) => <tr key={i}>{Array.from({length:6}).map((_,j) => <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse w-24"/></td>)}</tr>)
                : escrows.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-gray-400"><DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30"/>No escrows found</td></tr>
                : escrows.map((e: any) => {
                  const si = ESCROW_STATUS_BADGES[e.status] || { cls: "badge-gray", label: e.status };
                  return (
                    <tr key={e.id} className={cn("hover:bg-gray-50 cursor-pointer", selected?.id===e.id && "bg-kunda-50", e.status==="DISPUTED" && "border-l-2 border-l-red-400")} onClick={() => setSelected(selected?.id===e.id?null:e)}>
                      <td className="font-mono text-xs text-gray-600">{e.referenceNumber}</td>
                      <td><p className="font-medium text-sm text-gray-900 truncate max-w-[200px]">{e.listing?.title}</p></td>
                      <td className="font-bold text-kunda-700">{formatPrice(Number(e.totalAmount), e.currency)}</td>
                      <td className="text-sm text-gray-600">{e.buyer?.profile?.firstName} → {e.seller?.profile?.firstName}</td>
                      <td className="text-xs text-gray-500">{formatDateTime(e.createdAt)}</td>
                      <td><span className={si.cls}>{si.label}</span>{e.status==="DISPUTED" && <AlertTriangle className="w-3.5 h-3.5 text-red-500 inline ml-1"/>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        {selected && (
          <div className="w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-24 space-y-4">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-gray-900">Escrow Detail</h3><button onClick={() => setSelected(null)} className="text-gray-400">×</button></div>
              <div className="space-y-2 text-sm">
                {[["Reference",selected.referenceNumber],["Status",selected.status],["Total",formatPrice(Number(selected.totalAmount),selected.currency)],["Buyer",`${selected.buyer?.profile?.firstName} ${selected.buyer?.profile?.lastName}`],["Seller",`${selected.seller?.profile?.firstName} ${selected.seller?.profile?.lastName}`]].map(([l,v]) => (
                  <div key={l as string} className="flex justify-between"><span className="text-gray-500">{l}</span><span className="font-medium text-right text-xs max-w-[160px] truncate">{v}</span></div>
                ))}
              </div>
              {["FUNDED","INSPECTING","DISPUTED"].includes(selected.status) && (
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Admin notes (required)…" className="input-field resize-none text-xs"/>
                  <button onClick={() => forceRelease.mutate()} disabled={!notes.trim()} className="btn-primary w-full flex items-center justify-center gap-2 text-xs"><CheckCircle className="w-4 h-4"/> Force Release</button>
                  <button onClick={() => forceRefund.mutate()} disabled={!notes.trim()} className="btn-danger w-full flex items-center justify-center gap-2 text-xs"><RefreshCw className="w-4 h-4"/> Force Refund</button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
