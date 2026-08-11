import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  authResponseSchema,
  authUserSchema,
} from "@yrs/shared";
import { authService } from "./service.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { UnauthorizedError } from "../../lib/http-errors.js";
import { env } from "../../config/env.js";
import { refreshTokenMaxAgeSeconds } from "../../lib/jwt-tokens.js";

// apps/web and apps/admin are two separate frontends that both call this
// same API origin — including, notably, on a developer's or a shop owner's
// own machine where both might reasonably be open in one browser at once
// (e.g. testing a storefront change while also managing orders). A single
// shared cookie name means logging into either app overwrites the other's
// session cookie (same name + domain + path), silently signing the other
// one out. Each app sends its own X-Client-App header (see
// apps/admin/src/lib/api-client.ts) so they get distinct, independently
// rotating refresh cookies instead of clobbering each other.
const REFRESH_COOKIE_WEB = "refresh_token";
const REFRESH_COOKIE_ADMIN = "admin_refresh_token";
const REFRESH_COOKIE_PATH = "/api/v1/auth";
const CLIENT_APP_HEADER = "x-client-app";

function refreshCookieName(request: FastifyRequest): string {
  return request.headers[CLIENT_APP_HEADER] === "admin" ? REFRESH_COOKIE_ADMIN : REFRESH_COOKIE_WEB;
}

export async function registerAuthRoutes(fastify: FastifyInstance) {
  const app = fastify.withTypeProvider<ZodTypeProvider>();
  const service = authService(fastify.prisma);

  function setRefreshCookie(request: FastifyRequest, reply: FastifyReply, token: string) {
    reply.setCookie(refreshCookieName(request), token, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: REFRESH_COOKIE_PATH,
      maxAge: refreshTokenMaxAgeSeconds(),
    });
  }

  app.post(
    "/auth/register",
    { schema: { tags: ["auth"], body: registerSchema, response: { 201: authResponseSchema } } },
    async (request, reply) => {
      const result = await service.register(request.body, request.ip);
      setRefreshCookie(request, reply, result.refreshToken);
      return reply.status(201).send({ user: result.user, accessToken: result.accessToken });
    },
  );

  app.post(
    "/auth/login",
    { schema: { tags: ["auth"], body: loginSchema, response: { 200: authResponseSchema } } },
    async (request, reply) => {
      const result = await service.login(request.body, request.ip);
      setRefreshCookie(request, reply, result.refreshToken);
      return reply.send({ user: result.user, accessToken: result.accessToken });
    },
  );

  app.post(
    "/auth/refresh",
    { schema: { tags: ["auth"], response: { 200: authResponseSchema } } },
    async (request, reply) => {
      const raw = request.cookies[refreshCookieName(request)];
      if (!raw) throw new UnauthorizedError("No refresh token provided");
      const result = await service.refresh(raw, request.ip);
      setRefreshCookie(request, reply, result.refreshToken);
      return reply.send({ user: result.user, accessToken: result.accessToken });
    },
  );

  app.post(
    "/auth/logout",
    { schema: { tags: ["auth"], response: { 204: z.void() } } },
    async (request, reply) => {
      const raw = request.cookies[refreshCookieName(request)];
      if (raw) await service.logout(raw);
      reply.clearCookie(refreshCookieName(request), { path: REFRESH_COOKIE_PATH });
      return reply.status(204).send();
    },
  );

  app.get(
    "/auth/me",
    { preHandler: requireAuth, schema: { tags: ["auth"], response: { 200: authUserSchema } } },
    async (request) => {
      return service.me(request.user!.id);
    },
  );

  app.post(
    "/auth/change-password",
    {
      preHandler: requireAuth,
      schema: { tags: ["auth"], body: changePasswordSchema, response: { 204: z.void() } },
    },
    async (request, reply) => {
      await service.changePassword(request.user!.id, request.body);
      return reply.status(204).send();
    },
  );

  app.post(
    "/auth/forgot-password",
    { schema: { tags: ["auth"], body: forgotPasswordSchema, response: { 204: z.void() } } },
    async (request, reply) => {
      await service.forgotPassword(request.body.email);
      return reply.status(204).send();
    },
  );

  app.post(
    "/auth/reset-password",
    { schema: { tags: ["auth"], body: resetPasswordSchema, response: { 204: z.void() } } },
    async (request, reply) => {
      await service.resetPassword(request.body.token, request.body.newPassword);
      return reply.status(204).send();
    },
  );
}
