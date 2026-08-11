import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Spinner, StarRating, useToast } from "@yrs/ui";
import { AGE_GROUP_LABELS, formatINR } from "@yrs/shared";
import { useProductDetail, useRelatedProducts, useProductReviews } from "../hooks/useProducts";
import { useAddCartItem } from "../hooks/useCart";
import { useAuth } from "../hooks/useAuth";
import { Gallery } from "../components/product/Gallery";
import { VariantPicker } from "../components/product/VariantPicker";
import { ReviewList } from "../components/product/ReviewList";
import { ReviewForm } from "../components/product/ReviewForm";
import { ProductGrid } from "../components/product/ProductGrid";
import { SectionHeading } from "../components/common/SectionHeading";
import { NotFoundPage } from "./NotFoundPage";

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, isError } = useProductDetail(slug);
  const { data: related } = useRelatedProducts(slug);
  const { data: reviewsPage } = useProductReviews(slug);
  const { isAuthenticated } = useAuth();
  const addCartItem = useAddCartItem();
  const { showToast } = useToast();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Spinner size={28} />
      </div>
    );
  }

  if (isError || !product) {
    return <NotFoundPage />;
  }

  const selectedVariant = product.variants.find((v) => v.id === selectedVariantId) ?? null;
  const effectivePrice = selectedVariant?.priceOverrideInPaise ?? product.priceInPaise;
  const effectiveStock = selectedVariant?.stockOverride ?? product.stock;
  const isOutOfStock = effectiveStock <= 0;
  const requiresVariant = product.variants.length > 0 && !selectedVariantId;

  function handleAddToCart() {
    if (!product) return;
    addCartItem.mutate(
      { productId: product.id, variantId: selectedVariant?.id, quantity },
      {
        onSuccess: () => showToast(`${product.name} added to cart`),
        onError: (error) => showToast(error instanceof Error ? error.message : "Couldn't add that to your cart"),
      },
    );
  }

  return (
    <div className="mx-auto max-w-[1240px] px-5 py-10 sm:px-8">
      <div className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <Gallery images={product.images} productName={product.name} />

        <div className="flex flex-col">
          <div className="mb-2 flex items-center gap-2">
            <Badge tone="sage">{AGE_GROUP_LABELS[product.ageGroup]}</Badge>
            {product.compareAtPriceInPaise && product.compareAtPriceInPaise > product.priceInPaise && (
              <Badge tone="coral">Sale</Badge>
            )}
          </div>
          <h1 className="font-display text-[28px]">{product.name}</h1>
          <StarRating value={product.avgRating} count={product.reviewCount} className="mt-2" />

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-semibold text-gold-dark">{formatINR(effectivePrice)}</span>
            {product.compareAtPriceInPaise && product.compareAtPriceInPaise > effectivePrice && (
              <span className="text-base text-ink-soft line-through">{formatINR(product.compareAtPriceInPaise)}</span>
            )}
          </div>

          <p className="mt-5 text-sm leading-relaxed text-ink-soft">{product.description}</p>

          {(product.material || product.safetyInfo) && (
            <dl className="mt-5 flex flex-col gap-1.5 text-sm">
              {product.material && (
                <div className="flex gap-2">
                  <dt className="font-semibold text-ink">Material:</dt>
                  <dd className="text-ink-soft">{product.material}</dd>
                </div>
              )}
              {product.safetyInfo && (
                <div className="flex gap-2">
                  <dt className="font-semibold text-ink">Safety:</dt>
                  <dd className="text-ink-soft">{product.safetyInfo}</dd>
                </div>
              )}
            </dl>
          )}

          {product.variants.length > 0 && (
            <div className="mt-6">
              <VariantPicker variants={product.variants} selectedVariantId={selectedVariantId} onChange={setSelectedVariantId} />
            </div>
          )}

          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Decrease quantity"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-line hover:border-gold hover:text-gold-dark"
              >
                −
              </button>
              <span className="w-8 text-center text-sm font-semibold">{quantity}</span>
              <button
                type="button"
                aria-label="Increase quantity"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-md border border-line hover:border-gold hover:text-gold-dark"
              >
                +
              </button>
            </div>
            <Button
              onClick={handleAddToCart}
              isLoading={addCartItem.isPending}
              disabled={isOutOfStock || requiresVariant}
              className="flex-1"
            >
              {isOutOfStock ? "Out of stock" : requiresVariant ? "Select an option" : "Add to cart"}
            </Button>
          </div>
          {!isOutOfStock && effectiveStock <= 5 && (
            <span className="mt-2 text-xs font-semibold text-terracotta">Only {effectiveStock} left in stock</span>
          )}
        </div>
      </div>

      <section className="mt-16 border-t border-line pt-10">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-xl">Customer Reviews</h2>
          {isAuthenticated ? (
            <ReviewForm slug={product.slug} />
          ) : (
            <Link to="/login" className="text-xs font-semibold uppercase tracking-wide text-gold-dark hover:underline">
              Sign in to write a review
            </Link>
          )}
        </div>
        <ReviewList reviews={reviewsPage?.items ?? []} />
      </section>

      {related && related.length > 0 && (
        <section className="mt-16 border-t border-line pt-10">
          <SectionHeading title="You may also like" />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
