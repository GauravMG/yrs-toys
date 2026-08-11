import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AddCartItemInput, Cart } from "@yrs/shared";
import { apiClient } from "../lib/api-client";
import { queryKeys } from "../lib/query-client";

export function useCart() {
  return useQuery({
    queryKey: queryKeys.cart.root,
    queryFn: () => apiClient.get<Cart>("/cart"),
    staleTime: 10_000,
  });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AddCartItemInput) => apiClient.post<Cart>("/cart/items", input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.cart.root });
      const previous = queryClient.getQueryData<Cart>(queryKeys.cart.root);
      if (previous) {
        // Optimistically bump the header cart badge before the network
        // round-trip resolves; reconciled with the real totals on success,
        // rolled back on failure.
        queryClient.setQueryData<Cart>(queryKeys.cart.root, {
          ...previous,
          itemCount: previous.itemCount + input.quantity,
        });
      }
      return { previous };
    },
    onError: (_err, _input, context) => {
      if (context?.previous) queryClient.setQueryData(queryKeys.cart.root, context.previous);
    },
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.root, cart);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, quantity }: { itemId: string; quantity: number }) =>
      apiClient.patch<Cart>(`/cart/items/${itemId}`, { quantity }),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.root, cart);
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => apiClient.delete<Cart>(`/cart/items/${itemId}`),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.root, cart);
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete<Cart>("/cart"),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.root, cart);
    },
  });
}

export function useApplyCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => apiClient.post<Cart>("/cart/apply-coupon", { code }),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.root, cart);
    },
  });
}

export function useRemoveCoupon() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.delete<Cart>("/cart/coupon"),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart.root, cart);
    },
  });
}
