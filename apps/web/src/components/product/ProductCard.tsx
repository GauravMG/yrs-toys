import { useState } from "react";
import { Link } from "react-router-dom";
import { Badge, Card, StarRating, useToast } from "@yrs/ui";
import { formatINR } from "@yrs/shared";
import type { ProductSummary } from "@yrs/shared";
import { useAddCartItem } from "../../hooks/useCart";
import { ProductImagePlaceholder } from "../common/ProductImagePlaceholder";
import { QuickViewModal } from "./QuickViewModal";

export interface ProductCardProps {
  product: ProductSummary;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isQuickViewOpen, setQuickViewOpen] = useState(false);
  const addCartItem = useAddCartItem();
  const { showToast } = useToast();

  const isOnSale = product.compareAtPriceInPaise !== null && product.compareAtPriceInPaise > product.priceInPaise;
  const isOutOfStock = product.stock <= 0;

  function handleAddToCart() {
    if (isOutOfStock) return;
    addCartItem.mutate(
      { productId: product.id, quantity: 1 },
      {
        onSuccess: () => showToast(`${product.name} added to cart`),
        onError: () => showToast("Couldn't add that to your cart — please try again"),
      },
    );
  }

  return (
    <>
      <Card hoverable className="group">
        <div className="relative aspect-square overflow-hidden bg-cream-dark">
          {isOnSale && (
            <Badge tone="coral" className="absolute left-3 top-3 z-10">
              Sale
            </Badge>
          )}
          <button
            type="button"
            onClick={() => setQuickViewOpen(true)}
            aria-label={`Quick view ${product.name}`}
            className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-panel/90 text-ink shadow-card transition-colors hover:bg-gold hover:text-white"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
          <Link
            to={`/product/${product.slug}`}
            className="flex h-full w-full items-center justify-center p-6 transition-transform duration-500 ease-out group-hover:scale-110"
          >
            {product.primaryImage ? (
              <img
                src={product.primaryImage.url}
                alt={product.primaryImage.altText ?? product.name}
                className="h-full w-full object-contain"
              />
            ) : (
              <ProductImagePlaceholder />
            )}
          </Link>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <Link to={`/product/${product.slug}`} className="text-[15.5px] font-medium leading-snug hover:text-gold-dark">
            {product.name}
          </Link>
          <StarRating value={product.avgRating} count={product.reviewCount} size={13} />
          <div className="mt-auto flex items-center justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-base font-semibold">{formatINR(product.priceInPaise)}</span>
              {isOnSale && product.compareAtPriceInPaise && (
                <span className="text-xs text-ink-soft line-through">{formatINR(product.compareAtPriceInPaise)}</span>
              )}
            </div>
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock || addCartItem.isPending}
              aria-label={`Add ${product.name} to cart`}
              className="flex h-9 w-9 flex-none items-center justify-center rounded-md border border-gold text-gold-dark transition-colors hover:bg-gold hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}>
                <circle cx="9" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2 3h2l2.6 12.4a2 2 0 0 0 2 1.6h8.8a2 2 0 0 0 2-1.6L21 7H6" />
              </svg>
            </button>
          </div>
          {isOutOfStock && (
            <span className="text-xs font-semibold uppercase tracking-wide text-terracotta">Out of stock</span>
          )}
        </div>
      </Card>

      <QuickViewModal slug={product.slug} open={isQuickViewOpen} onOpenChange={setQuickViewOpen} />
    </>
  );
}
