import { formatINR } from "@yrs/shared";
import { emailLayout } from "./layout.js";

export interface OrderConfirmationEmailItem {
  name: string;
  quantity: number;
  lineTotalInPaise: number;
}

export function orderConfirmationEmail(params: {
  fullName: string;
  orderNumber: string;
  items: OrderConfirmationEmailItem[];
  subtotalInPaise: number;
  discountInPaise: number;
  shippingInPaise: number;
  totalInPaise: number;
  shipLine1: string;
  shipCity: string;
  shipState: string;
  shipPostalCode: string;
}): { subject: string; html: string } {
  const rows = params.items
    .map(
      (i) => `
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #E7DFCC;">${i.name} &times; ${i.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #E7DFCC;text-align:right;">${formatINR(i.lineTotalInPaise)}</td>
      </tr>`,
    )
    .join("");

  const html = emailLayout(`
    <p>Hi ${params.fullName},</p>
    <p>Thank you for shopping with YRS Toys! Your order has been placed and is now being reviewed.</p>
    <p style="font-size:16px;font-weight:bold;">Order ${params.orderNumber}</p>
    <table style="width:100%;border-collapse:collapse;font-family:Helvetica,Arial,sans-serif;font-size:13.5px;margin-top:8px;">
      ${rows}
      <tr><td style="padding:8px 0;">Subtotal</td><td style="padding:8px 0;text-align:right;">${formatINR(params.subtotalInPaise)}</td></tr>
      ${params.discountInPaise > 0 ? `<tr><td style="padding:8px 0;color:#8FA073;">Discount</td><td style="padding:8px 0;text-align:right;color:#8FA073;">&minus;${formatINR(params.discountInPaise)}</td></tr>` : ""}
      <tr><td style="padding:8px 0;">Shipping</td><td style="padding:8px 0;text-align:right;">${params.shippingInPaise > 0 ? formatINR(params.shippingInPaise) : "Free"}</td></tr>
      <tr><td style="padding:12px 0 0;font-weight:bold;font-size:15px;">Total</td><td style="padding:12px 0 0;text-align:right;font-weight:bold;font-size:15px;">${formatINR(params.totalInPaise)}</td></tr>
    </table>
    <p style="margin-top:24px;font-family:Helvetica,Arial,sans-serif;font-size:13.5px;">
      <strong>Shipping to:</strong><br>
      ${params.shipLine1}, ${params.shipCity}, ${params.shipState} ${params.shipPostalCode}
    </p>
    <p style="font-family:Helvetica,Arial,sans-serif;font-size:13.5px;color:#5C574C;">Payment method: Cash on Delivery. Pay when your order arrives.</p>
  `);

  return { subject: `Order confirmed — ${params.orderNumber}`, html };
}
