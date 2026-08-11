import { useState } from "react";
import { Button, Select, Textarea, useToast } from "@yrs/ui";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TRANSITIONS } from "@yrs/shared";
import type { Order } from "@yrs/shared";
import { useUpdateOrderStatus } from "../../hooks/useOrders";
import { ApiError } from "../../lib/api-client";
import { ErrorBanner } from "../../components/ui/ErrorBanner";

/**
 * Only ever offers statuses reachable from the order's current status per
 * ORDER_STATUS_TRANSITIONS (the same graph the API enforces server-side) —
 * e.g. from SHIPPED the only option is DELIVERED, and CANCELLED/REFUNDED
 * are terminal (no further transitions offered at all).
 */
export function OrderStatusControl({ order }: { order: Order }) {
  const nextStatuses = ORDER_STATUS_TRANSITIONS[order.status];
  const [nextStatus, setNextStatus] = useState(nextStatuses[0] ?? "");
  const [note, setNote] = useState("");
  const { showToast } = useToast();
  const updateStatus = useUpdateOrderStatus(order.id);

  if (nextStatuses.length === 0) {
    return <p className="text-sm text-ink-soft">No further status changes are available for a {ORDER_STATUS_LABELS[order.status].toLowerCase()} order.</p>;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!nextStatus) return;
    updateStatus.mutate(
      { status: nextStatus as Order["status"], note: note || undefined },
      {
        onSuccess: () => {
          showToast(`Order marked ${ORDER_STATUS_LABELS[nextStatus as Order["status"]]}.`);
          setNote("");
        },
        onError: (err) => showToast(err instanceof ApiError ? err.message : "Failed to update order status."),
      },
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3" aria-label="Change order status">
      <Select id="order-next-status" label="Change status to" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
        {nextStatuses.map((status) => (
          <option key={status} value={status}>
            {ORDER_STATUS_LABELS[status]}
          </option>
        ))}
      </Select>
      <Textarea id="order-status-note" label="Note (optional)" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      {updateStatus.isError ? <ErrorBanner error={updateStatus.error} /> : null}
      <Button type="submit" variant="solid" size="sm" className="self-start" isLoading={updateStatus.isPending}>
        Update status
      </Button>
    </form>
  );
}
