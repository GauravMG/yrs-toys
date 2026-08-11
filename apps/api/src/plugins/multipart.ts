import fp from "fastify-plugin";
import multipart from "@fastify/multipart";
import type { FastifyInstance } from "fastify";

export default fp(async function multipartPlugin(fastify: FastifyInstance) {
  await fastify.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB per product image
      files: 6,
    },
  });
});
