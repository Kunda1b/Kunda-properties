import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { AdminHeader } from "@/components/AdminHeader";
import { analyticsApi } from "@/lib/api";
import { BarChart3, Loader2 } from "lucide-react";

const COLORS = ["#1a5c3e", "#e0a03c", "#56aa80", "#bb5836", "#6b7db3", "#c4845c"];

// Group raw listing timestamps into daily counts for the AreaChart
function groupByDay(items: { createdAt: string }[]): { date: string; count: number }[] {
  const map: Record<string, number> = {};
  items.forEach((item) => {
    const d = new Date(item.createdAt);
    const key = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" });
    map[key] = (map[key] || 0) + 1;
  });
  return Object.entries(map)
    .map(([date, count]) => ({ date, count }))
    .slice(-30); // last 30 distinct days
}

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

  const byType: any[] = data.byPropertyType || [];
  const byRegion: any[] = data.byRegion || [];
  const escrowByStatus: any[] = data.escrowByStatus || [];
  const activityByDay = groupByDay(data.recentListings || []);

  return (
    <div>
      <AdminHeader title="Analytics" subtitle="Platform performance metrics" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Properties by type — pie */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Active Listings by Type</h3>
          {byType.length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-gray-400 text-sm">No active listings yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byType} dataKey="count" nameKey="propertyType" cx="50%" cy="50%" outerRadius={80} label={({ propertyType, count }) => `${propertyType} (${count})`}>
                  {byType.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Properties by region — horizontal bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Active Listings by Region</h3>
          {byRegion.length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-gray-400 text-sm">No active listings yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={byRegion} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis dataKey="region" type="category" tick={{ fontSize: 10 }} width={110} />
                <Tooltip />
                <Bar dataKey="count" fill="#1a5c3e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Escrow by status — bar */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Escrow Status Breakdown</h3>
          {escrowByStatus.length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-gray-400 text-sm">No escrow transactions yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={escrowByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="status" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#e0a03c" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Listing activity by day — area chart */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">New Listings Per Day (Last 30 Days)</h3>
          {activityByDay.length === 0 ? (
            <div className="flex items-center justify-center h-[240px] text-gray-400 text-sm">No listing activity yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={activityByDay}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="count" name="Listings" stroke="#1a5c3e" fill="#dcf0e4" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
