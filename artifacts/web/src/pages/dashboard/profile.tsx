import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, X, Check, Camera } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth.store";
import { getInitials } from "@/lib/utils";

const profileSchema = z.object({
  firstName: z.string().min(1, "Required").max(50),
  lastName: z.string().min(1, "Required").max(50),
  phone: z.string().max(20).optional().nullable(),
  bio: z.string().max(1000).optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  country: z.string().max(100).optional().nullable(),
  diasporaCountry: z.string().max(100).optional().nullable(),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

type ProfileForm = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const [editing, setEditing] = useState(false);
  const { user, updateUser } = useAuthStore();
  const qc = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.profile?.firstName || "",
      lastName: user?.profile?.lastName || "",
      phone: (user as any)?.phone || "",
      bio: (user?.profile as any)?.bio || "",
      city: (user?.profile as any)?.city || "",
      country: (user?.profile as any)?.country || "",
      diasporaCountry: (user as any)?.diasporaCountry || "",
      avatarUrl: user?.profile?.avatarUrl || "",
    },
  });

  const saveMutation = useMutation({
    mutationFn: (data: ProfileForm) =>
      api.patch("/profile", {
        firstName: data.firstName,
        lastName: data.lastName,
        bio: data.bio || null,
        city: data.city || null,
        country: data.country || null,
        avatarUrl: data.avatarUrl || null,
        phone: data.phone || null,
        diasporaCountry: data.diasporaCountry || null,
      }),
    onSuccess: (res) => {
      const updated = res.data.data;
      updateUser({
        profile: {
          ...user?.profile,
          firstName: updated.profile?.firstName,
          lastName: updated.profile?.lastName,
          avatarUrl: updated.profile?.avatarUrl,
        },
      });
      toast.success("Profile updated");
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.error || "Failed to update profile"),
  });

  const handleCancel = () => {
    reset();
    setEditing(false);
  };

  const initials = user?.profile
    ? getInitials(user.profile.firstName || "", user.profile.lastName || "")
    : "U";

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Profile</h1>

      <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))}>
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
          {/* Avatar + name header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                {user?.profile?.avatarUrl ? (
                  <img
                    src={user.profile.avatarUrl}
                    alt={initials}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-kunda-700 flex items-center justify-center text-white text-xl font-bold">
                    {initials}
                  </div>
                )}
                {editing && (
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-kunda-700 rounded-full flex items-center justify-center">
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-gray-900">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </h2>
                <p className="text-gray-500 text-sm">{user?.email}</p>
                <span className="badge bg-kunda-100 text-kunda-700 mt-1">{user?.role}</span>
              </div>
            </div>

            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="btn-outline flex items-center gap-2 text-sm py-2"
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="btn-outline flex items-center gap-1.5 text-sm py-2 px-3"
                >
                  <X className="w-3.5 h-3.5" /> Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="btn-primary flex items-center gap-1.5 text-sm py-2 px-4"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  First Name
                </label>
                <input
                  {...register("firstName")}
                  readOnly={!editing}
                  className={`input-field ${!editing ? "bg-gray-50 cursor-default" : ""}`}
                />
                {errors.firstName && (
                  <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Last Name
                </label>
                <input
                  {...register("lastName")}
                  readOnly={!editing}
                  className={`input-field ${!editing ? "bg-gray-50 cursor-default" : ""}`}
                />
                {errors.lastName && (
                  <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                defaultValue={user?.email || ""}
                readOnly
                className="input-field bg-gray-50 cursor-default"
              />
              <p className="text-xs text-gray-400 mt-1">Email cannot be changed here</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Phone
              </label>
              <input
                {...register("phone")}
                readOnly={!editing}
                placeholder={editing ? "+44 7700 123456" : "Not set"}
                className={`input-field ${!editing ? "bg-gray-50 cursor-default" : ""}`}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Bio
              </label>
              <textarea
                {...register("bio")}
                readOnly={!editing}
                rows={3}
                placeholder={editing ? "Tell buyers or sellers a bit about yourself…" : "Not set"}
                className={`input-field resize-none ${!editing ? "bg-gray-50 cursor-default" : ""}`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  City
                </label>
                <input
                  {...register("city")}
                  readOnly={!editing}
                  placeholder={editing ? "London" : "Not set"}
                  className={`input-field ${!editing ? "bg-gray-50 cursor-default" : ""}`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Country of Residence
                </label>
                <input
                  {...register("country")}
                  readOnly={!editing}
                  placeholder={editing ? "United Kingdom" : "Not set"}
                  className={`input-field ${!editing ? "bg-gray-50 cursor-default" : ""}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Diaspora Country
              </label>
              <input
                {...register("diasporaCountry")}
                readOnly={!editing}
                placeholder={editing ? "United Kingdom" : "Not set"}
                className={`input-field ${!editing ? "bg-gray-50 cursor-default" : ""}`}
              />
              {editing && (
                <p className="text-xs text-gray-400 mt-1">
                  The country you currently live in outside The Gambia
                </p>
              )}
            </div>

            {editing && (
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Avatar URL
                </label>
                <input
                  {...register("avatarUrl")}
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  className="input-field"
                />
                {errors.avatarUrl && (
                  <p className="text-red-500 text-xs mt-1">{errors.avatarUrl.message}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </form>

      {/* Account info read-only */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-semibold text-gray-900 mb-4 text-sm uppercase tracking-wider">Account</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-gray-500">Account type</span>
            <span className="font-medium text-gray-900">{user?.role}</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-gray-50">
            <span className="text-gray-500">Email verified</span>
            <span className="font-medium text-green-600">Verified ✓</span>
          </div>
          <div className="flex justify-between items-center py-2">
            <span className="text-gray-500">KYC status</span>
            <span className={`font-medium ${
              (user as any)?.kyc?.status === "VERIFIED" ? "text-green-600" :
              (user as any)?.kyc?.status === "SUBMITTED" ? "text-yellow-600" :
              "text-gray-500"
            }`}>
              {(user as any)?.kyc?.status || "Not submitted"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
