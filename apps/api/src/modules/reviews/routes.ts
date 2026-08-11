import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  reviewInputSchema,
  reviewSchema,
  moderateReviewSchema,
  paginationQuerySchema,
  paginatedResponseSchema,
  ReviewStatusEnum,
} from "@yrs/shared";
import { reviewService } from "./service.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { requireAdmin } from "../../middleware/require-admin.js";

const slugParams = z.object({ slug: z.string().min(1) });
const idParams = z.object({ id: z.string().min(1) });

const adminReviewSchema = reviewSchema.extend({
  product: z.object({ id: z.string(), name: z.string(), slug: z.string() }),
});

const adminReviewQuerySchema = paginationQuerySchema.extend({
  status: ReviewStatusEnum.optional(),
});

export async function registerReviewRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const service = reviewService(fastify.prisma);

  app.get(
    "/products/:slug/reviews",
    {
      schema: {
        tags: ["reviews"],
        params: slugParams,
        querystring: paginationQuerySchema,
        response: { 200: paginatedResponseSchema(reviewSchema) },
      },
    },
    async (request) => service.listForProduct(request.params.slug, request.query.page, request.query.limit),
  );

  app.post(
    "/products/:slug/reviews",
    {
      preHandler: requireAuth,
      schema: { tags: ["reviews"], params: slugParams, body: reviewInputSchema, response: { 201: reviewSchema } },
    },
    async (request, reply) => reply.status(201).send(await service.create(request.params.slug, request.user!.id, request.body)),
  );

  app.patch(
    "/reviews/:id",
    {
      preHandler: requireAuth,
      schema: { tags: ["reviews"], params: idParams, body: reviewInputSchema.partial(), response: { 200: reviewSchema } },
    },
    async (request) => service.update(request.params.id, request.user!.id, request.body),
  );

  app.delete(
    "/reviews/:id",
    { preHandler: requireAuth, schema: { tags: ["reviews"], params: idParams, response: { 204: z.void() } } },
    async (request, reply) => {
      await service.remove(request.params.id, request.user!);
      return reply.status(204).send();
    },
  );

  app.get(
    "/admin/reviews",
    {
      preHandler: requireAdmin,
      schema: {
        tags: ["admin-reviews"],
        querystring: adminReviewQuerySchema,
        response: { 200: paginatedResponseSchema(adminReviewSchema) },
      },
    },
    async (request) => service.listForAdmin(request.query.status, request.query.page, request.query.limit),
  );

  app.patch(
    "/admin/reviews/:id/moderate",
    {
      preHandler: requireAdmin,
      schema: { tags: ["admin-reviews"], params: idParams, body: moderateReviewSchema, response: { 200: reviewSchema } },
    },
    async (request) => service.moderate(request.params.id, request.body.status),
  );
}
