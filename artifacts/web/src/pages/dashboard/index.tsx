import { useQuery } from "@tanstack/react-query";
import { Home, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { useAuthStore } from "@/lib/store/auth.store";
import { escrowApi, listingsApi } from "@/lib/api";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: myListings } = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => listingsApi.getMine().then((r) => r.data.data),
    retry: 1,
  });
  const { data: myEscrows } = useQuery({
    queryKey: ["my-escrows"],
    queryFn: () => escrowApi.getMine().then((r) => r.data.data),
    retry: 1,
  });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">
        Welcome back, {user?.profile?.firstName || "there"} 👋
      </h1>
      {user?.kyc?.status !== "VERIFIED" && (
        <div className="bg-sand-50 border border-sand-200 rounded-xl p-4 my-6 flex items-center justify-between">
          <p className="font-semibold text-gray-900 text-sm">Complete your identity verification</p>
          <Link href="/dashboard/kyc" className="btn-primary text-sm py-2 px-4">Verify Now</Link>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <Link href="/dashboard/listings" className="bg-white rounded-xl p-5 border border-gray-100 hover:border-kunda-200 transition-colors">
          <Home className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{myListings?.listings?.length || 0}</p>
          <p className="text-gray-500 text-sm">My Listings</p>
        </Link>
        <Link href="/dashboard/escrow" className="bg-white rounded-xl p-5 border border-gray-100 hover:border-kunda-200 transition-colors">
          <DollarSign className="w-5 h-5 text-kunda-700 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{myEscrows?.escrows?.length || 0}</p>
          <p className="text-gray-500 text-sm">Active Escrows</p>
        </Link>
      </div>

      <div className="mt-10 bg-white rounded-2xl border border-gray-100 p-6">
        <h2 className="font-display text-xl font-bold text-gray-900 mb-4">Getting Started</h2>
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center gap-3">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${user?.kyc?.status === "VERIFIED" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
              {user?.kyc?.status === "VERIFIED" ? "✓" : "1"}
            </div>
            <span className={user?.kyc?.status === "VERIFIED" ? "line-through text-gray-400" : ""}>Complete identity verification (KYC)</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">2</div>
            <span>Browse properties in The Gambia</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold">3</div>
            <span>Use escrow for safe transactions</span>
          </div>
        </div>
      </div>
    </div>
  );
}
