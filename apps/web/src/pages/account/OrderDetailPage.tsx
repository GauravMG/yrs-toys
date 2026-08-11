import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button, Spinner, useToast } from "@yrs/ui";
import { formatDateTime, formatINR, ORDER_STATUS_LABELS } from "@yrs/shared";
import { useOrderDetail, useCancelOrder } from "../../hooks/useOrders";
import { OrderStatusBadge } from "../../components/account/OrderStatusBadge";
import { NotFoundPage } from "../NotFoundPage";

export function OrderDetailPage() {
  const { orderNumber } = useParams<{ orderNumber: string }>();
  const { data: order, isLoading, isError } = useOrderDetail(orderNumber);
  const cancelOrder = useCancelOrder();
  const { showToast } = useToast();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (isError || !order) {
    return <NotFoundPage />;
  }

  function handleCancel() {
    if (!orderNumber) return;
    cancelOrder.mutate(
      { orderNumber },
      {
        onSuccess: () => {
          showToast("Order cancelled");
          setShowCancelConfirm(false);
        },
        onError: (error) => showToast(error instanceof Error ? error.message : "Couldn't cancel this order"),
      },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-panel p-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-lg">{order.orderNumber}</h2>
            <OrderStatusBadge status={order.status} />
          </div>
          <span className="mt-1 block text-xs text-ink-soft">Placed {formatDateTime(order.createdAt)}</span>
        </div>
        {order.isCancellable && !showCancelConfirm && (
          <Button variant="outline" size="sm" onClick={() => setShowCancelConfirm(true)}>
            Cancel order
          </Button>
        )}
        {showCancelConfirm && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-soft">Cancel this order?</span>
            <Button size="sm" variant="outline" onClick={handleCancel} isLoading={cancelOrder.isPending}>
              Yes, cancel
            </Button>
            <button type="button" onClick={() => setShowCancelConfirm(false)} className="text-xs text-ink-soft hover:text-ink">
              Never mind
            </button>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-line bg-panel p-5">
        <h3 className="mb-4 font-display text-base">Status timeline</h3>
        <ol className="flex flex-col gap-4">
          {order.statusHistory.map((entry) => (
            <li key={entry.id} className="flex items-start gap-3">
              <span className="mt-1 h-2 w-2 flex-none rounded-full bg-gold" />
              <div>
                <p className="text-sm font-semibold">{ORDER_STATUS_LABELS[entry.status]}</p>
                <p className="text-xs text-ink-soft">{formatDateTime(entry.createdAt)}</p>
                {entry.note && <p className="mt-0.5 text-xs text-ink-soft">{entry.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-lg border border-line bg-panel p-5">
          <h3 className="mb-3 font-display text-base">Items</h3>
          <ul className="flex flex-col gap-3">
            {order.items.map((item) => (
              <li key={item.id} className="flex justify-between text-sm">
                <span>
                  {item.productNameSnapshot} × {item.quantity}
                </span>
                <span className="font-semibold">{formatINR(item.lineTotalInPaise)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-1.5 border-t border-line pt-4 text-sm">
            <div className="flex justify-between text-ink-soft">
              <span>Subtotal</span>
              <span>{formatINR(order.subtotalInPaise)}</span>
            </div>
            {order.discountInPaise > 0 && (
              <div className="flex justify-between text-sage">
                <span>Discount</span>
                <span>−{formatINR(order.discountInPaise)}</span>
              </div>
            )}
            {order.shippingInPaise > 0 && (
              <div className="flex justify-between text-ink-soft">
                <span>Shipping</span>
                <span>{formatINR(order.shippingInPaise)}</span>
              </div>
            )}
            <div className="flex justify-between text-base">
              <span>Total</span>
              <strong>{formatINR(order.totalInPaise)}</strong>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel p-5">
          <h3 className="mb-3 font-display text-base">Shipping address</h3>
          <p className="text-sm leading-relaxed text-ink-soft">
            {order.shipFullName}
            <br />
            {order.shipLine1}
            {order.shipLine2 ? `, ${order.shipLine2}` : ""}
            <br />
            {order.shipCity}, {order.shipState} {order.shipPostalCode}
            <br />
            {order.shipCountry}
            <br />
            {order.shipPhone}
          </p>
        </div>
      </div>
    </div>
  );
}
