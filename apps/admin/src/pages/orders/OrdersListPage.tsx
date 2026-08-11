import { useState } from "react";
import { Link } from "react-router-dom";
import { Input, Select, Spinner } from "@yrs/ui";
import { formatINR, formatDateTime, ORDER_STATUS_LABELS, OrderStatusEnum } from "@yrs/shared";
import type { OrderStatusValue } from "@yrs/shared";
import { useAdminOrders } from "../../hooks/useOrders";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { EmptyState } from "../../components/ui/EmptyState";
import { Pagination } from "../../components/ui/Pagination";
import { OrderStatusBadge } from "../../components/ui/OrderStatusBadge";

const ALL_STATUSES = OrderStatusEnum.options;

export function OrdersListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<OrderStatusValue | "">("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, error } = useAdminOrders({
    q: search || undefined,
    status: status || undefined,
    from: from ? new Date(from).toISOString() : undefined,
    to: to ? new Date(to).toISOString() : undefined,
    page,
    limit: 20,
  });

  return (
    <div>
      <PageHeader title="Orders" description="Search, filter, and manage order fulfilment." />

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search order # or email&hellip;"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as OrderStatusValue | "");
            setPage(1);
          }}
          className="max-w-[180px]"
        >
          <option value="">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        <Input
          type="date"
          value={from}
          onChange={(e) => {
            setFrom(e.target.value);
            setPage(1);
          }}
        />
        <Input
          type="date"
          value={to}
          onChange={(e) => {
            setTo(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {isError && <ErrorBanner error={error} />}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      )}

      {data && data.items.length === 0 && <EmptyState title="No orders found" description="Try a different search or filter." />}

      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <table className="w-full text-sm">
            <thead className="bg-cream-dark text-left text-xs uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Placed</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.items.map((order) => (
                <tr key={order.id} className="hover:bg-cream">
                  <td className="px-4 py-3">
                    <Link to={`/orders/${order.id}`} className="font-semibold text-ink hover:text-gold-dark">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">
                    {order.shipFullName}
                    <p className="text-xs">{order.shipPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3 text-ink">{formatINR(order.totalInPaise)}</td>
                  <td className="px-4 py-3">
                    <OrderStatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}
