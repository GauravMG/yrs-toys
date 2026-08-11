import type { OrderStatusValue } from "../enums.js";

/**
 * The only valid admin-driven order status transitions. Used by the API to
 * reject invalid `PATCH /admin/orders/:id/status` requests, and by the admin
 * UI to grey out buttons for statuses that can't be selected next — both
 * read from this single graph so they can never drift apart.
 */
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatusValue, OrderStatusValue[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

export function isValidOrderStatusTransition(from: OrderStatusValue, to: OrderStatusValue): boolean {
  if (from === to) return false;
  return ORDER_STATUS_TRANSITIONS[from].includes(to);
}

/** Statuses a customer (not admin) is allowed to self-cancel from. */
export const CUSTOMER_CANCELLABLE_STATUSES: OrderStatusValue[] = ["PENDING", "CONFIRMED"];

export function isCustomerCancellable(status: OrderStatusValue): boolean {
  return CUSTOMER_CANCELLABLE_STATUSES.includes(status);
}
