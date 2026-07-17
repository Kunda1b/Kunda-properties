"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { useIsLoggedIn } from "@/lib/store/admin.store";
import { adminApi } from "@/lib/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isLoggedIn = useIsLoggedIn();
  useEffect(() => { if (!isLoggedIn) router.replace("/"); }, [isLoggedIn, router]);

  const { data: pendingCounts } = useQuery({
    queryKey: ["admin-pending-counts"], enabled: isLoggedIn, refetchInterval: 60000,
    queryFn: async () => {
      const res = await adminApi.stats();
      const s = res.data.data;
      return { kyc: s.pendingKyc || 0, listings: s.pendingListings || 0, escrow: s.disputedEscrows || 0, documents: s.pendingDocuments || 0 };
    },
  });

  if (!isLoggedIn) return null;
  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar pendingCounts={pendingCounts} />
      <div className="admin-main flex flex-col flex-1">{children}</div>
    </div>
  );
}
