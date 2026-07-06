"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { useAdminUser } from "@/lib/store/admin.store";
import { useQueryClient } from "@tanstack/react-query";
import { formatDateTime } from "@/lib/utils";

export function AdminHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const user = useAdminUser();
  const qc = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = async () => { setRefreshing(true); await qc.invalidateQueries(); setTimeout(() => setRefreshing(false), 600); };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100 px-6 py-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-lg font-bold text-gray-900">{title}</h1>{subtitle && <p className="text-gray-500 text-xs mt-0.5">{subtitle}</p>}</div>
        <div className="flex items-center gap-2">
          <button onClick={handleRefresh} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500" title="Refresh"><RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-kunda-600" : ""}`} /></button>
          <span className="text-xs text-gray-400 hidden lg:block">{formatDateTime(new Date())}</span>
          <div className="flex items-center gap-2 pl-3 border-l border-gray-100">
            <div className="w-7 h-7 rounded-full bg-kunda-700 flex items-center justify-center text-white text-xs font-bold">{user?.profile?.firstName?.[0] || "A"}</div>
            <span className="text-sm font-medium text-gray-700 hidden md:block">{user?.profile?.firstName}</span>
            <span className="badge-purple badge text-[10px]">ADMIN</span>
          </div>
        </div>
      </div>
    </header>
  );
}
