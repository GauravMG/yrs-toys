import { Navigate, Outlet, useLocation } from "react-router-dom";
import { isAdminSession, useAuthStore } from "../store/auth-store";
import { FullPageSpinner } from "./ui/FullPageSpinner";

/** Route guard wrapping every route except /login — redirects to /login unless authenticated as an ADMIN. */
export function RequireAdmin() {
  // Select primitives individually rather than returning a new object
  // literal from one selector — Zustand's useSyncExternalStore treats a
  // fresh object every render as "changed", which caused an infinite
  // render loop ("Maximum update depth exceeded") here.
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const location = useLocation();

  if (!isHydrated) return <FullPageSpinner />;

  if (!isAdminSession({ user, accessToken })) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
