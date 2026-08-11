import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { addCartItemSchema, updateCartItemSchema, applyCouponSchema, cartSchema } from "@yrs/shared";
import { cartService, type CartContext } from "./service.js";
import { requireAuth } from "../../middleware/require-auth.js";

const GUEST_TOKEN_HEADER = "x-guest-cart-token";
const itemParams = z.object({ itemId: z.string().min(1) });

function contextFromRequest(request: FastifyRequest): CartContext {
  const header = request.headers[GUEST_TOKEN_HEADER];
  return {
    userId: request.user?.id,
    guestToken: typeof header === "string" ? header : undefined,
  };
}

export async function registerCartRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const service = cartService(fastify.prisma);

  function respond(reply: FastifyReply, result: { cart: ReturnType<typeof cartSchema.parse>; issuedGuestToken?: string }) {
    if (result.issuedGuestToken) reply.header("X-Guest-Cart-Token", result.issuedGuestToken);
    return reply.send(result.cart);
  }

  app.get("/cart", { schema: { tags: ["cart"], response: { 200: cartSchema } } }, async (request, reply) =>
    respond(reply, await service.getCart(contextFromRequest(request))),
  );

  app.post(
    "/cart/items",
    { schema: { tags: ["cart"], body: addCartItemSchema, response: { 200: cartSchema } } },
    async (request, reply) => respond(reply, await service.addItem(contextFromRequest(request), request.body)),
  );

  app.patch(
    "/cart/items/:itemId",
    { schema: { tags: ["cart"], params: itemParams, body: updateCartItemSchema, response: { 200: cartSchema } } },
    async (request, reply) =>
      respond(reply, await service.updateItem(contextFromRequest(request), request.params.itemId, request.body.quantity)),
  );

  app.delete(
    "/cart/items/:itemId",
    { schema: { tags: ["cart"], params: itemParams, response: { 200: cartSchema } } },
    async (request, reply) => respond(reply, await service.removeItem(contextFromRequest(request), request.params.itemId)),
  );

  app.delete("/cart", { schema: { tags: ["cart"], response: { 200: cartSchema } } }, async (request, reply) =>
    respond(reply, await service.clear(contextFromRequest(request))),
  );

  app.post(
    "/cart/apply-coupon",
    { schema: { tags: ["cart"], body: applyCouponSchema, response: { 200: cartSchema } } },
    async (request, reply) => respond(reply, await service.applyCoupon(contextFromRequest(request), request.body.code)),
  );

  app.delete("/cart/coupon", { schema: { tags: ["cart"], response: { 200: cartSchema } } }, async (request, reply) =>
    respond(reply, await service.removeCoupon(contextFromRequest(request))),
  );

  app.post(
    "/cart/merge",
    { preHandler: requireAuth, schema: { tags: ["cart"], body: z.object({ guestToken: z.string().min(1) }), response: { 200: cartSchema } } },
    async (request) => service.mergeGuestIntoUser(request.user!.id, request.body.guestToken),
  );
}
