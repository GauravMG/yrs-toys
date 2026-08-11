import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AdminUpdateOrderStatusInput } from "@yrs/shared";
import * as ordersApi from "../lib/api/orders";
import type { AdminOrderFilters } from "../lib/api/orders";
import { queryKeys } from "../lib/query-keys";

export function useAdminOrders(query: AdminOrderFilters) {
  return useQuery({
    queryKey: queryKeys.orders(query),
    queryFn: () => ordersApi.listAdminOrders(query),
    placeholderData: (prev) => prev,
  });
}

export function useAdminOrder(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.order(id ?? ""),
    queryFn: () => ordersApi.getAdminOrder(id as string),
    enabled: Boolean(id),
  });
}

export function useUpdateOrderStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdminUpdateOrderStatusInput) => ordersApi.updateOrderStatus(id, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.ordersAll });
      void queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboardStats });
    },
  });
}
