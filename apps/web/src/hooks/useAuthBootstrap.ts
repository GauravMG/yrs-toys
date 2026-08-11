import { useEffect, useRef } from "react";
import type { AuthResponse } from "@yrs/shared";
import { apiClient } from "../lib/api-client";
import { useAuthStore } from "../store/auth-store";
import { markAuthHydrated } from "../lib/auth-bootstrap";

/**
 * Runs once on app boot: attempts a silent `/auth/refresh` using the
 * httpOnly refresh cookie. If the visitor has a valid session, the auth
 * store is populated and they land already logged in; if not (guest, or an
 * expired/absent cookie) this silently no-ops and they browse as a guest.
 */
export function useAuthBootstrap(): void {
  const setAuth = useAuthStore((s) => s.setAuth);
  const setHydrating = useAuthStore((s) => s.setHydrating);
  const ranOnce = useRef(false);

  useEffect(() => {
    // Guards against firing twice — both from React 18 StrictMode's
    // dev-only double-invoke of effects, and from any future remount of
    // whatever component calls this hook. This is a one-shot boot check for
    // the lifetime of the page, so (unlike most effects) it deliberately
    // does *not* use a cleanup-based cancellation flag: under StrictMode
    // that cleanup fires synchronously between the mount/remount pair,
    // before the `/auth/refresh` network call resolves, which would discard
    // an already-successful refresh and leave the visitor stuck logged out.
    if (ranOnce.current) return;
    ranOnce.current = true;

    (async () => {
      try {
        const data = await apiClient.post<AuthResponse>("/auth/refresh");
        setAuth(data.user, data.accessToken);
      } catch {
        // No session to restore — remain a guest.
      } finally {
        setHydrating(false);
        markAuthHydrated();
      }
    })();
  }, [setAuth, setHydrating]);
}
