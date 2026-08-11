import fp from "fastify-plugin";
import type { FastifyInstance, FastifyError } from "fastify";
import { ZodError } from "zod";
import { Prisma } from "@yrs/db";
import { HttpError } from "../lib/http-errors.js";

export default fp(async function errorHandlerPlugin(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError | Error, request, reply) => {
    if (error instanceof HttpError) {
      return reply.status(error.statusCode).send({ error: { code: error.code, message: error.message } });
    }

    if (error instanceof ZodError) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: "Invalid request", issues: error.issues },
      });
    }

    // fastify-type-provider-zod attaches a `validation` array to schema errors
    const fastifyErr = error as FastifyError;
    if (fastifyErr.validation) {
      return reply.status(400).send({
        error: { code: "VALIDATION_ERROR", message: error.message, issues: fastifyErr.validation },
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return reply.status(409).send({
          error: { code: "CONFLICT", message: "A record with these unique values already exists" },
        });
      }
      if (error.code === "P2025") {
        return reply.status(404).send({ error: { code: "NOT_FOUND", message: "Record not found" } });
      }
    }

    request.log.error(error);
    return reply.status(500).send({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
  });

  fastify.setNotFoundHandler((_request, reply) => {
    reply.status(404).send({ error: { code: "NOT_FOUND", message: "Route not found" } });
  });
});
