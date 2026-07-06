"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ScrollText } from "lucide-react";
import { adminApi } from "@/lib/api";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { formatDateTime, cn } from "@/lib/utils";

const ACTION_COLORS: Record<string,string> = { CREATE:"badge-green", UPDATE:"badge-blue", DELETE:"badge-red", APPROVE:"badge-green", REJECT:"badge-red", SUSPEND:"badge-orange", ACTIVATE:"badge-green", BROADCAST:"badge-purple" };

export default function AdminAuditLogsPage() {
  const [resource, setResource] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["admin-audit", resource], queryFn: () => adminApi.getAuditLogs({ resource: resource || undefined, limit: 30 }).then((r) => r.data.data) });
  const logs = data?.logs || []; const total = data?.total || 0;

  return (
    <div>
      <AdminHeader title="Audit Logs" subtitle="Complete record of all admin actions" />
      <div className="p-6">
        <div className="flex gap-3 mb-6">
          <select value={resource} onChange={(e) => setResource(e.target.value)} className="input-field w-40">
            <option value="">All Resources</option><option value="user">User</option><option value="listing">Listing</option><option value="escrow">Escrow</option><option value="kyc">KYC</option><option value="document">Document</option>
          </select>
          <p className="text-sm text-gray-500 self-center">{total.toLocaleString()} entries</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="data-table">
            <thead><tr><th className="w-40">Timestamp</th><th>Action</th><th>Resource</th><th>IP Address</th></tr></thead>
            <tbody>
              {isLoading ? Array.from({length:10}).map((_,i) => <tr key={i}>{Array.from({length:4}).map((_,j) => <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse w-24"/></td>)}</tr>)
              : logs.length === 0 ? <tr><td colSpan={4} className="text-center py-12 text-gray-400"><ScrollText className="w-8 h-8 mx-auto mb-2 opacity-30"/>No audit logs found</td></tr>
              : logs.map((log: any) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="font-mono text-xs text-gray-500 whitespace-nowrap">{formatDateTime(log.createdAt)}</td>
                  <td><span className={cn("badge", ACTION_COLORS[log.action] || "badge-gray")}>{log.action}</span></td>
                  <td className="text-sm"><span className="font-medium text-gray-700 capitalize">{log.resource}</span>{log.resourceId && <span className="text-gray-400 text-xs ml-1 font-mono">#{log.resourceId.slice(0,8)}</span>}</td>
                  <td className="font-mono text-xs text-gray-400">{log.ipAddress || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
