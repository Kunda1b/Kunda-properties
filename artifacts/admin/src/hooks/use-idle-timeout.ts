import { useEffect, useRef } from "react";
import { useAdminStore } from "@/lib/store/admin.store";

const DEFAULT_IDLE_MS = 20 * 60 * 1000; // 20 minutes for admin

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "visibilitychange"] as const;

/** Logs admin out after idle period. */
export function useIdleTimeout(idleMs = DEFAULT_IDLE_MS) {
  const logout = useAdminStore((s) => s.logout);
  const accessToken = useAdminStore((s) => s.accessToken);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!accessToken || typeof window === "undefined") return;

    const reset = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        logout();
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
  }, [accessToken, idleMs, logout]);
}
