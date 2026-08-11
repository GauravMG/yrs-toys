import { useEffect } from "react";
import { Spinner } from "@yrs/ui";
import { toPaise } from "@yrs/shared";
import { useProductList } from "../hooks/useProducts";
import { useCategories } from "../hooks/useCategories";
import { useShopFilters } from "../hooks/useShopFilters";
import { CategorySidebar } from "../components/shop/CategorySidebar";
import { AgeFilter } from "../components/shop/AgeFilter";
import { PriceRangeFilter } from "../components/shop/PriceRangeFilter";
import { SortDropdown } from "../components/shop/SortDropdown";
import { ProductGrid } from "../components/product/ProductGrid";
import { Pagination } from "../components/common/Pagination";

export function ShopPage() {
  const { filters, updateFilters, setPage } = useShopFilters();
  const { data: categories } = useCategories();
  const { data, isLoading, isFetching } = useProductList({
    ...filters,
    minPrice: filters.minPrice !== undefined ? toPaise(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice !== undefined ? toPaise(filters.maxPrice) : undefined,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [filters.page]);

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8">
      <h1 className="mb-8 text-[28px]">Shop All Toys</h1>
      <div className="grid grid-cols-1 gap-8 md:grid-cols-[220px_1fr]">
        <aside className="flex flex-col gap-8">
          <CategorySidebar
            categories={categories ?? []}
            activeSlug={filters.categorySlug}
            onSelect={(categorySlug) => updateFilters({ categorySlug })}
          />
          <AgeFilter value={filters.ageGroup} onChange={(ageGroup) => updateFilters({ ageGroup })} />
          <PriceRangeFilter
            minPrice={filters.minPrice}
            maxPrice={filters.maxPrice}
            onApply={(minPrice, maxPrice) => updateFilters({ minPrice, maxPrice })}
          />
        </aside>

        <div>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-ink-soft">{data ? `${data.total} products` : " "}</span>
            <SortDropdown value={filters.sort} onChange={(sort) => updateFilters({ sort }, { resetPage: true })} />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-20">
              <Spinner />
            </div>
          ) : (
            <div className={isFetching ? "opacity-60 transition-opacity" : "transition-opacity"}>
              <ProductGrid products={data?.items ?? []} />
            </div>
          )}

          {data && <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />}
        </div>
      </div>
    </div>
  );
}
