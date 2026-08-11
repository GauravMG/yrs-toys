import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  checkoutInputSchema,
  orderSchema,
  orderSummarySchema,
  cancelOrderSchema,
  adminUpdateOrderStatusSchema,
  adminOrderListQuerySchema,
  paginationQuerySchema,
  paginatedResponseSchema,
} from "@yrs/shared";
import { orderService } from "./service.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requireAdmin } from "../../middleware/require-admin.js";

const GUEST_TOKEN_HEADER = "x-guest-cart-token";
const orderNumberParams = z.object({ orderNumber: z.string().min(1) });
const idParams = z.object({ id: z.string().min(1) });
const guestLookupQuery = z.object({ email: z.string().email().optional() });

export async function registerOrderRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const service = orderService(fastify.prisma);

  app.post(
    "/orders",
    { schema: { tags: ["orders"], body: checkoutInputSchema, response: { 201: orderSchema } } },
    async (request, reply) => {
      const guestToken = request.headers[GUEST_TOKEN_HEADER];
      const order = await service.checkout(
        { userId: request.user?.id, guestToken: typeof guestToken === "string" ? guestToken : undefined },
        request.body,
      );
      return reply.status(201).send(order);
    },
  );

  app.get(
    "/orders",
    {
      preHandler: requireAuth,
      schema: { tags: ["orders"], querystring: paginationQuerySchema, response: { 200: paginatedResponseSchema(orderSummarySchema) } },
    },
    async (request) => service.listForUser(request.user!.id, request.query.page, request.query.limit),
  );

  app.get(
    "/orders/:orderNumber",
    { schema: { tags: ["orders"], params: orderNumberParams, querystring: guestLookupQuery, response: { 200: orderSchema } } },
    async (request) =>
      service.getByOrderNumber(request.params.orderNumber, { userId: request.user?.id, guestEmail: request.query.email }),
  );

  app.post(
    "/orders/:orderNumber/cancel",
    {
      preHandler: requireAuth,
      schema: { tags: ["orders"], params: orderNumberParams, body: cancelOrderSchema, response: { 200: orderSchema } },
    },
    async (request) => service.cancel(request.params.orderNumber, request.user!.id, request.body.reason),
  );

  app.get(
    "/admin/orders",
    {
      preHandler: requireAdmin,
      schema: { tags: ["admin-orders"], querystring: adminOrderListQuerySchema, response: { 200: paginatedResponseSchema(orderSummarySchema) } },
    },
    async (request) => {
      const { page, limit, ...filters } = request.query;
      return service.listForAdmin(filters, page, limit);
    },
  );

  app.get(
    "/admin/orders/:id",
    { preHandler: requireAdmin, schema: { tags: ["admin-orders"], params: idParams, response: { 200: orderSchema } } },
    async (request) => service.getByIdAdmin(request.params.id),
  );

  app.patch(
    "/admin/orders/:id/status",
    {
      preHandler: requireAdmin,
      schema: { tags: ["admin-orders"], params: idParams, body: adminUpdateOrderStatusSchema, response: { 200: orderSchema } },
    },
    async (request) => service.updateStatusAdmin(request.params.id, request.body.status, request.body.note, request.user!.id),
  );
}
