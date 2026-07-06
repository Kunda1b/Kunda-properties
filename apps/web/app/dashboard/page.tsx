"use client";
import { useQuery } from "@tanstack/react-query";
import { Home, DollarSign, Bell } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/auth.store";
import { escrowApi, listingsApi } from "@/lib/api";

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: myListings } = useQuery({ queryKey: ["my-listings"], queryFn: () => listingsApi.getMine().then((r) => r.data.data) });
  const { data: myEscrows } = useQuery({ queryKey: ["my-escrows"], queryFn: () => escrowApi.getMine().then((r) => r.data.data) });

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.profile?.firstName || "there"} 👋</h1>
      {user?.kyc?.status !== "VERIFIED" && (
        <div className="bg-sand-50 border border-sand-200 rounded-xl p-4 my-6 flex items-center justify-between">
          <p className="font-semibold text-gray-900 text-sm">Complete your identity verification</p>
          <Link href="/dashboard/kyc" className="btn-primary text-sm py-2 px-4">Verify Now</Link>
        </div>
      )}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
        <Link href="/dashboard/listings" className="bg-white rounded-xl p-5 border border-gray-100">
          <Home className="w-5 h-5 text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{myListings?.listings?.length || 0}</p>
          <p className="text-gray-500 text-sm">My Listings</p>
        </Link>
        <Link href="/dashboard/escrow" className="bg-white rounded-xl p-5 border border-gray-100">
          <DollarSign className="w-5 h-5 text-kunda-700 mb-2" />
          <p className="text-2xl font-bold text-gray-900">{myEscrows?.escrows?.length || 0}</p>
          <p className="text-gray-500 text-sm">Active Escrows</p>
        </Link>
      </div>
    </div>
  );
}
