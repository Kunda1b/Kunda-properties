"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth.store";
import { cn } from "@/lib/utils";

const schema = z.object({
  firstName: z.string().min(1).max(50), lastName: z.string().min(1).max(50),
  email: z.string().email(), password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  role: z.enum(["BUYER","SELLER","AGENT"]),
});
type Form = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const loginSuccess = useAuthStore((s) => s.loginSuccess);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { role: "BUYER" } });
  const role = watch("role");

  const onSubmit = async (data: Form) => {
    try {
      await authApi.register(data);
      const loginRes = await authApi.login({ email: data.email, password: data.password });
      const { user, accessToken, refreshToken } = loginRes.data.data;
      loginSuccess(user, accessToken, refreshToken);
      router.push("/dashboard");
    } catch (err: any) { toast.error(err?.response?.data?.error || "Registration failed."); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-kunda-950 to-kunda-700 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-4xl font-bold text-white">Kunda<span className="text-sand-400">.</span></Link>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Create your account</h1>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(["BUYER","SELLER","AGENT"] as const).map((r) => (
                <label key={r} className={cn("flex items-center justify-center p-3 rounded-lg border-2 cursor-pointer text-sm font-medium", role===r ? "border-kunda-700 bg-kunda-50 text-kunda-700" : "border-gray-200 text-gray-600")}>
                  <input {...register("role")} type="radio" value={r} className="sr-only" />
                  {r === "BUYER" ? "Buy" : r === "SELLER" ? "Sell" : "Agent"}
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><input {...register("firstName")} placeholder="First name" className="input-field" /></div>
              <div><input {...register("lastName")} placeholder="Last name" className="input-field" /></div>
            </div>
            <input {...register("email")} type="email" placeholder="you@example.com" className="input-field" />
            <input {...register("password")} type="password" placeholder="Min 8 chars, upper+lower+number" className="input-field" />
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Create Account
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">Already have an account? <Link href="/auth/login" className="text-kunda-600 font-medium">Sign in</Link></p>
        </div>
      </div>
    </div>
  );
}
