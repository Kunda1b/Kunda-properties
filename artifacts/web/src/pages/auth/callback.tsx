import { useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/lib/store/auth.store";

/** Handles the redirect from Google OAuth — reads tokens from URL params, fetches user, stores session. */
export default function AuthCallbackPage() {
  const [, navigate] = useLocation();
  const loginSuccess = useAuthStore((s) => s.loginSuccess);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get("access");
    const refreshToken = params.get("refresh");
    const error = params.get("error");

    if (error) {
      toast.error("Sign-in failed. Please try again.");
      navigate("/auth/login");
      return;
    }

    if (!accessToken || !refreshToken) {
      navigate("/auth/login");
      return;
    }

    // Store tokens temporarily so the api interceptor can use them
    useAuthStore.getState().setTokens(accessToken, refreshToken);

    authApi.getMe()
      .then((res) => {
        loginSuccess(res.data.data, accessToken, refreshToken);
        toast.success("Welcome to Kunda!");
        navigate("/dashboard");
      })
      .catch(() => {
        toast.error("Could not load your profile. Please sign in again.");
        useAuthStore.getState().logout();
        navigate("/auth/login");
      });
  }, []); // eslint-disable-line

  return (
    <div className="min-h-screen bg-gradient-to-br from-kunda-950 to-kunda-700 flex items-center justify-center">
      <div className="text-center text-white">
        <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" />
        <p className="text-white/80">Signing you in…</p>
      </div>
    </div>
  );
}
