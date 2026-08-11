import path from "node:path";
import type { FastifyInstance } from "fastify";
import fastifyStatic from "@fastify/static";
import { env } from "../../config/env.js";

/** Serves uploaded product images at /uploads/*. No admin routes of its own — see modules/products for the upload endpoint that writes here via storage-adapter.ts. */
export async function registerUploadRoutes(fastify: FastifyInstance) {
  await fastify.register(fastifyStatic, {
    root: path.resolve(env.UPLOAD_DIR),
    prefix: "/uploads/",
    decorateReply: false,
  });
}
