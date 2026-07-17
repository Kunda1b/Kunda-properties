"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard, Users, Building2, DollarSign, FileText,
  Bell, ShieldCheck, BarChart3, Settings, LogOut, ScrollText, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminStore, useAdminUser } from "@/lib/store/admin.store";
import { getInitials } from "@/lib/utils";

const NAV_GROUPS = [
  { label: "Overview", items: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/analytics", icon: BarChart3, label: "Analytics" },
  ]},
  { label: "People", items: [
    { href: "/users", icon: Users, label: "Users" },
    { href: "/kyc", icon: ShieldCheck, label: "KYC Review", badge: "kyc" },
  ]},
  { label: "Marketplace", items: [
    { href: "/listings", icon: Building2, label: "Listings", badge: "listings" },
    { href: "/escrow", icon: DollarSign, label: "Escrow", badge: "escrow" },
    { href: "/documents", icon: FileText, label: "Documents", badge: "documents" },
  ]},
  { label: "Communications", items: [
    { href: "/notifications", icon: Bell, label: "Notifications" },
    { href: "/audit-logs", icon: ScrollText, label: "Audit Logs" },
  ]},
  { label: "System", items: [
    { href: "/settings", icon: Settings, label: "Settings" },
  ]},
];

export function AdminSidebar({ pendingCounts = {} }: { pendingCounts?: Record<string, number> }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAdminUser();
  const logout = useAdminStore((s) => s.logout);

  return (
    <aside className="admin-sidebar">
      <div className="px-5 py-5 border-b border-white/10">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-kunda-600 rounded-lg flex items-center justify-center"><span className="text-white font-bold text-sm">K</span></div>
          <div><p className="text-white font-bold text-sm leading-none">Kunda Admin</p><p className="text-white/40 text-xs mt-0.5">Control Panel</p></div>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-white/30 text-xs font-semibold uppercase tracking-widest px-2 mb-2">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map(({ href, icon: Icon, label, badge }) => {
                const isActive = pathname === href || pathname.startsWith(href + "/");
                const count = badge ? pendingCounts[badge] || 0 : 0;
                return (
                  <Link key={href} href={href} className={cn("flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all", isActive ? "bg-white/10 text-white" : "text-white/60 hover:text-white hover:bg-white/5")}>
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1">{label}</span>
                    {count > 0 && <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">{count > 99 ? "99+" : count}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-kunda-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {getInitials(user?.profile?.firstName || "A", user?.profile?.lastName || "")}
          </div>
          <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium truncate">{user?.profile?.firstName} {user?.profile?.lastName}</p><p className="text-white/40 text-xs truncate">{user?.email}</p></div>
        </div>
        <button onClick={() => { logout(); router.push("/"); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
