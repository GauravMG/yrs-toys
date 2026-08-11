import { useParams, Link } from "react-router-dom";
import { Card, Spinner } from "@yrs/ui";
import { formatINR, formatDateTime, ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@yrs/shared";
import { useAdminOrder } from "../../hooks/useOrders";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { OrderStatusBadge } from "../../components/ui/OrderStatusBadge";
import { OrderStatusControl } from "./OrderStatusControl";

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: order, isLoading, isError, error } = useAdminOrder(id);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size={28} />
      </div>
    );
  }

  if (isError || !order) {
    return <ErrorBanner error={error ?? new Error("Order not found.")} />;
  }

  return (
    <div>
      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${formatDateTime(order.createdAt)}`}
        action={<OrderStatusBadge status={order.status} />}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="p-6">
            <h2 className="mb-4 font-display text-lg text-ink">Items</h2>
            <table className="w-full text-sm">
              <thead className="text-left text-xs uppercase tracking-wider text-ink-soft">
                <tr>
                  <th className="pb-2">Product</th>
                  <th className="pb-2">Qty</th>
                  <th className="pb-2 text-right">Unit price</th>
                  <th className="pb-2 text-right">Line total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {order.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2 text-ink">{item.productNameSnapshot}</td>
                    <td className="py-2 text-ink-soft">{item.quantity}</td>
                    <td className="py-2 text-right text-ink-soft">{formatINR(item.unitPriceInPaise)}</td>
                    <td className="py-2 text-right text-ink">{formatINR(item.lineTotalInPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 flex flex-col gap-1 border-t border-line pt-4 text-sm">
              <div className="flex justify-between text-ink-soft">
                <span>Subtotal</span>
                <span>{formatINR(order.subtotalInPaise)}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Discount</span>
                <span>-{formatINR(order.discountInPaise)}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Shipping</span>
                <span>{formatINR(order.shippingInPaise)}</span>
              </div>
              <div className="flex justify-between text-ink-soft">
                <span>Tax</span>
                <span>{formatINR(order.taxInPaise)}</span>
              </div>
              <div className="flex justify-between border-t border-line pt-2 font-semibold text-ink">
                <span>Total</span>
                <span>{formatINR(order.totalInPaise)}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 font-display text-lg text-ink">Status history</h2>
            {order.statusHistory.length === 0 ? (
              <p className="text-sm text-ink-soft">No status changes recorded yet.</p>
            ) : (
              <ol className="flex flex-col gap-4">
                {order.statusHistory.map((entry) => (
                  <li key={entry.id} className="flex gap-3">
                    <span className="mt-1 h-2 w-2 flex-none rounded-full bg-gold" aria-hidden />
                    <div>
                      <p className="text-sm font-semibold text-ink">{ORDER_STATUS_LABELS[entry.status]}</p>
                      <p className="text-xs text-ink-soft">{formatDateTime(entry.createdAt)}</p>
                      {entry.note && <p className="mt-1 text-sm text-ink-soft">{entry.note}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <h2 className="mb-4 font-display text-lg text-ink">Update status</h2>
            <OrderStatusControl order={order} />
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 font-display text-lg text-ink">Shipping address</h2>
            <p className="text-sm text-ink">{order.shipFullName}</p>
            <p className="text-sm text-ink-soft">{order.shipPhone}</p>
            <p className="mt-2 text-sm text-ink-soft">
              {order.shipLine1}
              {order.shipLine2 ? `, ${order.shipLine2}` : ""}
              <br />
              {order.shipCity}, {order.shipState} {order.shipPostalCode}
              <br />
              {order.shipCountry}
            </p>
            {/* The order API doesn't expose a separate billing address in
                its response — only the shipping snapshot above — so no
                billing section is shown rather than fabricating one. */}
          </Card>

          <Card className="p-6">
            <h2 className="mb-4 font-display text-lg text-ink">Payment</h2>
            <p className="text-sm text-ink-soft">
              Method: <span className="text-ink">{PAYMENT_METHOD_LABELS[order.paymentMethod]}</span>
            </p>
            <p className="text-sm text-ink-soft">
              Status: <span className="text-ink">{order.paymentStatus}</span>
            </p>
            {order.guestEmail && (
              <p className="text-sm text-ink-soft">
                Guest email: <span className="text-ink">{order.guestEmail}</span>
              </p>
            )}
            {order.notes && (
              <p className="mt-2 text-sm text-ink-soft">
                Notes: <span className="text-ink">{order.notes}</span>
              </p>
            )}
          </Card>
        </div>
      </div>

      <div className="mt-6">
        <Link to="/orders" className="text-sm font-semibold text-gold-dark hover:underline">
          &larr; Back to orders
        </Link>
      </div>
    </div>
  );
}
