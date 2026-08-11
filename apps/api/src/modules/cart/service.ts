import { randomBytes } from "node:crypto";
import type { PrismaClient } from "@yrs/db";
import type { Cart, AddCartItemInput } from "@yrs/shared";
import { cartRepository, type CartWithRelations } from "./repository.js";
import { calculateCouponDiscount, couponEligibilityError } from "../../lib/coupon-math.js";
import { resolveUnitPrice, resolveAvailableStock } from "../../lib/pricing.js";
import { BadRequestError, NotFoundError } from "../../lib/http-errors.js";

export interface CartContext {
  userId?: string;
  guestToken?: string;
}

function generateGuestToken(): string {
  return randomBytes(24).toString("base64url");
}

function itemUnitPrice(item: CartWithRelations["items"][number]): number {
  return resolveUnitPrice(item.product, item.variant);
}

function primaryImageOf(images: CartWithRelations["items"][number]["product"]["images"]) {
  const img = images.find((i) => i.isPrimary) ?? images[0];
  return img ? { id: img.id, url: img.url, altText: img.altText, position: img.position, isPrimary: img.isPrimary } : null;
}

function toCartDto(cart: CartWithRelations): Cart {
  const items = cart.items.map((item) => {
    const unitPriceInPaise = itemUnitPrice(item);
    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        name: item.product.name,
        slug: item.product.slug,
        shortDescription: item.product.shortDescription,
        priceInPaise: item.product.priceInPaise,
        compareAtPriceInPaise: item.product.compareAtPriceInPaise,
        ageGroup: item.product.ageGroup,
        isFeatured: item.product.isFeatured,
        isActive: item.product.isActive,
        stock: item.product.stock,
        avgRating: item.product.avgRating,
        reviewCount: item.product.reviewCount,
        category: item.product.category,
        primaryImage: primaryImageOf(item.product.images),
      },
      variant: item.variant
        ? {
            id: item.variant.id,
            name: item.variant.name,
            value: item.variant.value,
            skuSuffix: item.variant.skuSuffix,
            priceOverrideInPaise: item.variant.priceOverrideInPaise,
            stockOverride: item.variant.stockOverride,
            isActive: item.variant.isActive,
          }
        : null,
      unitPriceInPaise,
      lineTotalInPaise: unitPriceInPaise * item.quantity,
    };
  });

  const subtotalInPaise = items.reduce((sum, i) => sum + i.lineTotalInPaise, 0);
  const discountInPaise = cart.coupon ? calculateCouponDiscount(cart.coupon, subtotalInPaise) : 0;

  return {
    id: cart.id,
    items,
    coupon: cart.coupon
      ? {
          id: cart.coupon.id,
          code: cart.coupon.code,
          type: cart.coupon.type,
          value: cart.coupon.value,
          minOrderAmountInPaise: cart.coupon.minOrderAmountInPaise,
          maxDiscountInPaise: cart.coupon.maxDiscountInPaise,
          usageLimit: cart.coupon.usageLimit,
          usageLimitPerUser: cart.coupon.usageLimitPerUser,
          timesUsed: cart.coupon.timesUsed,
          startsAt: cart.coupon.startsAt?.toISOString() ?? null,
          expiresAt: cart.coupon.expiresAt?.toISOString() ?? null,
          isActive: cart.coupon.isActive,
          createdAt: cart.coupon.createdAt.toISOString(),
        }
      : null,
    subtotalInPaise,
    discountInPaise,
    totalInPaise: subtotalInPaise - discountInPaise,
    itemCount: items.reduce((sum, i) => sum + i.quantity, 0),
  };
}

export function cartService(prisma: PrismaClient) {
  const repo = cartRepository(prisma);

  async function resolveCart(ctx: CartContext): Promise<{ cart: CartWithRelations; issuedGuestToken?: string }> {
    if (ctx.userId) {
      const existing = await repo.findByUserId(ctx.userId);
      if (existing) return { cart: existing };
      const created = await repo.createForUser(ctx.userId);
      return { cart: created };
    }

    if (ctx.guestToken) {
      const existing = await repo.findByGuestToken(ctx.guestToken);
      if (existing) return { cart: existing };
    }

    const issuedGuestToken = generateGuestToken();
    const created = await repo.createForGuest(issuedGuestToken);
    return { cart: created, issuedGuestToken };
  }

  return {
    async getCart(ctx: CartContext) {
      const { cart, issuedGuestToken } = await resolveCart(ctx);
      return { cart: toCartDto(cart), issuedGuestToken };
    },

    async addItem(ctx: CartContext, input: AddCartItemInput) {
      const { cart, issuedGuestToken } = await resolveCart(ctx);

      const product = await repo.findProductForCart(input.productId);
      if (!product || !product.isActive) throw new NotFoundError("Product not found");

      const variant = input.variantId ? product.variants.find((v) => v.id === input.variantId) : null;
      if (input.variantId && !variant) throw new BadRequestError("Unknown product variant");

      const availableStock = resolveAvailableStock(product, variant);
      const existing = await repo.findExistingItem(cart.id, input.productId, input.variantId ?? null);
      const desiredQuantity = (existing?.quantity ?? 0) + input.quantity;
      if (desiredQuantity > availableStock) {
        throw new BadRequestError(`Only ${availableStock} left in stock`);
      }

      if (existing) {
        await repo.updateItemQuantity(existing.id, desiredQuantity);
      } else {
        await repo.createItem(cart.id, input.productId, input.variantId ?? null, input.quantity);
      }

      const refreshed = await repo.findById(cart.id);
      return { cart: toCartDto(refreshed!), issuedGuestToken };
    },

    async updateItem(ctx: CartContext, itemId: string, quantity: number) {
      const { cart, issuedGuestToken } = await resolveCart(ctx);
      const item = await repo.findItemInCart(cart.id, itemId);
      if (!item) throw new NotFoundError("Cart item not found");

      const product = await repo.findProductForCart(item.productId);
      const variant = item.variantId ? product?.variants.find((v) => v.id === item.variantId) : null;
      const availableStock = product ? resolveAvailableStock(product, variant) : 0;
      if (quantity > availableStock) throw new BadRequestError(`Only ${availableStock} left in stock`);

      await repo.updateItemQuantity(itemId, quantity);
      const refreshed = await repo.findById(cart.id);
      return { cart: toCartDto(refreshed!), issuedGuestToken };
    },

    async removeItem(ctx: CartContext, itemId: string) {
      const { cart, issuedGuestToken } = await resolveCart(ctx);
      await repo.removeItemInCart(cart.id, itemId);
      const refreshed = await repo.findById(cart.id);
      return { cart: toCartDto(refreshed!), issuedGuestToken };
    },

    async clear(ctx: CartContext) {
      const { cart, issuedGuestToken } = await resolveCart(ctx);
      await repo.clearItems(cart.id);
      const refreshed = await repo.findById(cart.id);
      return { cart: toCartDto(refreshed!), issuedGuestToken };
    },

    async applyCoupon(ctx: CartContext, code: string) {
      const { cart, issuedGuestToken } = await resolveCart(ctx);
      const coupon = await repo.findCouponByCode(code.toUpperCase());
      if (!coupon) throw new NotFoundError("Coupon not found");

      const subtotal = cart.items.reduce((sum, item) => sum + itemUnitPrice(item) * item.quantity, 0);
      const error = couponEligibilityError(coupon, subtotal);
      if (error) throw new BadRequestError(error);

      if (ctx.userId && coupon.usageLimitPerUser != null) {
        const usedByUser = await prisma.order.count({ where: { userId: ctx.userId, couponId: coupon.id } });
        if (usedByUser >= coupon.usageLimitPerUser) throw new BadRequestError("You've already used this coupon");
      }

      await repo.setCoupon(cart.id, coupon.id);
      const refreshed = await repo.findById(cart.id);
      return { cart: toCartDto(refreshed!), issuedGuestToken };
    },

    async removeCoupon(ctx: CartContext) {
      const { cart, issuedGuestToken } = await resolveCart(ctx);
      await repo.setCoupon(cart.id, null);
      const refreshed = await repo.findById(cart.id);
      return { cart: toCartDto(refreshed!), issuedGuestToken };
    },

    async mergeGuestIntoUser(userId: string, guestToken: string) {
      const guestCart = await repo.findByGuestToken(guestToken);
      if (!guestCart || guestCart.items.length === 0) {
        if (guestCart) await repo.deleteCart(guestCart.id);
        const { cart } = await resolveCart({ userId });
        return toCartDto(cart);
      }

      let userCart = await repo.findByUserId(userId);
      if (!userCart) userCart = await repo.createForUser(userId);

      await repo.mergeGuestIntoUserCart(guestCart, userCart.id);
      const refreshed = await repo.findByUserId(userId);
      return toCartDto(refreshed!);
    },
  };
}
export type CartService = ReturnType<typeof cartService>;
