import { Link } from "react-router-dom";
import { Button, Modal, ModalClose, ModalTitle, Spinner, StarRating, useToast } from "@yrs/ui";
import { formatINR } from "@yrs/shared";
import { useProductDetail } from "../../hooks/useProducts";
import { useAddCartItem } from "../../hooks/useCart";
import { ProductImagePlaceholder } from "../common/ProductImagePlaceholder";

export interface QuickViewModalProps {
  slug: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickViewModal({ slug, open, onOpenChange }: QuickViewModalProps) {
  const { data: product, isLoading } = useProductDetail(slug, { enabled: open });
  const addCartItem = useAddCartItem();
  const { showToast } = useToast();

  function handleAddToCart() {
    if (!product) return;
    addCartItem.mutate(
      { productId: product.id, quantity: 1 },
      {
        onSuccess: () => {
          showToast(`${product.name} added to cart`);
          onOpenChange(false);
        },
        onError: () => showToast("Couldn't add that to your cart — please try again"),
      },
    );
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} ariaLabel={product ? product.name : "Quick view"}>
      <ModalClose />
      {isLoading || !product ? (
        <div className="flex h-80 items-center justify-center">
          <Spinner size={28} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2">
          <div className="flex items-center justify-center bg-cream-dark p-8">
            {product.primaryImage ? (
              <img
                src={product.primaryImage.url}
                alt={product.primaryImage.altText ?? product.name}
                className="h-full max-h-64 w-full object-contain"
              />
            ) : (
              <ProductImagePlaceholder className="max-h-64" />
            )}
          </div>
          <div className="flex flex-col p-8">
            <ModalTitle className="font-display text-xl text-ink">{product.name}</ModalTitle>
            <div className="mt-2 text-lg font-semibold text-gold-dark">{formatINR(product.priceInPaise)}</div>
            <StarRating value={product.avgRating} count={product.reviewCount} className="mt-3" />
            <p className="mt-4 flex-1 text-sm leading-relaxed text-ink-soft">{product.shortDescription}</p>
            <div className="mt-6 flex flex-col gap-3">
              <Button onClick={handleAddToCart} isLoading={addCartItem.isPending} disabled={product.stock <= 0}>
                {product.stock <= 0 ? "Out of stock" : "Add to cart"}
              </Button>
              <Link
                to={`/product/${product.slug}`}
                onClick={() => onOpenChange(false)}
                className="text-center text-xs font-semibold uppercase tracking-wide text-ink-soft hover:text-gold-dark"
              >
                View full details
              </Link>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
