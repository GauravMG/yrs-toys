import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button, Input, useToast } from "@yrs/ui";
import { apiClient } from "../../lib/api-client";

export function Footer() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  async function handleSubscribe(event: FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post("/newsletter/subscribe", { email: email.trim() });
      showToast("You're subscribed — welcome to the family!");
      setEmail("");
    } catch {
      showToast("Couldn't subscribe right now — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <footer className="border-t border-line bg-cream-dark">
      <div className="mx-auto grid max-w-[1240px] grid-cols-1 gap-10 px-5 py-14 sm:px-8 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-2xl tracking-[0.12em] text-gold-dark">YRS TOYS</div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
            Handcrafted, sustainable, safe toys for curious little hands. Play. Learn. Grow.
          </p>
          <form onSubmit={handleSubscribe} className="mt-5 flex max-w-sm items-end gap-2">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email for newsletter"
              className="flex-1"
            />
            <Button type="submit" size="sm" isLoading={isSubmitting}>
              Subscribe
            </Button>
          </form>
        </div>

        <div>
          <h4 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-ink">Shop</h4>
          <ul className="flex flex-col gap-2 text-sm text-ink-soft">
            <li>
              <Link to="/shop" className="hover:text-gold-dark">
                All products
              </Link>
            </li>
            <li>
              <Link to="/shop?sort=newest" className="hover:text-gold-dark">
                New arrivals
              </Link>
            </li>
            <li>
              <Link to="/about" className="hover:text-gold-dark">
                About us
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-[13px] font-bold uppercase tracking-wider text-ink">Account</h4>
          <ul className="flex flex-col gap-2 text-sm text-ink-soft">
            <li>
              <Link to="/account/orders" className="hover:text-gold-dark">
                Track an order
              </Link>
            </li>
            <li>
              <Link to="/account/wishlist" className="hover:text-gold-dark">
                Wishlist
              </Link>
            </li>
            <li>
              <Link to="/login" className="hover:text-gold-dark">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line bg-ink py-5 text-center text-[12.5px] tracking-wide text-cream-dark">
        © {new Date().getFullYear()} YRS Toys. Crafted with care for curious little hands.
      </div>
    </footer>
  );
}
