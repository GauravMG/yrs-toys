import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  productListQuerySchema,
  productSummarySchema,
  productDetailSchema,
  productInputSchema,
  productUpdateSchema,
  productVariantInputSchema,
  productVariantSchema,
  productImageSchema,
  paginatedResponseSchema,
} from "@yrs/shared";
import { productService } from "./service.js";
import { requireAdmin } from "../../middleware/require-admin.js";
import { BadRequestError } from "../../lib/http-errors.js";

const idParams = z.object({ id: z.string().min(1) });
const slugParams = z.object({ slug: z.string().min(1) });
const productImageParams = z.object({ id: z.string().min(1), imageId: z.string().min(1) });
const productVariantParams = z.object({ id: z.string().min(1), variantId: z.string().min(1) });

export async function registerProductRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const service = productService(fastify.prisma);

  app.get(
    "/products",
    { schema: { tags: ["products"], querystring: productListQuerySchema, response: { 200: paginatedResponseSchema(productSummarySchema) } } },
    async (request) => service.list(request.query),
  );

  app.get(
    "/products/:slug",
    { schema: { tags: ["products"], params: slugParams, response: { 200: productDetailSchema } } },
    async (request) => service.getBySlug(request.params.slug),
  );

  app.get(
    "/products/:slug/related",
    { schema: { tags: ["products"], params: slugParams, response: { 200: z.array(productSummarySchema) } } },
    async (request) => service.getRelated(request.params.slug),
  );

  app.get(
    "/admin/products",
    {
      preHandler: requireAdmin,
      schema: { tags: ["admin-products"], querystring: productListQuerySchema, response: { 200: paginatedResponseSchema(productSummarySchema) } },
    },
    async (request) => service.list(request.query, { includeInactive: true }),
  );

  app.get(
    "/admin/products/:id",
    { preHandler: requireAdmin, schema: { tags: ["admin-products"], params: idParams, response: { 200: productDetailSchema } } },
    async (request) => service.getByIdAdmin(request.params.id),
  );

  app.post(
    "/admin/products",
    { preHandler: requireAdmin, schema: { tags: ["admin-products"], body: productInputSchema, response: { 201: productDetailSchema } } },
    async (request, reply) => reply.status(201).send(await service.create(request.body)),
  );

  app.patch(
    "/admin/products/:id",
    {
      preHandler: requireAdmin,
      schema: { tags: ["admin-products"], params: idParams, body: productUpdateSchema, response: { 200: productDetailSchema } },
    },
    async (request) => service.update(request.params.id, request.body),
  );

  app.delete(
    "/admin/products/:id",
    { preHandler: requireAdmin, schema: { tags: ["admin-products"], params: idParams, response: { 204: z.void() } } },
    async (request, reply) => {
      await service.softDelete(request.params.id);
      return reply.status(204).send();
    },
  );

  app.post(
    "/admin/products/:id/images",
    { preHandler: requireAdmin, schema: { tags: ["admin-products"], params: idParams, response: { 201: productImageSchema } } },
    async (request, reply) => {
      const file = await request.file();
      if (!file) throw new BadRequestError("No file uploaded");
      const buffer = await file.toBuffer();
      const image = await service.addImage(request.params.id, {
        buffer,
        filename: file.filename,
        mimeType: file.mimetype,
      });
      return reply.status(201).send(image);
    },
  );

  app.delete(
    "/admin/products/:id/images/:imageId",
    {
      preHandler: requireAdmin,
      schema: { tags: ["admin-products"], params: productImageParams, response: { 204: z.void() } },
    },
    async (request, reply) => {
      await service.removeImage(request.params.id, request.params.imageId);
      return reply.status(204).send();
    },
  );

  app.post(
    "/admin/products/:id/variants",
    {
      preHandler: requireAdmin,
      schema: { tags: ["admin-products"], params: idParams, body: productVariantInputSchema, response: { 201: productVariantSchema } },
    },
    async (request, reply) => reply.status(201).send(await service.addVariant(request.params.id, request.body)),
  );

  app.patch(
    "/admin/products/:id/variants/:variantId",
    {
      preHandler: requireAdmin,
      schema: {
        tags: ["admin-products"],
        params: productVariantParams,
        body: productVariantInputSchema.partial(),
        response: { 200: productVariantSchema },
      },
    },
    async (request) => service.updateVariant(request.params.id, request.params.variantId, request.body),
  );

  app.delete(
    "/admin/products/:id/variants/:variantId",
    {
      preHandler: requireAdmin,
      schema: { tags: ["admin-products"], params: productVariantParams, response: { 204: z.void() } },
    },
    async (request, reply) => {
      await service.removeVariant(request.params.id, request.params.variantId);
      return reply.status(204).send();
    },
  );
}
