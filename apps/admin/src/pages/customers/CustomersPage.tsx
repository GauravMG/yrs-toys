import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input, Spinner } from "@yrs/ui";
import { formatDate, formatINR } from "@yrs/shared";
import { useCustomers } from "../../hooks/useCustomers";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { EmptyState } from "../../components/ui/EmptyState";

export function CustomersPage() {
  const [search, setSearch] = useState("");
  const { customers, isLoading, isError, error, ordersConsidered, totalOrders, hasMore, loadMore, isFetching } = useCustomers();

  const filtered = customers.filter((c) => {
    const term = search.trim().toLowerCase();
    if (!term) return true;
    return c.fullName.toLowerCase().includes(term) || c.phone.includes(term) || (c.email ?? "").toLowerCase().includes(term);
  });

  return (
    <div>
      <PageHeader title="Customers" description="A directory derived from order history." />

      <div className="mb-4 rounded-md border border-line bg-cream-dark/60 px-4 py-3 text-xs text-ink-soft">
        There is no dedicated customer directory in the API yet, so this list is derived from order shipping details
        (grouped by phone number). Registered customers&apos; account emails aren&apos;t available here — only guest
        checkout emails are shown. Considering the {ordersConsidered} most recent order{ordersConsidered === 1 ? "" : "s"}
        {totalOrders > ordersConsidered ? ` of ${totalOrders} total` : ""}.
      </div>

      <Input
        placeholder="Search by name, phone, or email&hellip;"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-xs"
      />

      {isError && <ErrorBanner error={error} />}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      )}

      {!isLoading && filtered.length === 0 && <EmptyState title="No customers found" description="Try a different search." />}

      {filtered.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <table className="w-full text-sm">
            <thead className="bg-cream-dark text-left text-xs uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Orders</th>
                <th className="px-4 py-3">Total spent</th>
                <th className="px-4 py-3">Last order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filtered.map((customer) => (
                <tr key={customer.phone} className="hover:bg-cream">
                  <td className="px-4 py-3 font-semibold text-ink">{customer.fullName}</td>
                  <td className="px-4 py-3 text-ink-soft">{customer.phone}</td>
                  <td className="px-4 py-3 text-ink-soft">{customer.email ?? "—"}</td>
                  <td className="px-4 py-3 text-ink-soft">
                    {customer.orderCount}{" "}
                    {customer.orders[0] && (
                      <Link to={`/orders/${customer.orders[0].id}`} className="ml-1 text-xs text-gold-dark hover:underline">
                        view latest
                      </Link>
                    )}
                  </td>
                  <td className="px-4 py-3 text-ink">{formatINR(customer.totalSpentInPaise)}</td>
                  <td className="px-4 py-3 text-ink-soft">{formatDate(customer.lastOrderAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {hasMore && (
            <div className="border-t border-line px-4 py-3">
              <Button type="button" variant="outline" size="sm" isLoading={isFetching} onClick={loadMore}>
                Load more orders
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
