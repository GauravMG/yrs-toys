import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import { newsletterSubscribeSchema } from "@yrs/shared";
import { newsletterService } from "./service.js";

export async function registerNewsletterRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const service = newsletterService(fastify.prisma);

  app.post(
    "/newsletter/subscribe",
    { schema: { tags: ["newsletter"], body: newsletterSubscribeSchema, response: { 204: z.void() } } },
    async (request, reply) => {
      await service.subscribe(request.body.email);
      return reply.status(204).send();
    },
  );

  app.post(
    "/newsletter/unsubscribe",
    { schema: { tags: ["newsletter"], body: newsletterSubscribeSchema, response: { 204: z.void() } } },
    async (request, reply) => {
      await service.unsubscribe(request.body.email);
      return reply.status(204).send();
    },
  );
}
