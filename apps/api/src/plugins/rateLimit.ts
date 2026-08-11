import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";

export default fp(async function rateLimitPlugin(fastify: FastifyInstance) {
  await fastify.register(rateLimit, {
    global: true,
    max: env.NODE_ENV === "test" ? 10_000 : 300,
    timeWindow: "1 minute",
  });
});
