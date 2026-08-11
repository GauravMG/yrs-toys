import type { PrismaClient, Prisma } from "@yrs/db";

const cartInclude = {
  coupon: true,
  items: {
    include: {
      product: { include: { category: { select: { id: true, name: true, slug: true } }, images: { orderBy: { position: "asc" as const } } } },
      variant: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.CartInclude;

export type CartWithRelations = Prisma.CartGetPayload<{ include: typeof cartInclude }>;

export function cartRepository(prisma: PrismaClient) {
  return {
    findByUserId(userId: string) {
      return prisma.cart.findUnique({ where: { userId }, include: cartInclude });
    },
    findByGuestToken(guestToken: string) {
      return prisma.cart.findUnique({ where: { guestToken }, include: cartInclude });
    },
    findById(id: string) {
      return prisma.cart.findUnique({ where: { id }, include: cartInclude });
    },
    createForUser(userId: string) {
      return prisma.cart.create({ data: { userId }, include: cartInclude });
    },
    createForGuest(guestToken: string) {
      return prisma.cart.create({ data: { guestToken }, include: cartInclude });
    },

    findProductForCart(productId: string) {
      return prisma.product.findUnique({ where: { id: productId }, include: { variants: true } });
    },

    findExistingItem(cartId: string, productId: string, variantId: string | null) {
      // Prisma's compound-unique WhereUniqueInput doesn't accept `null` for
      // a nullable member field, and Postgres itself doesn't treat NULL as
      // equal to NULL for uniqueness anyway — findFirst with a plain filter
      // does the right thing for both the "no variant" and "with variant"
      // cases.
      return prisma.cartItem.findFirst({ where: { cartId, productId, variantId } });
    },

    createItem(cartId: string, productId: string, variantId: string | null, quantity: number) {
      return prisma.cartItem.create({ data: { cartId, productId, variantId, quantity } });
    },

    updateItemQuantity(itemId: string, quantity: number) {
      return prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
    },

    async removeItemInCart(cartId: string, itemId: string) {
      return prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
    },

    findItemInCart(cartId: string, itemId: string) {
      return prisma.cartItem.findFirst({ where: { id: itemId, cartId } });
    },

    clearItems(cartId: string) {
      return prisma.cartItem.deleteMany({ where: { cartId } });
    },

    setCoupon(cartId: string, couponId: string | null) {
      return prisma.cart.update({ where: { id: cartId }, data: { couponId } });
    },

    findCouponByCode(code: string) {
      return prisma.coupon.findUnique({ where: { code } });
    },

    async mergeGuestIntoUserCart(guestCart: CartWithRelations, userCartId: string) {
      await prisma.$transaction(async (tx) => {
        for (const item of guestCart.items) {
          const existing = await tx.cartItem.findFirst({
            where: { cartId: userCartId, productId: item.productId, variantId: item.variantId },
          });
          if (existing) {
            await tx.cartItem.update({ where: { id: existing.id }, data: { quantity: existing.quantity + item.quantity } });
          } else {
            await tx.cartItem.create({
              data: { cartId: userCartId, productId: item.productId, variantId: item.variantId, quantity: item.quantity },
            });
          }
        }
        await tx.cart.delete({ where: { id: guestCart.id } });
      });
    },

    deleteCart(cartId: string) {
      return prisma.cart.delete({ where: { id: cartId } });
    },
  };
}
export type CartRepository = ReturnType<typeof cartRepository>;
