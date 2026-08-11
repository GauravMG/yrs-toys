import { formatINR } from "@yrs/shared";
import type { Cart } from "@yrs/shared";
import { ProductImagePlaceholder } from "../common/ProductImagePlaceholder";

export function OrderSummary({ cart }: { cart: Cart }) {
  return (
    <div className="flex flex-col gap-5 rounded-lg border border-line bg-panel p-5">
      <h2 className="font-display text-lg">Order Summary</h2>
      <div className="flex max-h-72 flex-col gap-3 overflow-y-auto">
        {cart.items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            <div className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-md bg-cream-dark">
              {item.product.primaryImage ? (
                <img src={item.product.primaryImage.url} alt="" className="h-full w-full object-contain" />
              ) : (
                <ProductImagePlaceholder />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.product.name}</p>
              <p className="text-xs text-ink-soft">Qty {item.quantity}</p>
            </div>
            <span className="flex-none text-sm font-semibold">{formatINR(item.lineTotalInPaise)}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-2 border-t border-line pt-4 text-sm">
        <div className="flex justify-between text-ink-soft">
          <span>Subtotal</span>
          <span>{formatINR(cart.subtotalInPaise)}</span>
        </div>
        {cart.discountInPaise > 0 && (
          <div className="flex justify-between text-sage">
            <span>Discount {cart.coupon ? `(${cart.coupon.code})` : ""}</span>
            <span>−{formatINR(cart.discountInPaise)}</span>
          </div>
        )}
        <div className="flex justify-between text-base">
          <span>Total</span>
          <strong className="text-lg">{formatINR(cart.totalInPaise)}</strong>
        </div>
      </div>
    </div>
  );
}
