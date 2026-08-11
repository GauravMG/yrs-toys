import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { CheckoutInput, Order, OrderSummary, Paginated } from "@yrs/shared";
import { apiClient } from "../lib/api-client";
import { queryKeys } from "../lib/query-client";
import { cartTokenStore } from "../store/cart-token-store";
import { toQueryString } from "../lib/query-string";

export function useOrderList(page = 1, limit = 10) {
  return useQuery({
    queryKey: queryKeys.orders.list(page),
    queryFn: () => apiClient.get<Paginated<OrderSummary>>(`/orders${toQueryString({ page, limit })}`),
  });
}

export function useOrderDetail(orderNumber: string | undefined, guestEmail?: string) {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderNumber ?? ""),
    queryFn: () => apiClient.get<Order>(`/orders/${orderNumber}${toQueryString({ email: guestEmail })}`),
    enabled: Boolean(orderNumber),
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CheckoutInput) => apiClient.post<Order>("/orders", input),
    onSuccess: () => {
      // The API clears the cart server-side on successful checkout; drop the
      // now-stale guest token too and let the header re-fetch a fresh empty cart.
      cartTokenStore.clear();
      queryClient.invalidateQueries({ queryKey: queryKeys.cart.root });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderNumber, reason }: { orderNumber: string; reason?: string }) =>
      apiClient.post<Order>(`/orders/${orderNumber}/cancel`, { reason }),
    onSuccess: (order) => {
      queryClient.setQueryData(queryKeys.orders.detail(order.orderNumber), order);
      queryClient.invalidateQueries({ queryKey: ["orders", "list"] });
    },
  });
}
