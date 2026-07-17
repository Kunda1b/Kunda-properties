import { useAuthStore } from "@/lib/store/auth.store";
import { getInitials } from "@/lib/utils";

export default function ProfilePage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-kunda-700 flex items-center justify-center text-white text-xl font-bold">
            {user?.profile ? getInitials(user.profile.firstName || "", user.profile.lastName || "") : "U"}
          </div>
          <div>
            <h2 className="font-display text-xl font-bold text-gray-900">{user?.profile?.firstName} {user?.profile?.lastName}</h2>
            <p className="text-gray-500 text-sm">{user?.email}</p>
            <span className="badge bg-kunda-100 text-kunda-700 mt-1">{user?.role}</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">First Name</label>
              <input defaultValue={user?.profile?.firstName || ""} className="input-field" readOnly />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Last Name</label>
              <input defaultValue={user?.profile?.lastName || ""} className="input-field" readOnly />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
            <input defaultValue={user?.email || ""} className="input-field" readOnly />
          </div>
        </div>
      </div>
    </div>
  );
}
