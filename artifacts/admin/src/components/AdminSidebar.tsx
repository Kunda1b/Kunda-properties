import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, Shield, Building2, DollarSign,
  FileText, BarChart3, Bell, ClipboardList, Settings, LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAdminStore } from "@/lib/store/admin.store";

const links = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/users", icon: Users, label: "Users" },
  { href: "/kyc", icon: Shield, label: "KYC Verification" },
  { href: "/listings", icon: Building2, label: "Listings" },
  { href: "/escrow", icon: DollarSign, label: "Escrow" },
  { href: "/documents", icon: FileText, label: "Documents" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/notifications", icon: Bell, label: "Notifications" },
  { href: "/audit-logs", icon: ClipboardList, label: "Audit Logs" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export function AdminSidebar() {
  const [pathname] = useLocation();
  const { user, logout } = useAdminStore();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-kunda-950 z-40 flex flex-col">
      <div className="p-6 border-b border-white/10">
        <span className="font-sans text-xl font-bold text-white">
          Kunda<span className="text-sand-400">.</span>
          <span className="ml-2 text-xs font-medium bg-white/10 text-white/70 px-2 py-0.5 rounded-full">Admin</span>
        </span>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {links.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              pathname === href
                ? "bg-white/10 text-white"
                : "text-white/60 hover:bg-white/5 hover:text-white"
            )}
          >
            <Icon className="w-4 h-4 flex-shrink-0" />
            {label}
          </Link>
        ))}
      </nav>
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-kunda-700 flex items-center justify-center text-white text-xs font-bold">
            {user?.profile?.firstName?.[0] || "A"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user?.profile?.firstName} {user?.profile?.lastName}
            </p>
            <p className="text-xs text-white/50 truncate">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-white/5 w-full"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </aside>
  );
}
