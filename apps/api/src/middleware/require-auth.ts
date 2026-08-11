import type { FastifyRequest, FastifyReply } from "fastify";
import { UnauthorizedError } from "../lib/http-errors.js";

export async function requireAuth(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  if (!request.user) {
    throw new UnauthorizedError();
  }
}
