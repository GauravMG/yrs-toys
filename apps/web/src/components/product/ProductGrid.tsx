import type { ProductSummary } from "@yrs/shared";
import { ProductCard } from "./ProductCard";

export function ProductGrid({ products }: { products: ProductSummary[] }) {
  if (products.length === 0) {
    return (
      <div className="py-16 text-center text-sm text-ink-soft">
        No products found — try a different filter or check back soon.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
