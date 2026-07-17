import { DashboardNav } from "@/components/layout/DashboardNav";
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <DashboardNav />
      <main className="flex-1 ml-0 lg:ml-64 p-6 pt-20 lg:pt-6">{children}</main>
    </div>
  );
}
