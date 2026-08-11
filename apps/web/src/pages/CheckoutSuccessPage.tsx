import { Link, useLocation, useParams } from "react-router-dom";
import { Button, Spinner } from "@yrs/ui";
import { formatINR } from "@yrs/shared";
import type { Order } from "@yrs/shared";
import { useOrderDetail } from "../hooks/useOrders";
import { useAuth } from "../hooks/useAuth";

export function CheckoutSuccessPage() {
  const { orderNumber = "" } = useParams<{ orderNumber: string }>();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const orderFromNav = (location.state as { order?: Order } | null)?.order;

  // The order returned straight from the checkout POST is used when
  // available (works for both guests and members); otherwise fall back to a
  // fetch, which only succeeds for the order's owner (guests need their
  // email to look an order up, which we don't have here on a bare reload).
  const { data: fetchedOrder, isLoading } = useOrderDetail(orderFromNav ? undefined : orderNumber);
  const order = orderFromNav ?? fetchedOrder;

  if (!orderFromNav && isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size={28} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[640px] px-5 py-16 text-center sm:px-8">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-sage/15 text-sage">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4}>
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <h1 className="font-display text-[28px]">Order placed!</h1>
      <p className="mt-2 text-ink-soft">
        Thank you for shopping with YRS Toys. Your order number is <strong className="text-ink">{orderNumber}</strong>.
      </p>
      <p className="mt-1 text-sm text-ink-soft">A confirmation email is on its way to your inbox.</p>

      {order && (
        <div className="mt-8 rounded-lg border border-line bg-panel p-6 text-left">
          <div className="flex justify-between text-sm">
            <span className="text-ink-soft">Items</span>
            <span>{order.items.length}</span>
          </div>
          <div className="mt-2 flex justify-between text-sm">
            <span className="text-ink-soft">Shipping to</span>
            <span className="text-right">
              {order.shipFullName}
              <br />
              {order.shipLine1}, {order.shipCity}, {order.shipState} {order.shipPostalCode}
            </span>
          </div>
          <div className="mt-4 flex justify-between border-t border-line pt-4 text-base">
            <span>Total paid on delivery</span>
            <strong>{formatINR(order.totalInPaise)}</strong>
          </div>
        </div>
      )}

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Link to="/shop">
          <Button variant="outline">Continue shopping</Button>
        </Link>
        {isAuthenticated && (
          <Link to="/account/orders">
            <Button>View my orders</Button>
          </Link>
        )}
      </div>
    </div>
  );
}
