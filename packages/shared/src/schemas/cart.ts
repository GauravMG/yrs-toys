import { z } from "zod";
import { productSummarySchema } from "./product.js";
import { productVariantSchema } from "./product.js";
import { couponSchema } from "./coupon.js";

export const addCartItemSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().min(1).max(20).default(1),
});
export type AddCartItemInput = z.infer<typeof addCartItemSchema>;

export const updateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(20),
});
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>;

export const cartItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  variantId: z.string().nullable(),
  quantity: z.number().int(),
  product: productSummarySchema,
  variant: productVariantSchema.nullable(),
  unitPriceInPaise: z.number().int(),
  lineTotalInPaise: z.number().int(),
});
export type CartItem = z.infer<typeof cartItemSchema>;

export const cartSchema = z.object({
  id: z.string(),
  items: z.array(cartItemSchema),
  coupon: couponSchema.nullable(),
  subtotalInPaise: z.number().int(),
  discountInPaise: z.number().int(),
  totalInPaise: z.number().int(),
  itemCount: z.number().int(),
});
export type Cart = z.infer<typeof cartSchema>;
