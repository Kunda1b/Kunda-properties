import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ClipboardList, Filter, X } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { auditApi } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";

const ACTION_OPTIONS = [
  "OFFER_CREATE", "OFFER_ACCEPT", "OFFER_REJECT", "OFFER_COUNTER",
  "ESCROW_INITIATE", "ESCROW_APPROVE_RELEASE", "ESCROW_DISPUTE",
  "ESCROW_FORCE_RELEASE", "ESCROW_FORCE_REFUND",
  "LISTING_APPROVE", "LISTING_REJECT", "LISTING_SUSPEND", "LISTING_VERIFY",
  "KYC_VERIFY", "KYC_REJECT",
  "SUSPEND", "UNSUSPEND",
  "EXCHANGE_RATE_UPDATE",
];

const RESOURCE_OPTIONS = ["user", "listing", "kyc", "escrow", "offer", "exchange_rate"];

export default function AuditLogsPage() {
  const [action, setAction] = useState("");
  const [resource, setResource] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit", action, resource],
    queryFn: () => auditApi.getAll({ action: action || undefined, resource: resource || undefined }).then((r) => r.data.data),
    retry: 1,
  });

  const logs = Array.isArray(data?.logs) ? data.logs : Array.isArray(data) ? data : [];
  const hasFilters = action || resource;

  const clearFilters = () => { setAction(""); setResource(""); };

  return (
    <div>
      <AdminHeader title="Audit Logs" subtitle="System activity and admin actions" />

      {/* Filters */}
      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showFilters || hasFilters ? "border-kunda-600 text-kunda-700 bg-kunda-50" : "border-gray-200 text-gray-600 bg-white hover:bg-gray-50"}`}
        >
          <Filter className="w-4 h-4" /> Filters {hasFilters ? `(${[action, resource].filter(Boolean).length})` : ""}
        </button>
        {hasFilters && (
          <button onClick={clearFilters} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-600">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {showFilters && (
        <div className="bg-white rounded-xl border border-gray-100 p-4 mb-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Action</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kunda-600"
              value={action} onChange={(e) => setAction(e.target.value)}>
              <option value="">All actions</option>
              {ACTION_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Resource</label>
            <select className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-kunda-600"
              value={resource} onChange={(e) => setResource(e.target.value)}>
              <option value="">All resources</option>
              {RESOURCE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading && <div className="p-8 text-center text-gray-500 text-sm">Loading…</div>}
        {!isLoading && logs.length === 0 && (
          <div className="p-12 text-center">
            <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">{hasFilters ? "No entries match your filters" : "No audit log entries yet"}</p>
          </div>
        )}
        <div className="divide-y divide-gray-100">
          {logs.map((log: any) => (
            <div key={log.id} className="p-4 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-kunda-600 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm text-gray-900 font-medium">{log.action}</p>
                  {log.resource && (
                    <span className="text-xs bg-gray-100 text-gray-600 rounded px-1.5 py-0.5">{log.resource}</span>
                  )}
                  {log.resourceId && (
                    <span className="text-xs text-gray-400 font-mono truncate max-w-[120px]" title={log.resourceId}>{log.resourceId.slice(0, 8)}…</span>
                  )}
                </div>
                {(log.newValues || log.oldValues) && (
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                    {log.newValues ? JSON.stringify(log.newValues).slice(0, 120) : ""}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {log.userEmail || log.admin?.email || "System"} · {log.ipAddress ? `${log.ipAddress} · ` : ""}{log.createdAt ? formatRelativeTime(log.createdAt) : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
