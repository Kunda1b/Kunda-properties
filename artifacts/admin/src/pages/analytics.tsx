import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from "recharts";
import { AdminHeader } from "@/components/AdminHeader";
import { analyticsApi } from "@/lib/api";
import { BarChart3, Loader2 } from "lucide-react";

const COLORS = ["#1a5c3e", "#e0a03c", "#56aa80", "#bb5836", "#6b7db3", "#c4845c"];

export default function AnalyticsPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => analyticsApi.getDetails().then((r) => r.data.data),
    retry: 1,
  });

  if (isLoading) return (
    <div>
      <AdminHeader title="Analytics" subtitle="Platform performance metrics" />
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-kunda-600" />
      </div>
    </div>
  );

  if (isError || !data) return (
    <div>
      <AdminHeader title="Analytics" subtitle="Platform performance metrics" />
      <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
        <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Analytics data unavailable — backend not yet connected.</p>
      </div>
    </div>
  );

  const byType = data.byPropertyType || [];
  const byRegion = data.byRegion || [];
  const escrowByStatus = data.escrowByStatus || [];
  const recentListings = data.recentListings || [];

  return (
    <div>
      <AdminHeader title="Analytics" subtitle="Platform performance metrics" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Properties by Type</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={byType} dataKey="count" nameKey="propertyType" cx="50%" cy="50%" outerRadius={80} label>
                {byType.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Properties by Region</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={byRegion} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis dataKey="region" type="category" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill="#1a5c3e" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Escrow Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={escrowByStatus}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="status" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#e0a03c" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Listing Activity</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={recentListings.slice(0, 30)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="createdAt" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="count" stroke="#1a5c3e" fill="#dcf0e4" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
