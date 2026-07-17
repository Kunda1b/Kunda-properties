import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAdminStore } from "@/lib/store/admin.store";
import { cn } from "@/lib/utils";

interface Form { email: string; password: string; }

export default function AdminLoginPage() {
  const [, navigate] = useLocation();
  const { loginSuccess } = useAdminStore();
  const { register, handleSubmit, formState: { isSubmitting, errors } } = useForm<Form>();

  const onSubmit = async (data: Form) => {
    try {
      const res = await authApi.login(data);
      const { user, accessToken } = res.data.data;
      if (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN") {
        toast.error("Admin access required.");
        return;
      }
      loginSuccess(user, accessToken);
      navigate("/");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "Login failed.");
    }
  };

  return (
    <div className="min-h-screen bg-kunda-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Kunda<span className="text-sand-400">.</span></h1>
          <p className="text-white/50 text-sm mt-1">Admin Portal</p>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Sign in</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                {...register("email", { required: true })}
                type="email"
                className={cn("input-field", errors.email && "border-red-300")}
                placeholder="admin@kunda.gm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                {...register("password", { required: true })}
                type="password"
                className={cn("input-field", errors.password && "border-red-300")}
              />
            </div>
            <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
