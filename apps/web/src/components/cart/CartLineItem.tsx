import { Link } from "react-router-dom";
import { formatINR } from "@yrs/shared";
import type { CartItem } from "@yrs/shared";
import { ProductImagePlaceholder } from "../common/ProductImagePlaceholder";

export interface CartLineItemProps {
  item: CartItem;
  onQuantityChange: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
  disabled?: boolean;
}

export function CartLineItem({ item, onQuantityChange, onRemove, disabled }: CartLineItemProps) {
  const image = item.product.primaryImage;

  return (
    <div className="flex items-center gap-3.5 border-b border-line py-3.5 last:border-b-0">
      <Link
        to={`/product/${item.product.slug}`}
        className="flex h-[60px] w-[60px] flex-none items-center justify-center overflow-hidden rounded-md bg-cream-dark"
      >
        {image ? (
          <img src={image.url} alt={image.altText ?? item.product.name} className="h-full w-full object-contain" />
        ) : (
          <ProductImagePlaceholder />
        )}
      </Link>
      <div className="min-w-0 flex-1">
        <Link to={`/product/${item.product.slug}`} className="block truncate text-sm font-semibold hover:text-gold-dark">
          {item.product.name}
        </Link>
        <span className="text-xs text-ink-soft">
          {item.variant ? `${item.variant.name}: ${item.variant.value} · ` : ""}
          {formatINR(item.unitPriceInPaise)} × {item.quantity}
        </span>
        <div className="mt-1.5 flex items-center gap-2">
          <button
            type="button"
            aria-label={`Decrease quantity of ${item.product.name}`}
            disabled={disabled}
            onClick={() => onQuantityChange(item.id, item.quantity - 1)}
            className="flex h-[22px] w-[22px] items-center justify-center rounded border border-line text-sm text-ink transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-40"
          >
            −
          </button>
          <span className="min-w-[1.5rem] text-center text-sm" data-testid={`qty-${item.id}`}>
            {item.quantity}
          </span>
          <button
            type="button"
            aria-label={`Increase quantity of ${item.product.name}`}
            disabled={disabled || item.quantity >= 20}
            onClick={() => onQuantityChange(item.id, item.quantity + 1)}
            className="flex h-[22px] w-[22px] items-center justify-center rounded border border-line text-sm text-ink transition-colors hover:border-gold hover:text-gold-dark disabled:opacity-40"
          >
            +
          </button>
        </div>
      </div>
      <div className="flex flex-none flex-col items-end gap-2">
        <span className="text-sm font-semibold">{formatINR(item.lineTotalInPaise)}</span>
        <button
          type="button"
          aria-label={`Remove ${item.product.name} from cart`}
          disabled={disabled}
          onClick={() => onRemove(item.id)}
          className="text-ink-soft transition-colors hover:text-terracotta disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M6 6l12 12M6 18L18 6" />
          </svg>
        </button>
      </div>
    </div>
  );
}
