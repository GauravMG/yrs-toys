import fp from "fastify-plugin";
import type { FastifyInstance, FastifyRequest } from "fastify";
import type { RoleValue } from "@yrs/shared";
import { verifyAccessToken } from "../lib/jwt-tokens.js";

export interface RequestUser {
  id: string;
  role: RoleValue;
}

declare module "fastify" {
  interface FastifyRequest {
    user: RequestUser | null;
  }
}

/**
 * Populates `request.user` from the Authorization Bearer access token on
 * every request, without rejecting unauthenticated ones — route-level
 * enforcement happens in src/middleware/require-auth.ts and
 * require-admin.ts. This lets public routes (e.g. product listing) still
 * see an optional logged-in user when present.
 */
export default fp(async function jwtPlugin(fastify: FastifyInstance) {
  fastify.decorateRequest("user", null);

  fastify.addHook("onRequest", async (request: FastifyRequest) => {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) return;
    const token = header.slice("Bearer ".length);
    try {
      const payload = await verifyAccessToken(token);
      request.user = { id: payload.sub, role: payload.role };
    } catch {
      request.user = null;
    }
  });
});
