/** A variant's price override wins over the base product price when present. Shared by cart totals and the checkout transaction so they never disagree. */
export function resolveUnitPrice(product: { priceInPaise: number }, variant?: { priceOverrideInPaise: number | null } | null): number {
  return variant?.priceOverrideInPaise ?? product.priceInPaise;
}

/** A variant's stock override wins over the base product stock when present. */
export function resolveAvailableStock(product: { stock: number }, variant?: { stockOverride: number | null } | null): number {
  return variant?.stockOverride ?? product.stock;
}

const FREE_SHIPPING_THRESHOLD_PAISE = 99_900; // matches the storefront's "Free shipping above ₹999" banner
const FLAT_SHIPPING_FEE_PAISE = 4_900;

export function calculateShipping(subtotalInPaise: number): number {
  return subtotalInPaise >= FREE_SHIPPING_THRESHOLD_PAISE ? 0 : FLAT_SHIPPING_FEE_PAISE;
}
