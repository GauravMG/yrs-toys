import { useState } from "react";
import { Link } from "react-router-dom";
import { Spinner } from "@yrs/ui";
import { formatDate, formatINR } from "@yrs/shared";
import { useOrderList } from "../../hooks/useOrders";
import { OrderStatusBadge } from "../../components/account/OrderStatusBadge";
import { Pagination } from "../../components/common/Pagination";

export function OrdersPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useOrderList(page);

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <div className="rounded-lg border border-line bg-panel p-8 text-center text-sm text-ink-soft">
        You haven't placed any orders yet.{" "}
        <Link to="/shop" className="font-semibold text-gold-dark hover:underline">
          Start shopping
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col gap-3">
        {data.items.map((order) => (
          <Link
            key={order.id}
            to={`/account/orders/${order.orderNumber}`}
            className="flex flex-col gap-2 rounded-lg border border-line bg-panel p-4 transition-colors hover:border-gold sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-semibold">{order.orderNumber}</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <span className="mt-1 block text-xs text-ink-soft">
                {formatDate(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? "item" : "items"}
              </span>
            </div>
            <span className="text-base font-semibold">{formatINR(order.totalInPaise)}</span>
          </Link>
        ))}
      </div>
      <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
    </div>
  );
}
