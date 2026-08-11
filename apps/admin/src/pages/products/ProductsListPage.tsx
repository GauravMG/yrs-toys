import { useState } from "react";
import { Link } from "react-router-dom";
import { Button, Input, Select, Badge, Spinner, cn } from "@yrs/ui";
import { formatINR } from "@yrs/shared";
import { useAdminProducts } from "../../hooks/useProducts";
import { useCategories } from "../../hooks/useCategories";
import { flattenCategories } from "../../lib/flatten-categories";
import { PageHeader } from "../../components/ui/PageHeader";
import { ErrorBanner } from "../../components/ui/ErrorBanner";
import { EmptyState } from "../../components/ui/EmptyState";
import { Pagination } from "../../components/ui/Pagination";

type ActiveFilter = "all" | "active" | "inactive";

export function ProductsListPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("");
  // The admin products list endpoint has no isActive query param — it
  // always returns both active and inactive products — so this filter is
  // applied client-side against the current page of results.
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [page, setPage] = useState(1);

  const { data: categories } = useCategories();
  const flatCategories = flattenCategories(categories ?? []);

  const { data, isLoading, isError, error } = useAdminProducts({
    q: search || undefined,
    page,
    limit: 20,
  });

  const filteredItems = (data?.items ?? []).filter((product) => {
    if (activeFilter === "active" && !product.isActive) return false;
    if (activeFilter === "inactive" && product.isActive) return false;
    if (categoryId && product.category.id !== categoryId) return false;
    return true;
  });

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage the catalogue."
        action={
          <Link to="/products/new">
            <Button type="button" variant="solid">
              New product
            </Button>
          </Link>
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Input
          placeholder="Search products&hellip;"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="max-w-xs"
        />
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="max-w-[220px]">
          <option value="">All categories</option>
          {flatCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {"  ".repeat(category.depth)}
              {category.name}
            </option>
          ))}
        </Select>
        <Select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value as ActiveFilter)} className="max-w-[160px]">
          <option value="all">All statuses</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </Select>
      </div>

      {isError && <ErrorBanner error={error} />}

      {isLoading && (
        <div className="flex justify-center py-16">
          <Spinner size={28} />
        </div>
      )}

      {data && filteredItems.length === 0 && (
        <EmptyState title="No products found" description="Try a different search or filter." />
      )}

      {data && filteredItems.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-line bg-panel">
          <table className="w-full text-sm">
            <thead className="bg-cream-dark text-left text-xs uppercase tracking-wider text-ink-soft">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredItems.map((product) => (
                <tr key={product.id} className="hover:bg-cream">
                  <td className="px-4 py-3">
                    <Link to={`/products/${product.id}/edit`} className="font-semibold text-ink hover:text-gold-dark">
                      {product.name}
                    </Link>
                    <p className="text-xs text-ink-soft">{product.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-ink-soft">{product.category.name}</td>
                  <td className="px-4 py-3 text-ink">{formatINR(product.priceInPaise)}</td>
                  <td className="px-4 py-3">
                    <span className={cn(product.stock === 0 && "font-semibold text-coral", product.stock > 0 && product.stock < 5 && "font-semibold text-terracotta")}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={product.isActive ? "sage" : "ink"}>{product.isActive ? "Active" : "Inactive"}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data && <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />}
        </div>
      )}
    </div>
  );
}
