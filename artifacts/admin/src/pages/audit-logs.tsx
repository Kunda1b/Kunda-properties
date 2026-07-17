import { useQuery } from "@tanstack/react-query";
import { ClipboardList } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { auditApi } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";

export default function AuditLogsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-audit"],
    queryFn: () => auditApi.getAll().then((r) => r.data.data),
    retry: 1,
  });

  const logs = data?.logs || data || [];

  return (
    <div>
      <AdminHeader title="Audit Logs" subtitle="System activity and admin actions" />
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        {isLoading && <div className="p-8 text-center text-gray-500 text-sm">Loading...</div>}
        {!isLoading && logs.length === 0 && (
          <div className="p-12 text-center">
            <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No audit log entries yet</p>
          </div>
        )}
        <div className="divide-y divide-gray-100">
          {logs.map((log: any) => (
            <div key={log.id} className="p-4 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-kunda-600 mt-1.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 font-medium">{log.action}</p>
                {log.details && <p className="text-xs text-gray-500 mt-0.5">{typeof log.details === "string" ? log.details : JSON.stringify(log.details)}</p>}
                <p className="text-xs text-gray-400 mt-1">
                  {log.admin?.email || "System"} · {log.createdAt ? formatRelativeTime(log.createdAt) : ""}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
