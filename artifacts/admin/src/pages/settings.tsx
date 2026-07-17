import { Settings } from "lucide-react";
import { AdminHeader } from "@/components/AdminHeader";

export default function SettingsPage() {
  return (
    <div>
      <AdminHeader title="Settings" subtitle="Platform configuration" />
      <div className="bg-white rounded-xl border border-gray-100 p-8 text-center max-w-lg">
        <Settings className="w-8 h-8 text-gray-300 mx-auto mb-3" />
        <h3 className="font-semibold text-gray-900 mb-2">Settings Coming Soon</h3>
        <p className="text-gray-500 text-sm">Platform configuration will be available once the backend is connected.</p>
      </div>
    </div>
  );
}
