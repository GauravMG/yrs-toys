import { Link } from "react-router-dom";
import { Spinner, StarRating, useToast } from "@yrs/ui";
import { formatINR } from "@yrs/shared";
import { useAddCartItem } from "../../hooks/useCart";
import { useRemoveFromWishlist, useWishlist } from "../../hooks/useWishlist";
import { ProductImagePlaceholder } from "../../components/common/ProductImagePlaceholder";

export function WishlistPage() {
  const { data: wishlist, isLoading } = useWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const addCartItem = useAddCartItem();
  const { showToast } = useToast();

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!wishlist || wishlist.length === 0) {
    return (
      <p className="rounded-lg border border-line bg-panel p-8 text-center text-sm text-ink-soft">
        Your wishlist is empty.{" "}
        <Link to="/shop" className="font-semibold text-gold-dark hover:underline">
          Browse products
        </Link>
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {wishlist.map((item) => (
        <div key={item.id} className="flex gap-4 rounded-lg border border-line bg-panel p-4">
          <Link
            to={`/product/${item.product.slug}`}
            className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-md bg-cream-dark"
          >
            {item.product.primaryImage ? (
              <img src={item.product.primaryImage.url} alt={item.product.name} className="h-full w-full object-contain" />
            ) : (
              <ProductImagePlaceholder />
            )}
          </Link>
          <div className="flex min-w-0 flex-1 flex-col">
            <Link to={`/product/${item.product.slug}`} className="truncate text-sm font-semibold hover:text-gold-dark">
              {item.product.name}
            </Link>
            <StarRating value={item.product.avgRating} count={item.product.reviewCount} size={12} className="mt-1" />
            <span className="mt-1 text-sm font-semibold">{formatINR(item.product.priceInPaise)}</span>
            <div className="mt-auto flex gap-3 pt-2 text-xs font-semibold uppercase tracking-wide">
              <button
                type="button"
                onClick={() =>
                  addCartItem.mutate(
                    { productId: item.product.id, quantity: 1 },
                    { onSuccess: () => showToast(`${item.product.name} added to cart`) },
                  )
                }
                disabled={item.product.stock <= 0}
                className="text-gold-dark hover:underline disabled:cursor-not-allowed disabled:opacity-40"
              >
                Add to cart
              </button>
              <button
                type="button"
                onClick={() => removeFromWishlist.mutate(item.product.id)}
                className="text-ink-soft hover:text-terracotta"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
