import type { Paginated, OrderSummary, Order, AdminOrderListQuery, AdminUpdateOrderStatusInput } from "@yrs/shared";
import { apiFetch } from "../api-client";
import { toQueryString } from "../query-string";

export type AdminOrderFilters = Partial<AdminOrderListQuery>;

export function listAdminOrders(query: AdminOrderFilters = {}): Promise<Paginated<OrderSummary>> {
  return apiFetch<Paginated<OrderSummary>>(`/admin/orders${toQueryString(query)}`);
}

export function getAdminOrder(id: string): Promise<Order> {
  return apiFetch<Order>(`/admin/orders/${id}`);
}

export function updateOrderStatus(id: string, input: AdminUpdateOrderStatusInput): Promise<Order> {
  return apiFetch<Order>(`/admin/orders/${id}/status`, { method: "PATCH", body: input });
}
