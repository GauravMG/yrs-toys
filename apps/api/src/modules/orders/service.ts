import type { PrismaClient, Prisma } from "@yrs/db";
import type { Order, OrderSummary, CheckoutInput, Paginated } from "@yrs/shared";
import { isValidOrderStatusTransition, isCustomerCancellable, type OrderStatusValue } from "@yrs/shared";
import { orderRepository, type OrderWithRelations } from "./repository.js";
import { cartRepository } from "../cart/repository.js";
import type { CartContext } from "../cart/service.js";
import { generateOrderNumber } from "./order-number.js";
import { resolveUnitPrice, resolveAvailableStock, calculateShipping } from "../../lib/pricing.js";
import { calculateCouponDiscount, couponEligibilityError } from "../../lib/coupon-math.js";
import { getPaymentProvider } from "../../payments/provider-registry.js";
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from "../../lib/http-errors.js";
import { sendMail } from "../../email/mailer.js";
import { orderConfirmationEmail } from "../../email/templates/order-confirmation.js";
import { orderStatusUpdateEmail } from "../../email/templates/order-status-update.js";

function toOrder(order: OrderWithRelations): Order {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    subtotalInPaise: order.subtotalInPaise,
    discountInPaise: order.discountInPaise,
    shippingInPaise: order.shippingInPaise,
    taxInPaise: order.taxInPaise,
    totalInPaise: order.totalInPaise,
    shipFullName: order.shipFullName,
    shipPhone: order.shipPhone,
    shipLine1: order.shipLine1,
    shipLine2: order.shipLine2,
    shipCity: order.shipCity,
    shipState: order.shipState,
    shipPostalCode: order.shipPostalCode,
    shipCountry: order.shipCountry,
    guestEmail: order.guestEmail,
    notes: order.notes,
    items: order.items.map((i) => ({
      id: i.id,
      productId: i.productId,
      variantId: i.variantId,
      productNameSnapshot: i.productNameSnapshot,
      unitPriceInPaise: i.unitPriceInPaise,
      quantity: i.quantity,
      lineTotalInPaise: i.lineTotalInPaise,
    })),
    statusHistory: order.statusHistory.map((h) => ({ id: h.id, status: h.status, note: h.note, createdAt: h.createdAt.toISOString() })),
    isCancellable: isCustomerCancellable(order.status),
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };
}

function toOrderSummary(order: OrderWithRelations): OrderSummary {
  const { items: _items, statusHistory: _statusHistory, ...rest } = toOrder(order);
  return { ...rest, itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0) };
}

export function orderService(prisma: PrismaClient) {
  const repo = orderRepository(prisma);
  const cartRepo = cartRepository(prisma);

  return {
    async checkout(ctx: CartContext, input: CheckoutInput): Promise<Order> {
      const cart = ctx.userId ? await cartRepo.findByUserId(ctx.userId) : ctx.guestToken ? await cartRepo.findByGuestToken(ctx.guestToken) : null;
      if (!cart || cart.items.length === 0) throw new BadRequestError("Your cart is empty");

      if (!ctx.userId && !input.guestEmail) {
        throw new BadRequestError("An email address is required to check out as a guest");
      }

      const billing = input.billingSameAsShipping ? undefined : input.billingAddress;

      const order = await prisma.$transaction(async (tx) => {
        let subtotalInPaise = 0;
        const orderItemsData: Prisma.OrderItemCreateManyOrderInput[] = [];
        const stockDecrements: Array<{ productId: string; variantId: string | null; quantity: number }> = [];

        for (const item of cart.items) {
          const product = await tx.product.findUnique({ where: { id: item.productId }, include: { variants: true } });
          if (!product || !product.isActive) {
            throw new BadRequestError(`"${item.product.name}" is no longer available`);
          }
          const variant = item.variantId ? product.variants.find((v) => v.id === item.variantId) : null;
          const availableStock = resolveAvailableStock(product, variant);
          if (item.quantity > availableStock) {
            throw new BadRequestError(`Only ${availableStock} left in stock for "${product.name}"`);
          }

          const unitPriceInPaise = resolveUnitPrice(product, variant);
          const lineTotalInPaise = unitPriceInPaise * item.quantity;
          subtotalInPaise += lineTotalInPaise;

          orderItemsData.push({
            productId: product.id,
            variantId: item.variantId,
            productNameSnapshot: product.name,
            unitPriceInPaise,
            quantity: item.quantity,
            lineTotalInPaise,
          });
          stockDecrements.push({ productId: product.id, variantId: item.variantId, quantity: item.quantity });
        }

        let discountInPaise = 0;
        let couponId: string | null = null;
        if (cart.couponId) {
          const coupon = await tx.coupon.findUnique({ where: { id: cart.couponId } });
          const eligible = coupon && !couponEligibilityError(coupon, subtotalInPaise);
          const withinPerUserLimit =
            eligible && ctx.userId && coupon.usageLimitPerUser != null
              ? (await tx.order.count({ where: { userId: ctx.userId, couponId: coupon.id } })) < coupon.usageLimitPerUser
              : true;
          // A coupon that expired/maxed-out between add-to-cart and checkout
          // is dropped silently rather than blocking an otherwise-valid
          // order — the customer still gets to complete their purchase.
          if (eligible && withinPerUserLimit) {
            discountInPaise = calculateCouponDiscount(coupon, subtotalInPaise);
            couponId = coupon.id;
          }
        }

        const shippingInPaise = calculateShipping(subtotalInPaise);
        const taxInPaise = 0;
        const totalInPaise = subtotalInPaise - discountInPaise + shippingInPaise + taxInPaise;

        let created: OrderWithRelations | null = null;
        for (let attempt = 0; attempt < 5 && !created; attempt++) {
          try {
            created = await tx.order.create({
              data: {
                orderNumber: generateOrderNumber(),
                userId: ctx.userId,
                guestEmail: ctx.userId ? undefined : input.guestEmail,
                paymentMethod: input.paymentMethod,
                subtotalInPaise,
                discountInPaise,
                shippingInPaise,
                taxInPaise,
                totalInPaise,
                couponId,
                notes: input.notes,
                shipFullName: input.shippingAddress.fullName,
                shipPhone: input.shippingAddress.phone,
                shipLine1: input.shippingAddress.line1,
                shipLine2: input.shippingAddress.line2,
                shipCity: input.shippingAddress.city,
                shipState: input.shippingAddress.state,
                shipPostalCode: input.shippingAddress.postalCode,
                shipCountry: input.shippingAddress.country,
                billFullName: billing?.fullName,
                billPhone: billing?.phone,
                billLine1: billing?.line1,
                billLine2: billing?.line2,
                billCity: billing?.city,
                billState: billing?.state,
                billPostalCode: billing?.postalCode,
                billCountry: billing?.country,
                items: { createMany: { data: orderItemsData } },
              },
              include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
            });
          } catch (err) {
            if (err instanceof Error && "code" in err && (err as { code?: string }).code === "P2002") {
              continue; // orderNumber collision (extremely rare) — retry with a fresh number
            }
            throw err;
          }
        }
        if (!created) throw new ConflictError("Could not allocate an order number, please try again");

        await tx.orderStatusHistory.create({ data: { orderId: created.id, status: "PENDING" } });

        for (const dec of stockDecrements) {
          if (dec.variantId) {
            const variant = await tx.productVariant.findUnique({ where: { id: dec.variantId } });
            if (variant?.stockOverride != null) {
              await tx.productVariant.update({ where: { id: dec.variantId }, data: { stockOverride: { decrement: dec.quantity } } });
              continue;
            }
          }
          await tx.product.update({ where: { id: dec.productId }, data: { stock: { decrement: dec.quantity } } });
        }

        if (couponId) {
          await tx.coupon.update({ where: { id: couponId }, data: { timesUsed: { increment: 1 } } });
        }

        const paymentResult = await getPaymentProvider(input.paymentMethod).createPaymentIntent({
          orderId: created.id,
          amountInPaise: totalInPaise,
        });
        await tx.payment.create({
          data: {
            orderId: created.id,
            method: input.paymentMethod,
            status: paymentResult.status,
            amountInPaise: totalInPaise,
            providerRef: paymentResult.providerRef,
          },
        });
        if (paymentResult.status !== created.paymentStatus) {
          await tx.order.update({ where: { id: created.id }, data: { paymentStatus: paymentResult.status } });
        }

        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

        // `created`'s cached `include` snapshot predates the status-history
        // row and any payment-status update above — refetch so the response
        // (and the confirmation email built from it) reflect reality.
        return tx.order.findUniqueOrThrow({
          where: { id: created.id },
          include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
        });
      });

      const recipientEmail = ctx.userId ? (await repo.findUserById(ctx.userId))?.email : input.guestEmail;
      const recipientName = ctx.userId ? (await repo.findUserById(ctx.userId))?.fullName : input.shippingAddress.fullName;
      if (recipientEmail) {
        const { subject, html } = orderConfirmationEmail({
          fullName: recipientName ?? input.shippingAddress.fullName,
          orderNumber: order.orderNumber,
          items: order.items.map((i) => ({ name: i.productNameSnapshot, quantity: i.quantity, lineTotalInPaise: i.lineTotalInPaise })),
          subtotalInPaise: order.subtotalInPaise,
          discountInPaise: order.discountInPaise,
          shippingInPaise: order.shippingInPaise,
          totalInPaise: order.totalInPaise,
          shipLine1: order.shipLine1,
          shipCity: order.shipCity,
          shipState: order.shipState,
          shipPostalCode: order.shipPostalCode,
        });
        // Best-effort: a slow/down mail server should never fail checkout.
        sendMail({ to: recipientEmail, subject, html }).catch((err) => {
          console.error("Failed to send order confirmation email", err);
        });
      }

      return toOrder(order);
    },

    async listForUser(userId: string, page: number, limit: number): Promise<Paginated<OrderSummary>> {
      const { rows, total } = await repo.findManyForUser(userId, page, limit);
      return { items: rows.map(toOrderSummary), total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
    },

    async getByOrderNumber(orderNumber: string, requester: { userId?: string; guestEmail?: string }): Promise<Order> {
      const order = await repo.findByOrderNumber(orderNumber);
      if (!order) throw new NotFoundError("Order not found");

      const isOwner = requester.userId && order.userId === requester.userId;
      const isMatchingGuest =
        !order.userId && order.guestEmail && requester.guestEmail && order.guestEmail.toLowerCase() === requester.guestEmail.toLowerCase();
      if (!isOwner && !isMatchingGuest) throw new NotFoundError("Order not found");

      return toOrder(order);
    },

    async cancel(orderNumber: string, userId: string, reason?: string): Promise<Order> {
      const order = await repo.findByOrderNumber(orderNumber);
      if (!order) throw new NotFoundError("Order not found");
      if (order.userId !== userId) throw new ForbiddenError();
      if (!isCustomerCancellable(order.status)) {
        throw new ConflictError("This order can no longer be cancelled");
      }

      const updated = await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          if (item.variantId) {
            const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
            if (variant?.stockOverride != null) {
              await tx.productVariant.update({ where: { id: item.variantId }, data: { stockOverride: { increment: item.quantity } } });
              continue;
            }
          }
          await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
        }
        const cancelled = await tx.order.update({
          where: { id: order.id },
          data: { status: "CANCELLED", cancelledAt: new Date(), cancelReason: reason },
          include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
        });
        await tx.orderStatusHistory.create({ data: { orderId: order.id, status: "CANCELLED", note: reason } });
        return cancelled;
      });

      return toOrder(updated);
    },

    async listForAdmin(filters: { status?: OrderStatusValue; from?: string; to?: string; q?: string }, page: number, limit: number) {
      const { rows, total } = await repo.findManyForAdmin(
        { status: filters.status, from: filters.from ? new Date(filters.from) : undefined, to: filters.to ? new Date(filters.to) : undefined, q: filters.q },
        page,
        limit,
      );
      return { items: rows.map(toOrderSummary), total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
    },

    async getByIdAdmin(id: string): Promise<Order> {
      const order = await repo.findById(id);
      if (!order) throw new NotFoundError("Order not found");
      return toOrder(order);
    },

    async updateStatusAdmin(id: string, nextStatus: OrderStatusValue, note: string | undefined, adminUserId: string): Promise<Order> {
      const order = await repo.findById(id);
      if (!order) throw new NotFoundError("Order not found");
      if (!isValidOrderStatusTransition(order.status, nextStatus)) {
        throw new ConflictError(`Cannot move an order from ${order.status} to ${nextStatus}`);
      }

      const updated = await prisma.$transaction(async (tx) => {
        const data: Prisma.OrderUpdateInput = { status: nextStatus };
        // Cash on Delivery collects payment at the doorstep — reconcile the
        // payment ledger the moment the order is marked delivered.
        if (nextStatus === "DELIVERED" && order.paymentMethod === "COD" && order.paymentStatus === "PENDING") {
          data.paymentStatus = "PAID";
          await tx.payment.updateMany({ where: { orderId: order.id, status: "PENDING" }, data: { status: "PAID", paidAt: new Date() } });
        }
        if (nextStatus === "REFUNDED") {
          data.paymentStatus = "REFUNDED";
          await tx.payment.updateMany({ where: { orderId: order.id }, data: { status: "REFUNDED" } });
        }

        const result = await tx.order.update({
          where: { id },
          data,
          include: { items: true, statusHistory: { orderBy: { createdAt: "asc" } } },
        });
        await tx.orderStatusHistory.create({ data: { orderId: id, status: nextStatus, note, changedByUserId: adminUserId } });
        return result;
      });

      const recipientEmail = updated.userId ? (await repo.findUserById(updated.userId))?.email : updated.guestEmail;
      const recipientName = updated.userId ? (await repo.findUserById(updated.userId))?.fullName : updated.shipFullName;
      if (recipientEmail) {
        const { subject, html } = orderStatusUpdateEmail({
          fullName: recipientName ?? updated.shipFullName,
          orderNumber: updated.orderNumber,
          status: nextStatus,
          note,
        });
        sendMail({ to: recipientEmail, subject, html }).catch((err) => {
          console.error("Failed to send order status update email", err);
        });
      }

      return toOrder(updated);
    },
  };
}
export type OrderService = ReturnType<typeof orderService>;
