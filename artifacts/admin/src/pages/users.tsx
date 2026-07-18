import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Users } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { usersApi } from "@/lib/api";
import { KYC_STATUS_COLORS, formatRelativeTime } from "@/lib/utils";

export default function UsersPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users", { search, page }],
    queryFn: () => usersApi.getAll({ search, page, limit: 20 }).then((r) => r.data.data),
    retry: 1,
  });

  const users = data?.users || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div>
      <AdminHeader title="Users" subtitle="Manage platform users" />
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <div className="flex-1 flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {isLoading && (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-1/3 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-1/2 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && users.length === 0 && (
          <div className="p-12 text-center">
            <Users className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No users found</p>
          </div>
        )}

        <div className="divide-y divide-gray-100">
          {users.map((user: any) => (
            <div key={user.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
              <div className="w-10 h-10 rounded-full bg-kunda-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {user.profile?.firstName?.[0] || user.email[0].toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm">
                  {user.profile?.firstName} {user.profile?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${KYC_STATUS_COLORS[user.kyc?.status || "PENDING"]}`}>
                  {user.kyc?.status || "PENDING"}
                </span>
                <span className="badge bg-gray-100 text-gray-600">{user.role}</span>
                <span className="text-xs text-gray-400">{user.createdAt ? formatRelativeTime(user.createdAt) : ""}</span>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-kunda-700 text-white hover:bg-kunda-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
