import { ORDER_STATUS_LABELS, type OrderStatusValue } from "@yrs/shared";
import { emailLayout } from "./layout.js";

export function orderStatusUpdateEmail(params: {
  fullName: string;
  orderNumber: string;
  status: OrderStatusValue;
  note?: string;
}): { subject: string; html: string } {
  const label = ORDER_STATUS_LABELS[params.status];
  const html = emailLayout(`
    <p>Hi ${params.fullName},</p>
    <p>Your order <strong>${params.orderNumber}</strong> has been updated to:</p>
    <p style="font-size:18px;font-weight:bold;color:#A2712F;">${label}</p>
    ${params.note ? `<p style="color:#5C574C;font-size:13.5px;">${params.note}</p>` : ""}
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:13.5px;color:#5C574C;">You can track this order any time from your YRS Toys account.</p>
  `);
  return { subject: `Order ${params.orderNumber} — ${label}`, html };
}
