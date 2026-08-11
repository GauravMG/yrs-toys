import type { FastifyRequest, FastifyReply } from "fastify";
import { ForbiddenError, UnauthorizedError } from "../lib/http-errors.js";

export async function requireAdmin(request: FastifyRequest, _reply: FastifyReply): Promise<void> {
  if (!request.user) {
    throw new UnauthorizedError();
  }
  if (request.user.role !== "ADMIN") {
    throw new ForbiddenError("Admin access required");
  }
}
