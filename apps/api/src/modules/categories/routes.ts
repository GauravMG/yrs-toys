import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { categoryInputSchema, categorySchema } from "@yrs/shared";
import { categoryService } from "./service.js";
import { requireAdmin } from "../../middleware/require-admin.js";

const idParams = z.object({ id: z.string().min(1) });
const slugParams = z.object({ slug: z.string().min(1) });

export async function registerCategoryRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const service = categoryService(fastify.prisma);

  app.get(
    "/categories",
    { schema: { tags: ["categories"], response: { 200: z.array(categorySchema) } } },
    async () => service.tree(),
  );

  app.get(
    "/categories/:slug",
    { schema: { tags: ["categories"], params: slugParams, response: { 200: categorySchema } } },
    async (request) => service.bySlug(request.params.slug),
  );

  app.post(
    "/admin/categories",
    {
      preHandler: requireAdmin,
      schema: { tags: ["admin-categories"], body: categoryInputSchema, response: { 201: categorySchema } },
    },
    async (request, reply) => {
      const category = await service.create(request.body);
      return reply.status(201).send(category);
    },
  );

  app.patch(
    "/admin/categories/:id",
    {
      preHandler: requireAdmin,
      schema: {
        tags: ["admin-categories"],
        params: idParams,
        body: categoryInputSchema.partial(),
        response: { 200: categorySchema },
      },
    },
    async (request) => service.update(request.params.id, request.body),
  );

  app.delete(
    "/admin/categories/:id",
    {
      preHandler: requireAdmin,
      schema: { tags: ["admin-categories"], params: idParams, response: { 204: z.void() } },
    },
    async (request, reply) => {
      await service.remove(request.params.id);
      return reply.status(204).send();
    },
  );
}
