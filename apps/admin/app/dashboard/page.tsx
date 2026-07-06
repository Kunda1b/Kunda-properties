"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  Users, Building2, DollarSign, ShieldCheck, TrendingUp, TrendingDown,
  AlertTriangle, Clock, CheckCircle, XCircle, Eye,
} from "lucide-react";
import Link from "next/link";
import { adminApi } from "@/lib/api";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { formatPrice, formatRelativeTime, cn } from "@/lib/utils";

const BRAND = "#1a5c3e";
const SAND = "#d4831f";
const COLORS = [BRAND, SAND, "#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b"];

function StatCard({ title, value, sub, icon: Icon, trend, href, color = "green" }: any) {
  const colorMap: Record<string, string> = {
    green: "bg-kunda-50 text-kunda-700", blue: "bg-blue-50 text-blue-600",
    orange: "bg-orange-50 text-orange-600", red: "bg-red-50 text-red-600", purple: "bg-purple-50 text-purple-600",
  };
  const card = (
    <div className={cn("stat-card group", href && "cursor-pointer hover:-translate-y-0.5 transition-transform")}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${colorMap[color]} flex items-center justify-center`}><Icon className="w-5 h-5" /></div>
        {trend !== undefined && (
          <div className={cn("flex items-center gap-1 text-xs font-semibold", trend >= 0 ? "text-green-600" : "text-red-500")}>
            {trend >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}{Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-gray-500 text-sm mt-0.5">{title}</p>
      {sub && <p className="text-gray-400 text-xs mt-1">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{card}</Link> : card;
}

function ActivityRow({ type, title, meta, time, status }: any) {
  const icons: Record<string, any> = { listing: Building2, user: Users, escrow: DollarSign, kyc: ShieldCheck };
  const Icon = icons[type] || Building2;
  return (
    <div className="flex items-center gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0"><Icon className="w-4 h-4 text-gray-500" /></div>
      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{title}</p><p className="text-xs text-gray-400">{meta}</p></div>
      <div className="text-right flex-shrink-0">
        {status && <span className={cn("badge text-[10px]", status === "VERIFIED" || status === "ACTIVE" ? "badge-green" : status === "PENDING" || status === "SUBMITTED" ? "badge-yellow" : status === "REJECTED" || status === "DISPUTED" ? "badge-red" : "badge-gray")}>{status}</span>}
        <p className="text-xs text-gray-400 mt-1">{time}</p>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({ queryKey: ["admin-overview"], queryFn: () => adminApi.stats().then((r) => r.data.data), refetchInterval: 30000 });
  const s = stats || {};

  const revenueData = [
    { month: "Jan", escrow: 48000, fees: 1200 }, { month: "Feb", escrow: 62000, fees: 1550 },
    { month: "Mar", escrow: 55000, fees: 1375 }, { month: "Apr", escrow: 78000, fees: 1950 },
    { month: "May", escrow: 91000, fees: 2275 }, { month: "Jun", escrow: 105000, fees: 2625 },
  ];
  const listingsByType = [
    { name: "House", value: 142 }, { name: "Villa", value: 48 }, { name: "Apartment", value: 95 },
    { name: "Land", value: 211 }, { name: "Commercial", value: 34 },
  ];
  const escrowFunnel = [
    { status: "Initiated", count: 89 }, { status: "Funded", count: 67 },
    { status: "Inspecting", count: 45 }, { status: "Released", count: 38 },
  ];

  if (isLoading) {
    return (
      <div>
        <AdminHeader title="Dashboard" subtitle="Platform overview" />
        <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="stat-card animate-pulse"><div className="w-10 h-10 bg-gray-200 rounded-xl mb-4" /><div className="h-6 bg-gray-200 rounded w-1/2 mb-2" /><div className="h-4 bg-gray-100 rounded w-3/4" /></div>)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <AdminHeader title="Dashboard" subtitle="Real-time platform overview" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Users" value={s.totalUsers || 0} icon={Users} color="blue" trend={s.userGrowthPct} href="/users" />
          <StatCard title="Active Listings" value={s.activeListings || 0} icon={Building2} color="green" href="/listings" />
          <StatCard title="Escrow Volume (USD)" value={formatPrice(s.escrowVolumeUsd || 0)} icon={DollarSign} color="orange" href="/escrow" />
          <StatCard title="Platform Revenue" value={formatPrice(s.platformRevenueUsd || 0)} icon={TrendingUp} color="purple" sub="2.5% escrow fees" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/kyc" className="stat-card flex items-center gap-3 border-yellow-100 bg-yellow-50"><Clock className="w-5 h-5 text-yellow-600" /><div><p className="text-xl font-bold text-yellow-800">{s.pendingKyc || 0}</p><p className="text-yellow-700 text-xs font-medium">KYC Pending</p></div></Link>
          <Link href="/listings" className="stat-card flex items-center gap-3 border-blue-100 bg-blue-50"><Eye className="w-5 h-5 text-blue-600" /><div><p className="text-xl font-bold text-blue-800">{s.pendingListings || 0}</p><p className="text-blue-700 text-xs font-medium">Listings Pending</p></div></Link>
          <Link href="/escrow" className="stat-card flex items-center gap-3 border-red-100 bg-red-50"><AlertTriangle className="w-5 h-5 text-red-600" /><div><p className="text-xl font-bold text-red-800">{s.disputedEscrows || 0}</p><p className="text-red-700 text-xs font-medium">Active Disputes</p></div></Link>
          <Link href="/documents" className="stat-card flex items-center gap-3 border-purple-100 bg-purple-50"><ShieldCheck className="w-5 h-5 text-purple-600" /><div><p className="text-xl font-bold text-purple-800">{s.pendingDocuments || 0}</p><p className="text-purple-700 text-xs font-medium">Docs to Verify</p></div></Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Escrow Volume & Revenue</h3>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="eg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BRAND} stopOpacity={0.15} /><stop offset="95%" stopColor={BRAND} stopOpacity={0} /></linearGradient>
                  <linearGradient id="fg" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={SAND} stopOpacity={0.15} /><stop offset="95%" stopColor={SAND} stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number, name: string) => [formatPrice(v), name === "escrow" ? "Escrow Volume" : "Platform Fees"]} />
                <Area type="monotone" dataKey="escrow" stroke={BRAND} strokeWidth={2} fill="url(#eg)" />
                <Area type="monotone" dataKey="fees" stroke={SAND} strokeWidth={2} fill="url(#fg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Listings by Type</h3>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart><Pie data={listingsByType} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                {listingsByType.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie><Tooltip /></PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {listingsByType.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /><span className="text-gray-600">{item.name}</span></div>
                  <span className="font-semibold text-gray-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4"><h3 className="font-semibold text-gray-900">Recent Activity</h3><Link href="/audit-logs" className="text-xs text-kunda-600">View all →</Link></div>
            {(s.recentActivity || [
              { type: "user", title: "Fatou Jallow registered", meta: "buyer · GB", createdAt: new Date(), status: "PENDING" },
              { type: "listing", title: "Villa in Kololi submitted", meta: "Lamin Ceesay", createdAt: new Date(), status: "PENDING_REVIEW" },
              { type: "kyc", title: "Mariama Drammeh KYC submitted", meta: "PASSPORT", createdAt: new Date(), status: "SUBMITTED" },
            ]).slice(0, 8).map((a: any, i: number) => <ActivityRow key={i} type={a.type} title={a.title} meta={a.meta} time={formatRelativeTime(a.createdAt)} status={a.status} />)}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Escrow Funnel</h3>
            <div className="space-y-3">
              {escrowFunnel.map((item, i) => {
                const pct = Math.round((item.count / (escrowFunnel[0]?.count || 1)) * 100);
                return (
                  <div key={item.status}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">{item.status}</span><span className="font-semibold text-gray-900">{item.count}</span></div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: COLORS[i] || BRAND }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
