import { formatINR } from "@yrs/shared";
import type { Cart } from "@yrs/shared";
import { CouponForm } from "./CouponForm";

export function CartSummary({ cart, showCoupon = true }: { cart: Cart; showCoupon?: boolean }) {
  return (
    <div className="flex flex-col gap-4">
      {showCoupon && <CouponForm coupon={cart.coupon} />}
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between text-ink-soft">
          <span>Subtotal</span>
          <span data-testid="cart-subtotal">{formatINR(cart.subtotalInPaise)}</span>
        </div>
        {cart.discountInPaise > 0 && (
          <div className="flex justify-between text-sage">
            <span>Discount</span>
            <span data-testid="cart-discount">−{formatINR(cart.discountInPaise)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-line pt-2 text-base">
          <span>Total</span>
          <strong className="text-lg" data-testid="cart-total">
            {formatINR(cart.totalInPaise)}
          </strong>
        </div>
      </div>
    </div>
  );
}
