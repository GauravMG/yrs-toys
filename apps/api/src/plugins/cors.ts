import fp from "fastify-plugin";
import cors from "@fastify/cors";
import type { FastifyInstance } from "fastify";
import { env } from "../config/env.js";

export default fp(async function corsPlugin(fastify: FastifyInstance) {
  const allowedOrigins = [env.CORS_ORIGIN_WEB, env.CORS_ORIGIN_ADMIN];
  await fastify.register(cors, {
    origin: allowedOrigins,
    credentials: true,
    // Without this, the browser's fetch/XHR can't read custom response
    // headers cross-origin even when the origin itself is allowed — the
    // guest cart (apps/web) relies on reading this header to persist an
    // anonymous cart identity across requests.
    exposedHeaders: ["X-Guest-Cart-Token"],
  });
});
