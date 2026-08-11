import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { updateProfileSchema, authUserSchema } from "@yrs/shared";
import { userService } from "./service.js";
import { requireAuth } from "../../middleware/require-auth.js";

export async function registerUserRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const service = userService(fastify.prisma);

  app.patch(
    "/users/me",
    {
      preHandler: requireAuth,
      schema: { tags: ["users"], body: updateProfileSchema, response: { 200: authUserSchema } },
    },
    async (request) => {
      return service.updateProfile(request.user!.id, request.body);
    },
  );
}
