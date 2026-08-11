import { z } from "zod";
import { productSummarySchema } from "./product.js";

export const wishlistItemSchema = z.object({
  id: z.string(),
  productId: z.string(),
  createdAt: z.string(),
  product: productSummarySchema,
});
export type WishlistItem = z.infer<typeof wishlistItemSchema>;
