import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth.store";
import { cn } from "@/lib/utils";

const schema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  role: z.enum(["BUYER", "SELLER", "AGENT"]),
});
type Form = z.infer<typeof schema>;

const ROLE_OPTIONS = [
  { value: "BUYER" as const, label: "Buy", icon: "🏠", desc: "I want to purchase property" },
  { value: "SELLER" as const, label: "Sell", icon: "🏷️", desc: "I want to list property" },
  { value: "AGENT" as const, label: "Agent", icon: "🤝", desc: "I represent buyers or sellers" },
];

// Google brand icon
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const loginSuccess = useAuthStore((s) => s.loginSuccess);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { role: "BUYER" },
  });
  const role = watch("role");

  const onSubmit = async (data: Form) => {
    try {
      await authApi.register(data);
      const loginRes = await authApi.login({ email: data.email, password: data.password });
      const { user, accessToken, refreshToken } = loginRes.data.data;
      loginSuccess(user, accessToken, refreshToken);
      toast.success("Welcome to Kunda! 🇬🇲");
      navigate("/dashboard");
    } catch (err: any) { toast.error(err?.response?.data?.error || "Registration failed."); }
  };

  const handleGoogleSignUp = () => {
    window.location.href = "/api/auth/google";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-kunda-950 to-kunda-700 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-4xl font-bold text-white">Kunda<span className="text-sand-400">.</span></Link>
          <p className="text-white/70 mt-2 text-sm">🇬🇲 Gambia's Diaspora Property Platform</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h1 className="font-display text-2xl font-bold text-gray-900 mb-6">Create your account</h1>

          {/* Google sign-up */}
          <button
            type="button"
            onClick={handleGoogleSignUp}
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors mb-5"
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200" /></div>
            <div className="relative flex justify-center"><span className="px-3 bg-white text-xs text-gray-400">or create an account</span></div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Role picker */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I want to…</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLE_OPTIONS.map((r) => (
                  <label key={r.value} className={cn("flex flex-col items-center gap-1 p-3 rounded-xl border-2 cursor-pointer transition-colors text-center",
                    role === r.value ? "border-kunda-700 bg-kunda-50" : "border-gray-200 hover:border-gray-300")}>
                    <input {...register("role")} type="radio" value={r.value} className="sr-only" />
                    <span className="text-xl">{r.icon}</span>
                    <span className="text-xs font-bold text-gray-800">{r.label}</span>
                    <span className="text-[10px] text-gray-500 leading-tight">{r.desc}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <input {...register("firstName")} placeholder="First name" className={cn("input-field", errors.firstName && "border-red-300")} />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">Required</p>}
              </div>
              <div>
                <input {...register("lastName")} placeholder="Last name" className={cn("input-field", errors.lastName && "border-red-300")} />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">Required</p>}
              </div>
            </div>
            <input {...register("email")} type="email" placeholder="you@example.com" className={cn("input-field", errors.email && "border-red-300")} />
            <div>
              <input {...register("password")} type="password" placeholder="Min 8 chars, upper + lower + number" className={cn("input-field", errors.password && "border-red-300")} />
              {errors.password && <p className="text-red-500 text-xs mt-1">Password needs 8+ chars with uppercase, lowercase and a number</p>}
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />} Create Account
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account? <Link href="/auth/login" className="text-kunda-600 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
