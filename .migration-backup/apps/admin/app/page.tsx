"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { api } from "@/lib/api";
import { useAdminStore } from "@/lib/store/admin.store";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
type Form = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAdminStore((s) => s.loginSuccess);
  const [showPw, setShowPw] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    try {
      const res = await api.post("/auth/login", data);
      const { user, accessToken, refreshToken } = res.data.data;
      if (user.role !== "ADMIN") { toast.error("Access denied. Admin accounts only."); return; }
      login(user, accessToken, refreshToken);
      router.push("/dashboard");
    } catch (err: any) { toast.error(err?.response?.data?.error || "Invalid credentials"); }
  };

  return (
    <div className="min-h-screen bg-kunda-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-kunda-700 rounded-2xl flex items-center justify-center mx-auto mb-4"><ShieldCheck className="w-8 h-8 text-white" /></div>
          <h1 className="text-2xl font-bold text-white">Kunda Admin</h1>
          <p className="text-white/50 text-sm mt-1">Control Panel · Authorised Access Only</p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Email</label>
              <input {...register("email")} type="email" className="input-field" placeholder="admin@kundaproperties.gm" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
              <input {...register("password")} type={showPw ? "text" : "password"} className="input-field" placeholder="••••••••" />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5">
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {isSubmitting ? "Signing in…" : "Sign In to Admin"}
            </button>
          </form>
        </div>
        <p className="text-center text-white/30 text-xs mt-6">🇬🇲 Kunda Properties Admin · All activity is logged</p>
      </div>
    </div>
  );
}
