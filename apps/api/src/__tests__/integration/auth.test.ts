import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildTestApp } from "../helpers/build-test-app.js";
import { resetDatabase, disconnectTestDb, testPrisma } from "../helpers/test-db.js";
import { createTestUser, createTestAdmin, loginTestUser, authHeader } from "../helpers/factories.js";

describe("auth routes", () => {
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

  it("registers a new user and returns an access token + refresh cookie", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email: "new@example.com", password: "Password@123", fullName: "New User" },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.user.email).toBe("new@example.com");
    expect(body.accessToken).toBeTypeOf("string");
    expect(res.cookies.some((c) => c.name === "refresh_token")).toBe(true);
  });

  it("rejects registering an already-used email", async () => {
    await createTestUser(testPrisma, { email: "dup@example.com" });
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email: "dup@example.com", password: "Password@123", fullName: "Dup User" },
    });
    expect(res.statusCode).toBe(409);
  });

  it("rejects a weak password on register", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/register",
      payload: { email: "weak@example.com", password: "weak", fullName: "Weak Pw" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("logs in with correct credentials", async () => {
    const { user, password } = await createTestUser(testPrisma, { email: "login@example.com" });
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: user.email, password },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().user.email).toBe("login@example.com");
  });

  it("rejects login with wrong password", async () => {
    const { user } = await createTestUser(testPrisma, { email: "wrong@example.com" });
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: user.email, password: "NotThePassword@1" },
    });
    expect(res.statusCode).toBe(401);
  });

  it("returns the current user from /auth/me with a valid access token", async () => {
    const { user, password } = await createTestUser(testPrisma, { email: "me@example.com" });
    const { accessToken } = await loginTestUser(app, user.email, password);
    const res = await app.inject({
      method: "GET",
      url: "/api/v1/auth/me",
      headers: authHeader(accessToken),
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().email).toBe("me@example.com");
  });

  it("rejects /auth/me without a token", async () => {
    const res = await app.inject({ method: "GET", url: "/api/v1/auth/me" });
    expect(res.statusCode).toBe(401);
  });

  it("rotates the refresh token and issues a new access token via /auth/refresh", async () => {
    const { user, password } = await createTestUser(testPrisma, { email: "refresh@example.com" });
    const { refreshCookie } = await loginTestUser(app, user.email, password);

    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: { cookie: refreshCookie },
    });
    expect(res.statusCode).toBe(200);
    const newCookie = res.cookies.find((c) => c.name === "refresh_token");
    expect(newCookie).toBeDefined();
    expect(`refresh_token=${newCookie!.value}`).not.toBe(refreshCookie);
  });

  it("revokes the whole chain when a rotated (used) refresh token is replayed", async () => {
    const { user, password } = await createTestUser(testPrisma, { email: "reuse@example.com" });
    const { refreshCookie } = await loginTestUser(app, user.email, password);

    // First use rotates it successfully.
    const first = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: { cookie: refreshCookie },
    });
    expect(first.statusCode).toBe(200);
    const rotatedCookie = first.cookies.find((c) => c.name === "refresh_token")!;

    // Replaying the ORIGINAL (now-revoked) token should fail...
    const replay = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: { cookie: refreshCookie },
    });
    expect(replay.statusCode).toBe(401);

    // ...and should have revoked the rotated token too (whole chain killed).
    const afterReuse = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: { cookie: `refresh_token=${rotatedCookie.value}` },
    });
    expect(afterReuse.statusCode).toBe(401);
  });

  it("logs out and revokes the refresh token", async () => {
    const { user, password } = await createTestUser(testPrisma, { email: "logout@example.com" });
    const { refreshCookie } = await loginTestUser(app, user.email, password);

    const logoutRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/logout",
      headers: { cookie: refreshCookie },
    });
    expect(logoutRes.statusCode).toBe(204);

    const refreshAfterLogout = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: { cookie: refreshCookie },
    });
    expect(refreshAfterLogout.statusCode).toBe(401);
  });

  it("changes password and revokes existing sessions", async () => {
    const { user, password } = await createTestUser(testPrisma, { email: "change@example.com" });
    const { accessToken, refreshCookie } = await loginTestUser(app, user.email, password);

    const changeRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/change-password",
      headers: authHeader(accessToken),
      payload: { currentPassword: password, newPassword: "NewPassword@123" },
    });
    expect(changeRes.statusCode).toBe(204);

    const refreshRes = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: { cookie: refreshCookie },
    });
    expect(refreshRes.statusCode).toBe(401);

    const loginWithNew = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: user.email, password: "NewPassword@123" },
    });
    expect(loginWithNew.statusCode).toBe(200);
  });

  it("gives apps/web and apps/admin independent refresh cookies so one login doesn't sign the other out", async () => {
    // Regression test: apps/web and apps/admin both call this same API
    // origin, so without distinct cookie names, a customer login/register
    // in one browser tab and an admin login in another would clobber the
    // same `refresh_token` cookie (same name+domain+path) and silently
    // sign the other one out. The admin app sends `X-Client-App: admin` on
    // every request specifically so the two get separate cookies.
    const { user: customer, password: customerPassword } = await createTestUser(testPrisma, { email: "web-user@example.com" });
    const { user: admin, password: adminPassword } = await createTestAdmin(testPrisma);

    const webLogin = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      payload: { email: customer.email, password: customerPassword },
    });
    const webCookie = webLogin.cookies.find((c) => c.name === "refresh_token");
    expect(webCookie).toBeDefined();

    const adminLogin = await app.inject({
      method: "POST",
      url: "/api/v1/auth/login",
      headers: { "x-client-app": "admin" },
      payload: { email: admin.email, password: adminPassword },
    });
    const adminCookie = adminLogin.cookies.find((c) => c.name === "admin_refresh_token");
    expect(adminCookie).toBeDefined();
    expect(adminCookie!.value).not.toBe(webCookie!.value);

    // Both refresh independently afterwards — neither login invalidated the other's cookie.
    const webRefresh = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: { cookie: `refresh_token=${webCookie!.value}` },
    });
    expect(webRefresh.statusCode).toBe(200);
    expect(webRefresh.json().user.email).toBe(customer.email);

    const adminRefresh = await app.inject({
      method: "POST",
      url: "/api/v1/auth/refresh",
      headers: { cookie: `admin_refresh_token=${adminCookie!.value}`, "x-client-app": "admin" },
    });
    expect(adminRefresh.statusCode).toBe(200);
    expect(adminRefresh.json().user.email).toBe(admin.email);
  });

  it("does not reveal whether an email exists on forgot-password", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/api/v1/auth/forgot-password",
      payload: { email: "doesnotexist@example.com" },
    });
    expect(res.statusCode).toBe(204);
  });
});
