import { NavLink } from "react-router-dom";
import { cn } from "@yrs/ui";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Dashboard", icon: "⌂" },
  { to: "/products", label: "Products", icon: "▦" },
  { to: "/categories", label: "Categories", icon: "☷" },
  { to: "/orders", label: "Orders", icon: "⚑" },
  { to: "/coupons", label: "Coupons", icon: "✱" },
  { to: "/reviews", label: "Reviews", icon: "★" },
  { to: "/customers", label: "Customers", icon: "☺" },
  { to: "/settings", label: "Settings", icon: "⚙" },
];

export function Sidebar() {
  return (
    <aside className="flex w-60 flex-none flex-col border-r border-line bg-panel">
      <div className="flex items-center gap-2 border-b border-line px-6 py-5">
        <span className="font-display text-lg font-semibold text-ink">YRS Toys</span>
        <span className="rounded-full bg-cream-dark px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink-soft">
          Admin
        </span>
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-semibold transition-colors",
                isActive ? "bg-gold text-white" : "text-ink-soft hover:bg-cream-dark hover:text-ink",
              )
            }
          >
            <span aria-hidden className="w-4 text-center">
              {item.icon}
            </span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
