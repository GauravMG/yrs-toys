import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { couponInputSchema, couponUpdateSchema, couponSchema } from "@yrs/shared";
import { couponService } from "./service.js";
import { requireAdmin } from "../../middleware/require-admin.js";

const idParams = z.object({ id: z.string().min(1) });

export async function registerCouponRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const service = couponService(fastify.prisma);

  app.get(
    "/admin/coupons",
    { preHandler: requireAdmin, schema: { tags: ["admin-coupons"], response: { 200: z.array(couponSchema) } } },
    async () => service.list(),
  );

  app.post(
    "/admin/coupons",
    { preHandler: requireAdmin, schema: { tags: ["admin-coupons"], body: couponInputSchema, response: { 201: couponSchema } } },
    async (request, reply) => reply.status(201).send(await service.create(request.body)),
  );

  app.patch(
    "/admin/coupons/:id",
    {
      preHandler: requireAdmin,
      schema: { tags: ["admin-coupons"], params: idParams, body: couponUpdateSchema, response: { 200: couponSchema } },
    },
    async (request) => service.update(request.params.id, request.body),
  );

  app.delete(
    "/admin/coupons/:id",
    { preHandler: requireAdmin, schema: { tags: ["admin-coupons"], params: idParams, response: { 204: z.void() } } },
    async (request, reply) => {
      await service.remove(request.params.id);
      return reply.status(204).send();
    },
  );
}
