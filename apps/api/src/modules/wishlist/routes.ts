import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { wishlistItemSchema } from "@yrs/shared";
import { wishlistService } from "./service.js";
import { requireAuth } from "../../middleware/require-auth.js";

const productParams = z.object({ productId: z.string().min(1) });

export async function registerWishlistRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const service = wishlistService(fastify.prisma);

  app.get(
    "/wishlist",
    { preHandler: requireAuth, schema: { tags: ["wishlist"], response: { 200: z.array(wishlistItemSchema) } } },
    async (request) => service.list(request.user!.id),
  );

  app.post(
    "/wishlist/:productId",
    {
      preHandler: requireAuth,
      schema: { tags: ["wishlist"], params: productParams, response: { 201: wishlistItemSchema } },
    },
    async (request, reply) => {
      const item = await service.add(request.user!.id, request.params.productId);
      return reply.status(201).send(item);
    },
  );

  app.delete(
    "/wishlist/:productId",
    {
      preHandler: requireAuth,
      schema: { tags: ["wishlist"], params: productParams, response: { 204: z.void() } },
    },
    async (request, reply) => {
      await service.remove(request.user!.id, request.params.productId);
      return reply.status(204).send();
    },
  );
}
