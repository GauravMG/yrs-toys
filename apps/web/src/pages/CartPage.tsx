import { Link, useNavigate } from "react-router-dom";
import { Button, Spinner } from "@yrs/ui";
import { useCart } from "../hooks/useCart";
import { useCartActions } from "../hooks/useCartActions";
import { CartLineItem } from "../components/cart/CartLineItem";
import { CartSummary } from "../components/cart/CartSummary";

export function CartPage() {
  const { data: cart, isLoading } = useCart();
  const { onQuantityChange, onRemove, isPending } = useCartActions();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size={28} />
      </div>
    );
  }

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <div className="mx-auto max-w-[1000px] px-5 py-10 sm:px-8">
      <h1 className="mb-8 text-[28px]">Your Cart</h1>

      {isEmpty ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center text-ink-soft">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="text-line">
            <circle cx="9" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 7H6" />
          </svg>
          <p>Your cart is empty. Add a toy or two!</p>
          <Link to="/shop">
            <Button>Continue shopping</Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1fr_320px]">
          <div className="rounded-lg border border-line bg-panel px-5">
            {cart!.items.map((item) => (
              <CartLineItem key={item.id} item={item} onQuantityChange={onQuantityChange} onRemove={onRemove} disabled={isPending} />
            ))}
          </div>
          <div className="flex flex-col gap-5 rounded-lg border border-line bg-panel p-5">
            <CartSummary cart={cart!} />
            <Button onClick={() => navigate("/checkout")}>Proceed to checkout</Button>
          </div>
        </div>
      )}
    </div>
  );
}
