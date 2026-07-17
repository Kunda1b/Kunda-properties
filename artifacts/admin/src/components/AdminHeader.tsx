import { Bell } from "lucide-react";
import { useAdminStore } from "@/lib/store/admin.store";

interface Props { title: string; subtitle?: string; }

export function AdminHeader({ title, subtitle }: Props) {
  const user = useAdminStore((s) => s.user);
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button className="relative p-2 text-gray-500 hover:text-gray-900">
          <Bell className="w-5 h-5" />
        </button>
        <div className="w-8 h-8 rounded-full bg-kunda-700 flex items-center justify-center text-white text-xs font-bold">
          {user?.profile?.firstName?.[0] || "A"}
        </div>
      </div>
    </div>
  );
}
