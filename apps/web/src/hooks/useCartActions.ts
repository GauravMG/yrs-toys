import { useRemoveCartItem, useUpdateCartItem } from "./useCart";

/** Shared quantity-change/remove wiring used by both the cart drawer and the
 * full `/cart` page so their behavior (including the "drop to zero removes
 * the line" rule) can't drift apart. */
export function useCartActions() {
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();

  function onQuantityChange(itemId: string, quantity: number) {
    if (quantity < 1) {
      removeItem.mutate(itemId);
      return;
    }
    updateItem.mutate({ itemId, quantity });
  }

  function onRemove(itemId: string) {
    removeItem.mutate(itemId);
  }

  return {
    onQuantityChange,
    onRemove,
    isPending: updateItem.isPending || removeItem.isPending,
  };
}
