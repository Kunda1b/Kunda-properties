"use client";
import { useQuery } from "@tanstack/react-query";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Globe, DollarSign, Users } from "lucide-react";
import { adminApi } from "@/lib/api";
import { AdminHeader } from "@/components/layout/AdminHeader";
import { formatPrice } from "@/lib/utils";

const BRAND = "#1a5c3e"; const SAND = "#d4831f";
const MONTHLY = [{month:"Jan",escrow:48000,fees:1200},{month:"Feb",escrow:62000,fees:1550},{month:"Mar",escrow:55000,fees:1375},{month:"Apr",escrow:78000,fees:1950},{month:"May",escrow:91000,fees:2275},{month:"Jun",escrow:105000,fees:2625}];
const DIASPORA = [{country:"🇬🇧 UK",users:312,pct:100},{country:"🇺🇸 USA",users:248,pct:80},{country:"🇸🇪 Sweden",users:134,pct:43},{country:"🇩🇪 Germany",users:98,pct:31}];
const PRICE_RANGES = [{range:"< $10k",count:45},{range:"$10k–$50k",count:182},{range:"$50k–$100k",count:234},{range:"$100k–$250k",count:156}];

export default function AdminAnalyticsPage() {
  const { data: stats } = useQuery({ queryKey: ["admin-analytics"], queryFn: () => adminApi.stats().then((r) => r.data.data).catch(() => null) });
  const s = stats || {};

  return (
    <div>
      <AdminHeader title="Analytics" subtitle="Platform performance & market insights" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[["Total Revenue",formatPrice(s.platformRevenueUsd||0),DollarSign,"text-kunda-700 bg-kunda-50"],["Avg Property Value",formatPrice(85000),TrendingUp,"text-sand-500 bg-sand-50"],["Diaspora Users",(1246).toLocaleString(),Globe,"text-blue-600 bg-blue-50"],["KYC Conversion",`${s.kycVerified && s.totalUsers ? Math.round(s.kycVerified/s.totalUsers*100) : 54}%`,Users,"text-purple-600 bg-purple-50"]].map(([label,value,Icon,color]: any) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm"><div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}><Icon className="w-5 h-5"/></div><p className="text-2xl font-bold text-gray-900">{value}</p><p className="text-gray-500 text-xs mt-1">{label}</p></div>
          ))}
        </div>
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly Escrow Volume</h3>
            <ResponsiveContainer width="100%" height={240}><AreaChart data={MONTHLY}>
              <defs><linearGradient id="eg2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={BRAND} stopOpacity={0.12}/><stop offset="95%" stopColor={BRAND} stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6"/><XAxis dataKey="month" tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false} tickFormatter={(v)=>`$${(v/1000).toFixed(0)}k`}/><Tooltip formatter={(v:number)=>formatPrice(v)}/><Area type="monotone" dataKey="escrow" stroke={BRAND} strokeWidth={2} fill="url(#eg2)"/>
            </AreaChart></ResponsiveContainer>
          </div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Diaspora Breakdown</h3>
            <div className="space-y-3">{DIASPORA.map((d) => (<div key={d.country} className="flex items-center gap-3"><span className="text-sm text-gray-600 w-24">{d.country}</span><div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-kunda-500 rounded-full" style={{width:`${d.pct}%`}}/></div><span className="text-sm font-semibold w-10 text-right">{d.users}</span></div>))}</div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Price Distribution</h3>
          <ResponsiveContainer width="100%" height={200}><BarChart data={PRICE_RANGES} layout="vertical" margin={{left:20}}><CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" horizontal={false}/><XAxis type="number" tick={{fontSize:11,fill:"#9ca3af"}} axisLine={false} tickLine={false}/><YAxis type="category" dataKey="range" tick={{fontSize:11,fill:"#6b7280"}} axisLine={false} tickLine={false} width={90}/><Tooltip/><Bar dataKey="count" fill={BRAND} radius={[0,4,4,0]}/></BarChart></ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
