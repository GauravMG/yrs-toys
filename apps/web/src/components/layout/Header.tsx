import { useState } from "react";
import type { FormEvent } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { cn } from "@yrs/ui";
import { useCart } from "../../hooks/useCart";
import { useAuth } from "../../hooks/useAuth";
import { useUiStore } from "../../store/ui-store";
import { AnnouncementBar } from "./AnnouncementBar";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "border-b-2 border-transparent pb-1 text-[13px] font-semibold uppercase tracking-wider text-ink-soft transition-colors hover:border-gold hover:text-gold-dark",
    isActive && "border-gold text-gold-dark",
  );

export function Header() {
  const [isSearchOpen, setSearchOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { data: cart } = useCart();
  const { isAuthenticated } = useAuth();
  const openCartDrawer = useUiStore((s) => s.openCartDrawer);

  const itemCount = cart?.itemCount ?? 0;

  function handleSearchSubmit(event: FormEvent) {
    event.preventDefault();
    const q = searchTerm.trim();
    setSearchOpen(false);
    navigate(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
  }

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/95 backdrop-blur-sm">
      <AnnouncementBar />
      <div className="relative mx-auto flex max-w-[1240px] items-center justify-between px-5 py-4 sm:px-8">
        <div className="flex items-center gap-7">
          <button
            type="button"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
            className="flex flex-col gap-1 p-1.5 sm:hidden"
          >
            <span className="block h-0.5 w-5 bg-ink" />
            <span className="block h-0.5 w-5 bg-ink" />
            <span className="block h-0.5 w-5 bg-ink" />
          </button>
          <ul className="hidden items-center gap-7 sm:flex">
            <li>
              <NavLink to="/" end className={navLinkClass}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/shop" className={navLinkClass}>
                Shop
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className={navLinkClass}>
                About us
              </NavLink>
            </li>
          </ul>
        </div>

        <Link to="/" className="text-center">
          <div className="font-display text-2xl tracking-[0.12em] text-gold-dark">YRS</div>
          <div className="-mt-1 text-[10px] tracking-[0.5em] text-ink-soft">TOYS</div>
        </Link>

        <div className="flex items-center gap-2.5 sm:gap-4">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen((v) => !v)}
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-ink transition-colors hover:bg-cream-dark"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" />
            </svg>
          </button>
          <Link
            to={isAuthenticated ? "/account" : "/login"}
            aria-label="Account"
            className="flex h-[34px] w-[34px] items-center justify-center rounded-full text-ink transition-colors hover:bg-cream-dark"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c1.6-4 5-6 8-6s6.4 2 8 6" />
            </svg>
          </Link>
          <button
            type="button"
            aria-label="Cart"
            onClick={openCartDrawer}
            className="relative flex h-[34px] w-[34px] items-center justify-center rounded-full text-ink transition-colors hover:bg-cream-dark"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="9" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 7H6" />
            </svg>
            {itemCount > 0 && (
              <span
                key={itemCount}
                data-testid="cart-badge"
                className="absolute -right-1 -top-0.5 flex h-[17px] w-[17px] animate-bump items-center justify-center rounded-full bg-gold text-[10px] font-bold text-white"
              >
                {itemCount}
              </span>
            )}
          </button>
        </div>

        {isSearchOpen && (
          <div className="absolute left-0 right-0 top-full border-b border-line bg-panel px-5 py-4 shadow-soft sm:px-8">
            <form onSubmit={handleSearchSubmit} className="mx-auto max-w-[1176px]">
              <input
                autoFocus
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for wooden toys, plushies, activity sets..."
                className="w-full rounded-lg border border-line bg-cream px-4 py-3 text-sm outline-none focus:border-gold"
              />
            </form>
          </div>
        )}

        {isMenuOpen && (
          <div className="absolute left-0 right-0 top-full flex flex-col gap-4 border-b border-line bg-panel px-5 py-4 shadow-soft sm:hidden">
            <NavLink to="/" end className={navLinkClass} onClick={() => setMenuOpen(false)}>
              Home
            </NavLink>
            <NavLink to="/shop" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              Shop
            </NavLink>
            <NavLink to="/about" className={navLinkClass} onClick={() => setMenuOpen(false)}>
              About us
            </NavLink>
          </div>
        )}
      </div>
    </header>
  );
}
