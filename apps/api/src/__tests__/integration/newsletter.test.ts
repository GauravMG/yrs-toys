import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/build-test-app.js";
import { resetDatabase, disconnectTestDb, testPrisma } from "../helpers/test-db.js";

describe("newsletter routes", () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  afterAll(async () => {
    await app.close();
    await disconnectTestDb();
  });

  beforeEach(async () => {
    await resetDatabase();
  });

  it("subscribes a new email and creates a row", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/newsletter/subscribe",
      payload: { email: "subscriber@example.com" },
    });
    expect(res.statusCode).toBe(204);

    const row = await testPrisma.newsletterSubscriber.findUnique({ where: { email: "subscriber@example.com" } });
    expect(row?.isActive).toBe(true);
  });

  it("is idempotent when subscribing the same email twice", async () => {
    await app.inject({ method: "POST", url: "/api/v1/newsletter/subscribe", payload: { email: "dup@example.com" } });
    const second = await app.inject({
      method: "POST",
      url: "/api/v1/newsletter/subscribe",
      payload: { email: "dup@example.com" },
    });
    expect(second.statusCode).toBe(204);

    const rows = await testPrisma.newsletterSubscriber.findMany({ where: { email: "dup@example.com" } });
    expect(rows).toHaveLength(1);
  });

  it("rejects an invalid email", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/newsletter/subscribe",
      payload: { email: "not-an-email" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("unsubscribes an existing email", async () => {
    await app.inject({ method: "POST", url: "/api/v1/newsletter/subscribe", payload: { email: "leaving@example.com" } });

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/newsletter/unsubscribe",
      payload: { email: "leaving@example.com" },
    });
    expect(res.statusCode).toBe(204);

    const row = await testPrisma.newsletterSubscriber.findUnique({ where: { email: "leaving@example.com" } });
    expect(row?.isActive).toBe(false);
  });

  it("is idempotent when unsubscribing an email that was never subscribed", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/newsletter/unsubscribe",
      payload: { email: "never-subscribed@example.com" },
    });
    expect(res.statusCode).toBe(204);
  });

  it("reactivates a previously unsubscribed email on re-subscribe", async () => {
    await app.inject({ method: "POST", url: "/api/v1/newsletter/subscribe", payload: { email: "rejoin@example.com" } });
    await app.inject({ method: "POST", url: "/api/v1/newsletter/unsubscribe", payload: { email: "rejoin@example.com" } });

    const resubscribe = await app.inject({
      method: "POST",
      url: "/api/v1/newsletter/subscribe",
      payload: { email: "rejoin@example.com" },
    });
    expect(resubscribe.statusCode).toBe(204);

    const row = await testPrisma.newsletterSubscriber.findUnique({ where: { email: "rejoin@example.com" } });
    expect(row?.isActive).toBe(true);
  });
});
