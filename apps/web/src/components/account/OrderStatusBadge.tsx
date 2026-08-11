import { Badge } from "@yrs/ui";
import type { BadgeTone } from "@yrs/ui";
import { ORDER_STATUS_LABELS } from "@yrs/shared";
import type { OrderStatusValue } from "@yrs/shared";

const STATUS_TONES: Record<OrderStatusValue, BadgeTone> = {
  PENDING: "gold",
  CONFIRMED: "gold",
  PROCESSING: "teal",
  SHIPPED: "sage",
  DELIVERED: "sage",
  CANCELLED: "terracotta",
  REFUNDED: "terracotta",
};

export function OrderStatusBadge({ status }: { status: OrderStatusValue }) {
  return <Badge tone={STATUS_TONES[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
