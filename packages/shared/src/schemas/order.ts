import { z } from "zod";
import { OrderStatusEnum, PaymentStatusEnum, PaymentMethodEnum } from "../enums.js";
import { addressInputSchema } from "./address.js";
import { optionalString } from "./common.js";

export const checkoutAddressSchema = addressInputSchema.omit({ label: true, isDefault: true });
export type CheckoutAddress = z.infer<typeof checkoutAddressSchema>;

export const checkoutInputSchema = z
  .object({
    shippingAddress: checkoutAddressSchema,
    billingAddress: checkoutAddressSchema.optional(),
    billingSameAsShipping: z.boolean().default(true),
    paymentMethod: PaymentMethodEnum.default("COD"),
    guestEmail: optionalString(z.string().email()),
    notes: z.string().max(500).optional(),
  })
  .refine((v) => v.paymentMethod === "COD", {
    message: "Only Cash on Delivery is available at checkout today",
    path: ["paymentMethod"],
  });
export type CheckoutInput = z.infer<typeof checkoutInputSchema>;

export const orderItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().nullable(),
  productNameSnapshot: z.string(),
  unitPriceInPaise: z.number().int(),
  quantity: z.number().int(),
  lineTotalInPaise: z.number().int(),
});
export type OrderItem = z.infer<typeof orderItemSchema>;

export const orderStatusHistoryEntrySchema = z.object({
  id: z.string(),
  status: OrderStatusEnum,
  note: z.string().nullable(),
  createdAt: z.string(),
});
export type OrderStatusHistoryEntry = z.infer<typeof orderStatusHistoryEntrySchema>;

export const orderSchema = z.object({
  id: z.string(),
  orderNumber: z.string(),
  status: OrderStatusEnum,
  paymentStatus: PaymentStatusEnum,
  paymentMethod: PaymentMethodEnum,
  subtotalInPaise: z.number().int(),
  discountInPaise: z.number().int(),
  shippingInPaise: z.number().int(),
  taxInPaise: z.number().int(),
  totalInPaise: z.number().int(),
  shipFullName: z.string(),
  shipPhone: z.string(),
  shipLine1: z.string(),
  shipLine2: z.string().nullable(),
  shipCity: z.string(),
  shipState: z.string(),
  shipPostalCode: z.string(),
  shipCountry: z.string(),
  guestEmail: z.string().nullable(),
  notes: z.string().nullable(),
  items: z.array(orderItemSchema),
  statusHistory: z.array(orderStatusHistoryEntrySchema),
  isCancellable: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Order = z.infer<typeof orderSchema>;

export const orderSummarySchema = orderSchema.omit({ items: true, statusHistory: true }).extend({
  itemCount: z.number().int(),
});
export type OrderSummary = z.infer<typeof orderSummarySchema>;

export const cancelOrderSchema = z.object({
  reason: z.string().max(300).optional(),
});
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>;

export const adminUpdateOrderStatusSchema = z.object({
  status: OrderStatusEnum,
  note: z.string().max(500).optional(),
});
export type AdminUpdateOrderStatusInput = z.infer<typeof adminUpdateOrderStatusSchema>;

export const adminOrderListQuerySchema = z.object({
  status: OrderStatusEnum.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminOrderListQuery = z.infer<typeof adminOrderListQuerySchema>;
