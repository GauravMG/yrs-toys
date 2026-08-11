import fp from "fastify-plugin";
import type { FastifyInstance } from "fastify";
import { prisma } from "@yrs/db";

declare module "fastify" {
  interface FastifyInstance {
    prisma: typeof prisma;
  }
}

export default fp(async function prismaPlugin(fastify: FastifyInstance) {
  fastify.decorate("prisma", prisma);
  fastify.addHook("onClose", async () => {
    await prisma.$disconnect();
  });
});
