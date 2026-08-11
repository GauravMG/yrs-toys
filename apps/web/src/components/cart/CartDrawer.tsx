import { useNavigate } from "react-router-dom";
import { Button, Drawer, Spinner } from "@yrs/ui";
import { useCart } from "../../hooks/useCart";
import { useCartActions } from "../../hooks/useCartActions";
import { useUiStore } from "../../store/ui-store";
import { CartLineItem } from "./CartLineItem";
import { CartSummary } from "./CartSummary";

export function CartDrawer() {
  const isOpen = useUiStore((s) => s.isCartDrawerOpen);
  const setOpen = useUiStore((s) => s.setCartDrawerOpen);
  const navigate = useNavigate();
  const { data: cart, isLoading } = useCart();
  const { onQuantityChange, onRemove, isPending } = useCartActions();

  const isEmpty = !cart || cart.items.length === 0;

  return (
    <Drawer
      open={isOpen}
      onOpenChange={setOpen}
      title="Your cart"
      footer={
        !isEmpty && cart ? (
          <div className="flex flex-col gap-4">
            <CartSummary cart={cart} />
            <Button
              className="w-full"
              onClick={() => {
                setOpen(false);
                navigate("/checkout");
              }}
            >
              Checkout
            </Button>
          </div>
        ) : undefined
      }
    >
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : isEmpty ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center text-sm text-ink-soft">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.4} className="text-line">
            <circle cx="9" cy="21" r="1" />
            <circle cx="19" cy="21" r="1" />
            <path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 7H6" />
          </svg>
          Your cart is empty. Add a toy or two!
        </div>
      ) : (
        <div>
          {cart!.items.map((item) => (
            <CartLineItem key={item.id} item={item} onQuantityChange={onQuantityChange} onRemove={onRemove} disabled={isPending} />
          ))}
        </div>
      )}
    </Drawer>
  );
}
