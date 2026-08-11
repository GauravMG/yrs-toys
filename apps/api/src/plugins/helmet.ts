import fp from "fastify-plugin";
import helmet from "@fastify/helmet";
import type { FastifyInstance } from "fastify";

export default fp(async function helmetPlugin(fastify: FastifyInstance) {
  await fastify.register(helmet, {
    // The API serves JSON + uploaded product images, no HTML templates of
    // its own, so a strict default CSP would only get in the way with no
    // benefit — disabled here and left to the frontends serving HTML.
    contentSecurityPolicy: false,
    // This API is deliberately consumed cross-origin by two separate
    // frontends (apps/web, apps/admin) on different ports/domains, and its
    // /uploads/* product images are meant to be embedded in <img> tags on
    // both of them. Helmet's default `same-origin` Cross-Origin-Resource-
    // Policy silently blocks exactly that — the image request succeeds at
    // the network level but the browser refuses to render it. "cross-origin"
    // is the correct policy for a public asset/API host like this one.
    crossOriginResourcePolicy: { policy: "cross-origin" },
  });
});
