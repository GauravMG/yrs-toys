import { Button } from "@yrs/ui";
import { useAuthStore } from "../../store/auth-store";
import { useLogout } from "../../hooks/useAuth";

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const logout = useLogout();

  return (
    <header className="flex h-16 flex-none items-center justify-end gap-4 border-b border-line bg-panel px-6">
      <div className="text-right">
        <p className="text-sm font-semibold text-ink">{user?.fullName}</p>
        <p className="text-xs text-ink-soft">{user?.email}</p>
      </div>
      <Button type="button" variant="outline" size="sm" isLoading={logout.isPending} onClick={() => logout.mutate()}>
        Log out
      </Button>
    </header>
  );
}
