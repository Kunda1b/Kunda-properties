import { useQuery } from "@tanstack/react-query";
import { Users, Building2, DollarSign, Shield, TrendingUp, AlertCircle } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";
import { analyticsApi } from "@/lib/api";
import { formatPrice } from "@/lib/utils";

export default function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-overview"],
    queryFn: () => analyticsApi.getOverview().then((r) => r.data.data),
    retry: 1,
  });

  const stats = [
    { label: "Total Users", value: data?.totalUsers ?? "—", icon: Users, color: "text-blue-600" },
    { label: "Active Listings", value: data?.activeListings ?? "—", icon: Building2, color: "text-kunda-700" },
    { label: "Pending KYC", value: data?.pendingKyc ?? "—", icon: Shield, color: "text-yellow-600" },
    { label: "Pending Listings", value: data?.pendingListings ?? "—", icon: AlertCircle, color: "text-orange-600" },
    { label: "Active Escrows", value: data?.activeEscrows ?? "—", icon: DollarSign, color: "text-green-600" },
    { label: "Total Revenue", value: data?.totalRevenue ? formatPrice(data.totalRevenue, "GBP") : "—", icon: TrendingUp, color: "text-purple-600" },
  ];

  return (
    <div>
      <AdminHeader title="Dashboard" subtitle="Overview of platform activity" />
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="stat-card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
                <p className={`text-2xl font-bold ${isLoading ? "text-gray-200 animate-pulse" : "text-gray-900"}`}>
                  {isLoading ? "—" : value}
                </p>
              </div>
              <div className={`p-2 rounded-lg bg-gray-50 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {data?.recentActivity?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {data.recentActivity.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-2 h-2 rounded-full bg-kunda-600 flex-shrink-0" />
                <span className="text-gray-600">{item.description}</span>
                <span className="text-gray-400 ml-auto">{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {!isLoading && !data && (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
          <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Analytics data unavailable — backend not yet connected.</p>
        </div>
      )}
    </div>
  );
}
