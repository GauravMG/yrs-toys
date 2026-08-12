import Fastify from "fastify";
import type { FastifyInstance } from "fastify";
import { serializerCompiler, validatorCompiler, type ZodTypeProvider } from "fastify-type-provider-zod";
import { env } from "./config/env.js";

import prismaPlugin from "./plugins/prisma.js";
import corsPlugin from "./plugins/cors.js";
import helmetPlugin from "./plugins/helmet.js";
import rateLimitPlugin from "./plugins/rateLimit.js";
import cookiePlugin from "./plugins/cookie.js";
import multipartPlugin from "./plugins/multipart.js";
import swaggerPlugin from "./plugins/swagger.js";
import errorHandlerPlugin from "./plugins/errorHandler.js";
import jwtPlugin from "./plugins/jwt.js";

import { registerAuthRoutes } from "./modules/auth/routes.js";
import { registerUserRoutes } from "./modules/users/routes.js";
import { registerAddressRoutes } from "./modules/addresses/routes.js";
import { registerCategoryRoutes } from "./modules/categories/routes.js";
import { registerProductRoutes } from "./modules/products/routes.js";
import { registerReviewRoutes } from "./modules/reviews/routes.js";
import { registerCartRoutes } from "./modules/cart/routes.js";
import { registerCouponRoutes } from "./modules/coupons/routes.js";
import { registerOrderRoutes } from "./modules/orders/routes.js";
import { registerWishlistRoutes } from "./modules/wishlist/routes.js";
import { registerNewsletterRoutes } from "./modules/newsletter/routes.js";
import { registerAdminDashboardRoutes } from "./modules/admin-dashboard/routes.js";
import { registerUploadRoutes } from "./modules/uploads/routes.js";

export async function buildApp(): Promise<FastifyInstance> {
  const fastify = Fastify({
    // The API is always deployed behind a reverse proxy (nginx locally in
    // Docker Compose isn't in front of it, but the EC2/production topology
    // terminates TLS at nginx and forwards to this service) — without
    // trustProxy, request.ip would report the proxy's address for every
    // request, which breaks the IP audit trail on refresh-token rows
    // (see modules/auth/repository.ts's createdByIp).
    trustProxy: true,
    logger:
      env.NODE_ENV === "development"
        ? { transport: { target: "pino-pretty", options: { translateTime: "HH:MM:ss", ignore: "pid,hostname" } } }
        : env.NODE_ENV === "test"
          ? false
          : true,
  }).withTypeProvider<ZodTypeProvider>();

  fastify.setValidatorCompiler(validatorCompiler);
  fastify.setSerializerCompiler(serializerCompiler);

  await fastify.register(errorHandlerPlugin);
  await fastify.register(prismaPlugin);
  await fastify.register(corsPlugin);
  await fastify.register(helmetPlugin);
  await fastify.register(rateLimitPlugin);
  await fastify.register(cookiePlugin);
  await fastify.register(multipartPlugin);
  await fastify.register(jwtPlugin);
  await fastify.register(swaggerPlugin);

  fastify.get("/healthz", async () => ({ status: "ok" }));

  // Registered at the root (not under /api/v1) so stored image URLs
  // (`/uploads/<file>`, written by modules/uploads/storage-adapter.ts) stay
  // short and stable regardless of the API's versioned route prefix.
  await registerUploadRoutes(fastify);

  await fastify.register(
    async (api) => {
      await registerAuthRoutes(api);
      await registerUserRoutes(api);
      await registerAddressRoutes(api);
      await registerCategoryRoutes(api);
      await registerProductRoutes(api);
      await registerReviewRoutes(api);
      await registerCartRoutes(api);
      await registerCouponRoutes(api);
      await registerOrderRoutes(api);
      await registerWishlistRoutes(api);
      await registerNewsletterRoutes(api);
      await registerAdminDashboardRoutes(api);
    },
    { prefix: "/api/v1" },
  );

  return fastify;
}
