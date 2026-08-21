import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";

export default function ResetPasswordPage() {
  const [, navigate] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") || "";
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8 || !token) return;
    setLoading(true);
    try {
      await authApi.resetPassword({ token, password });
      toast.success("Password reset successfully.");
      navigate("/auth/login");
    } catch (err: any) {
      toast.error(err?.response?.data?.error || "This reset link is invalid or expired.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-kunda-950 to-kunda-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
        <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to sign in
        </Link>
        <h1 className="font-display text-2xl font-bold text-gray-900 mb-2">Choose a new password</h1>
        <p className="text-gray-500 text-sm mb-6">Use at least 8 characters.</p>
        <form onSubmit={submit} className="space-y-4">
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-field"
            placeholder="New password"
          />
          <button disabled={loading || !token || password.length < 8} className="btn-primary w-full flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />} Reset password
          </button>
        </form>
      </div>
    </div>
  );
}
