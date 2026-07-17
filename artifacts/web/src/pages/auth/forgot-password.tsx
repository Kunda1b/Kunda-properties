import { useState } from "react";
import { Link } from "wouter";
import { Loader2, CheckCircle, ArrowLeft } from "lucide-react";
import { authApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      // Always show the success state to prevent email enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-kunda-950 to-kunda-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-4xl font-bold text-white">Kunda<span className="text-sand-400">.</span></Link>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {sent ? (
            <div className="text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
              <p className="text-gray-500 mb-6">
                If <strong>{email}</strong> is associated with a Kunda account, we've sent a password reset link. Check your spam folder if you don't see it.
              </p>
              <Link href="/auth/login" className="btn-primary w-full block text-center">Back to Sign In</Link>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-gray-600 mb-6">
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </Link>
              <h1 className="font-display text-2xl font-bold text-gray-900 mb-1">Reset your password</h1>
              <p className="text-gray-500 text-sm mb-6">Enter your email and we'll send you a reset link.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field"
                    placeholder="you@example.com"
                  />
                </div>
                <button type="submit" disabled={loading || !email} className="btn-primary w-full flex items-center justify-center gap-2">
                  {loading && <Loader2 className="w-4 h-4 animate-spin" />} Send Reset Link
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
