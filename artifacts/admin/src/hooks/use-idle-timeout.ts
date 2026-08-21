import { useEffect, useRef } from "react";
import { useAdminStore } from "@/lib/store/admin.store";
import { authApi } from "@/lib/api";

const DEFAULT_IDLE_MS = 20 * 60 * 1000; // 20 minutes for admin

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "visibilitychange"] as const;

/** Logs admin out after idle period. */
export function useIdleTimeout(idleMs = DEFAULT_IDLE_MS) {
  const logout = useAdminStore((s) => s.logout);
  const accessToken = useAdminStore((s) => s.accessToken);
  const user = useAdminStore((s) => s.user);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if ((!accessToken && !user) || typeof window === "undefined") return;

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void authApi.logout().catch(() => {}).finally(logout);
        window.location.href = `${import.meta.env.BASE_URL}login?reason=idle`;
      }, idleMs);
    };

    reset();
    for (const ev of ACTIVITY_EVENTS) {
      window.addEventListener(ev, reset, { passive: true });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      for (const ev of ACTIVITY_EVENTS) {
        window.removeEventListener(ev, reset);
      }
    };
  }, [accessToken, user, idleMs, logout]);
}
