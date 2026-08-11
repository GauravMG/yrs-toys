import { Link } from "react-router-dom";
import { Card, Spinner, Badge } from "@yrs/ui";
import { formatINR } from "@yrs/shared";
import { useDashboardStats } from "../hooks/useDashboardStats";
import { PageHeader } from "../components/ui/PageHeader";
import { ErrorBanner } from "../components/ui/ErrorBanner";
import { EmptyState } from "../components/ui/EmptyState";

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">{label}</p>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
    </Card>
  );
}

export function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboardStats();

  return (
    <div>
      <PageHeader title="Dashboard" description="Today's snapshot of the store." />

      {isError && <ErrorBanner error={error} />}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Today's orders" value={String(data.todayOrderCount)} />
            <StatCard label="Today's paid revenue" value={formatINR(data.todayRevenueInPaise)} />
            <StatCard label="Pending reviews" value={String(data.pendingReviewCount)} />
          </div>

          <Card className="mt-6">
            <div className="border-b border-line px-5 py-4">
              <h2 className="font-display text-lg text-ink">Low stock</h2>
              <p className="text-xs text-ink-soft">Active products with fewer than 5 units left.</p>
            </div>
            {data.lowStockProducts.length === 0 ? (
              <div className="px-5 py-8">
                <EmptyState title="Nothing low on stock" description="All active products are healthily stocked." />
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {data.lowStockProducts.map((product) => (
                  <li key={product.id} className="flex items-center justify-between px-5 py-3">
                    <Link to={`/products/${product.id}/edit`} className="text-sm font-semibold text-ink hover:text-gold-dark">
                      {product.name}
                    </Link>
                    <Badge tone={product.stock === 0 ? "coral" : "terracotta"}>
                      {product.stock === 0 ? "Out of stock" : `${product.stock} left`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
