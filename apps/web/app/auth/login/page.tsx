"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth.store";
import { cn } from "@/lib/utils";

const schema = z.object({ email: z.string().email(), password: z.string().min(1) });
type Form = z.infer<typeof schema>;

export default function LoginPage() {
  const [showPw, setShowPw] = useState(false);
  const router = useRouter();
  const loginSuccess = useAuthStore((s) => s.loginSuccess);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    try {
      const res = await authApi.login(data);
      const { user, accessToken, refreshToken } = res.data.data;
      loginSuccess(user, accessToken, refreshToken);
      toast.success(`Welcome back, ${user.profile?.firstName || ""}!`);
      router.push("/dashboard");
    } catch (err: any) { toast.error(err?.response?.data?.error || "Login failed."); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-kunda-950 to-kunda-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-4xl font-bold text-white">Kunda<span className="text-sand-400">.</span></Link>
          <p className="text-white/70 mt-2 text-sm">🇬🇲 Gambia&apos;s Diaspora Property Platform</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-gray-500 text-sm mb-6">Sign in to your account</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input {...register("email")} type="email" className={cn("input-field", errors.email && "border-red-300")} />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input {...register("password")} type={showPw ? "text" : "password"} className={cn("input-field pr-10", errors.password && "border-red-300")} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Sign In
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">Don&apos;t have an account? <Link href="/auth/register" className="text-kunda-600 font-medium">Create one</Link></p>
        </div>
      </div>
    </div>
  );
}
