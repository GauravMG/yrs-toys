import type { OrderSummary } from "@yrs/shared";

/**
 * There is no dedicated "list customers" admin endpoint in apps/api (only
 * `/admin/orders`, which embeds a shipping snapshot but no `userId` or
 * account email — see apps/api/src/modules/orders routes/repository). The
 * /customers page derives a best-effort customer directory from order
 * history instead of inventing an endpoint that doesn't exist.
 *
 * Grouping key is the shipping phone number (`shipPhone`) — the only
 * consistently-present identifier for both guest and registered-user
 * orders. This means: (a) a customer who used two different phone numbers
 * across orders will show up as two rows, and (b) a registered customer's
 * account email is never shown (only `guestEmail`, set for guest checkouts,
 * is available) — both are called out in the UI, not silently hidden.
 */
export interface DerivedCustomer {
  phone: string;
  fullName: string;
  email: string | null;
  orderCount: number;
  totalSpentInPaise: number;
  lastOrderAt: string;
  orders: OrderSummary[];
}

export function deriveCustomers(orders: OrderSummary[]): DerivedCustomer[] {
  const byPhone = new Map<string, DerivedCustomer>();

  for (const order of orders) {
    const existing = byPhone.get(order.shipPhone);
    if (existing) {
      existing.orderCount += 1;
      existing.totalSpentInPaise += order.totalInPaise;
      existing.orders.push(order);
      if (order.guestEmail && !existing.email) existing.email = order.guestEmail;
      if (new Date(order.createdAt) > new Date(existing.lastOrderAt)) {
        existing.lastOrderAt = order.createdAt;
        existing.fullName = order.shipFullName;
      }
    } else {
      byPhone.set(order.shipPhone, {
        phone: order.shipPhone,
        fullName: order.shipFullName,
        email: order.guestEmail,
        orderCount: 1,
        totalSpentInPaise: order.totalInPaise,
        lastOrderAt: order.createdAt,
        orders: [order],
      });
    }
  }

  return Array.from(byPhone.values()).sort(
    (a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime(),
  );
}
