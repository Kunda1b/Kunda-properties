import { useQuery } from "@tanstack/react-query";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, ResponsiveContainer, Legend,
} from "recharts";
import { AdminHeader } from "@/components/AdminHeader";
import { analyticsApi } from "@/lib/api";
import { BarChart3 } from "lucide-react";

export default function AnalyticsPage() {
  const { data: revenue, isLoading: revLoading } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: () => analyticsApi.getRevenue().then((r) => r.data.data),
    retry: 1,
  });

  const { data: userGrowth, isLoading: ugLoading } = useQuery({
    queryKey: ["admin-user-growth"],
    queryFn: () => analyticsApi.getUserGrowth().then((r) => r.data.data),
    retry: 1,
  });

  const isLoading = revLoading || ugLoading;

  return (
    <div>
      <AdminHeader title="Analytics" subtitle="Platform performance metrics" />
      {isLoading && (
        <div className="grid grid-cols-2 gap-6">
          {[1, 2].map((i) => <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 h-72 animate-pulse" />)}
        </div>
      )}
      {!isLoading && !revenue && !userGrowth && (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <BarChart3 className="w-10 h-10 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-sm">Analytics data unavailable — backend not yet connected.</p>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {revenue?.monthly && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenue.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="#1a5c3e" fill="#dcf0e4" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
        {userGrowth?.monthly && (
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">User Growth</h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={userGrowth.monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="buyers" fill="#1a5c3e" name="Buyers" />
                <Bar dataKey="sellers" fill="#e0a03c" name="Sellers" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
