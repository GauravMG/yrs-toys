import { Navigate, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@yrs/ui";
import { Spinner } from "@yrs/ui";
import { useAuth, useLogout } from "../../hooks/useAuth";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-md px-3.5 py-2.5 text-sm font-medium transition-colors hover:bg-cream-dark",
    isActive && "bg-gold/10 font-semibold text-gold-dark",
  );

export function AccountLayout() {
  const { isAuthenticated, isHydrating, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useLogout();

  if (isHydrating) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size={28} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <div className="mx-auto max-w-[1100px] px-5 py-10 sm:px-8">
      <h1 className="mb-1 text-[28px]">My Account</h1>
      <p className="mb-8 text-sm text-ink-soft">Signed in as {user?.email}</p>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        <nav className="flex flex-row gap-1 overflow-x-auto md:flex-col">
          <NavLink to="/account/orders" className={navLinkClass}>
            Orders
          </NavLink>
          <NavLink to="/account/addresses" className={navLinkClass}>
            Addresses
          </NavLink>
          <NavLink to="/account/wishlist" className={navLinkClass}>
            Wishlist
          </NavLink>
          <NavLink to="/account/profile" className={navLinkClass}>
            Profile
          </NavLink>
          <button
            type="button"
            onClick={() => logout.mutate(undefined, { onSuccess: () => navigate("/") })}
            className="rounded-md px-3.5 py-2.5 text-left text-sm font-medium text-terracotta transition-colors hover:bg-cream-dark"
          >
            Sign out
          </button>
        </nav>
        <div>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
