"use client";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, MoreVertical, ShieldCheck, ShieldOff, UserCheck } from "lucide-react";
import toast from "react-hot-toast";
import { adminApi } from "@/lib/api";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { formatDateTime, getInitials, cn, KYC_BADGES, USER_ROLE_BADGES } from "@/lib/utils";

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["admin-users", search, role, page], queryFn: () => adminApi.getUsers({ search, role: role || undefined, page, limit: 20 }).then((r) => r.data.data) });
  const suspend = useMutation({ mutationFn: (id: string) => adminApi.suspendUser(id), onSuccess: () => { toast.success("User suspended"); qc.invalidateQueries({ queryKey: ["admin-users"] }); } });
  const activate = useMutation({ mutationFn: (id: string) => adminApi.activateUser(id), onSuccess: () => { toast.success("User reactivated"); qc.invalidateQueries({ queryKey: ["admin-users"] }); } });
  const promote = useMutation({ mutationFn: (id: string) => adminApi.promoteToAgent(id), onSuccess: () => { toast.success("Promoted to Agent"); qc.invalidateQueries({ queryKey: ["admin-users"] }); } });

  const users = data?.users || []; const total = data?.total || 0;

  return (
    <div>
      <AdminHeader title="Users" subtitle={`${total.toLocaleString()} registered users`} />
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="relative flex-1 min-w-56"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search name or email…" className="input-field pl-9" /></div>
          <select value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} className="input-field w-36">
            <option value="">All Roles</option><option value="BUYER">Buyer</option><option value="SELLER">Seller</option><option value="AGENT">Agent</option><option value="ADMIN">Admin</option>
          </select>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <table className="data-table">
            <thead><tr><th>User</th><th>Role</th><th>KYC</th><th>Country</th><th>Joined</th><th>Status</th><th className="w-12"></th></tr></thead>
            <tbody>
              {isLoading ? Array.from({length:10}).map((_,i) => <tr key={i}>{Array.from({length:7}).map((_,j) => <td key={j}><div className="h-4 bg-gray-100 rounded animate-pulse w-24"/></td>)}</tr>)
              : users.map((user: any) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-kunda-700 flex items-center justify-center text-white text-xs font-bold">{getInitials(user.profile?.firstName, user.profile?.lastName)}</div><div><p className="font-medium text-gray-900 text-sm">{user.profile?.firstName} {user.profile?.lastName}</p><p className="text-gray-400 text-xs">{user.email}</p></div></div></td>
                  <td><span className={USER_ROLE_BADGES[user.role] || "badge-gray"}>{user.role}</span></td>
                  <td><span className={KYC_BADGES[user.kyc?.status || "PENDING"]}>{user.kyc?.status || "PENDING"}</span></td>
                  <td className="text-gray-500 text-sm">{user.diasporaCountry ? `🌍 ${user.diasporaCountry}` : "🇬🇲 GM"}</td>
                  <td className="text-gray-500 text-xs">{formatDateTime(user.createdAt)}</td>
                  <td><span className={cn("badge", user.isSuspended ? "badge-red" : user.isEmailVerified ? "badge-green" : "badge-yellow")}>{user.isSuspended ? "Suspended" : user.isEmailVerified ? "Active" : "Unverified"}</span></td>
                  <td><div className="relative">
                    <button onClick={() => setOpenMenu(openMenu === user.id ? null : user.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400"><MoreVertical className="w-4 h-4"/></button>
                    {openMenu === user.id && (
                      <div className="absolute right-0 top-8 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-10 w-44">
                        {user.isSuspended ? <button onClick={() => { activate.mutate(user.id); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50 flex items-center gap-2"><UserCheck className="w-4 h-4"/> Reactivate</button>
                          : <button onClick={() => { suspend.mutate(user.id); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><ShieldOff className="w-4 h-4"/> Suspend</button>}
                        {user.role === "BUYER" && <button onClick={() => { promote.mutate(user.id); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 flex items-center gap-2"><ShieldCheck className="w-4 h-4"/> Promote to Agent</button>}
                      </div>
                    )}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
