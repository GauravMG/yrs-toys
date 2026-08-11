import { useEffect, useRef } from "react";
import { useAuthStore } from "../store/auth-store";
import { refresh } from "../lib/api/auth";

/**
 * Runs once on app mount: silently attempts POST /auth/refresh (the httpOnly
 * cookie, if any, travels automatically). If it succeeds AND the returned
 * user is an ADMIN, the store is populated; otherwise the store is cleared
 * so a stale CUSTOMER-role cookie can never leave this app half-authenticated.
 */
export function useBootstrapAuth(): void {
  const setAuth = useAuthStore((s) => s.setAuth);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const setHydrated = useAuthStore((s) => s.setHydrated);
  const ranOnce = useRef(false);

  useEffect(() => {
    // Guards against firing twice — both React 18 StrictMode's dev-only
    // double-invoke of effects, and any future remount of whatever mounts
    // this hook. This deliberately does NOT use a cleanup-based
    // cancellation flag (`let cancelled = false; return () => { cancelled =
    // true }`): that pattern still lets the FIRST invocation's
    // `POST /auth/refresh` actually reach the server before being marked
    // cancelled client-side. Refresh tokens rotate on every use, and the
    // API's reuse-detection treats a second call presenting the
    // already-rotated token as theft and revokes the *entire* session —
    // so StrictMode's double-invoke would silently log a just-restored
    // admin back out. A one-shot ref prevents the second call from ever
    // firing in the first place.
    if (ranOnce.current) return;
    ranOnce.current = true;

    (async () => {
      try {
        const result = await refresh();
        if (result.user.role === "ADMIN") {
          setAuth(result.user, result.accessToken);
        } else {
          clearAuth();
        }
      } catch {
        clearAuth();
      } finally {
        setHydrated();
      }
    })();
  }, [setAuth, clearAuth, setHydrated]);
}
