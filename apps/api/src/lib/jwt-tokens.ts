import { randomBytes, createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import type { RoleValue } from "@yrs/shared";
import { env } from "../config/env.js";
import { parseDurationMs } from "./duration.js";

const accessSecret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);

export interface AccessTokenPayload {
  sub: string;
  role: RoleValue;
}

export async function signAccessToken(payload: AccessTokenPayload): Promise<string> {
  return new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_TTL)
    .sign(accessSecret);
}

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { payload } = await jwtVerify(token, accessSecret);
  return { sub: payload.sub as string, role: payload.role as RoleValue };
}

/** Opaque, high-entropy refresh token. Only its SHA-256 hash is persisted. */
export function generateRefreshToken(): { token: string; tokenHash: string } {
  const token = randomBytes(48).toString("base64url");
  return { token, tokenHash: hashRefreshToken(token) };
}

export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function refreshTokenExpiresAt(from: Date = new Date()): Date {
  return new Date(from.getTime() + parseDurationMs(env.JWT_REFRESH_TTL));
}

export function accessTokenMaxAgeSeconds(): number {
  return Math.floor(parseDurationMs(env.JWT_ACCESS_TTL) / 1000);
}

export function refreshTokenMaxAgeSeconds(): number {
  return Math.floor(parseDurationMs(env.JWT_REFRESH_TTL) / 1000);
}
