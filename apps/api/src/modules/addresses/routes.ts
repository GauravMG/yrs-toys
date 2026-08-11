import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { addressInputSchema, addressSchema } from "@yrs/shared";
import { addressService } from "./service.js";
import { requireAuth } from "../../middleware/require-auth.js";

const idParams = z.object({ id: z.string().min(1) });

export async function registerAddressRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const service = addressService(fastify.prisma);

  app.get(
    "/users/me/addresses",
    { preHandler: requireAuth, schema: { tags: ["addresses"], response: { 200: z.array(addressSchema) } } },
    async (request) => service.list(request.user!.id),
  );

  app.post(
    "/users/me/addresses",
    {
      preHandler: requireAuth,
      schema: { tags: ["addresses"], body: addressInputSchema, response: { 201: addressSchema } },
    },
    async (request, reply) => {
      const address = await service.create(request.user!.id, request.body);
      return reply.status(201).send(address);
    },
  );

  app.patch(
    "/users/me/addresses/:id",
    {
      preHandler: requireAuth,
      schema: {
        tags: ["addresses"],
        params: idParams,
        body: addressInputSchema.partial(),
        response: { 200: addressSchema },
      },
    },
    async (request) => service.update(request.user!.id, request.params.id, request.body),
  );

  app.delete(
    "/users/me/addresses/:id",
    {
      preHandler: requireAuth,
      schema: { tags: ["addresses"], params: idParams, response: { 204: z.void() } },
    },
    async (request, reply) => {
      await service.remove(request.user!.id, request.params.id);
      return reply.status(204).send();
    },
  );

  app.patch(
    "/users/me/addresses/:id/default",
    {
      preHandler: requireAuth,
      schema: { tags: ["addresses"], params: idParams, response: { 200: addressSchema } },
    },
    async (request) => service.setDefault(request.user!.id, request.params.id),
  );
}
