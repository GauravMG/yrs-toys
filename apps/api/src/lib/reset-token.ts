import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { env } from "../config/env.js";

const resetSecret = new TextEncoder().encode(`reset:${env.JWT_ACCESS_SECRET}`);

/**
 * Stateless password-reset tokens: no dedicated DB table. The token embeds a
 * fingerprint of the user's CURRENT password hash, so it verifies exactly
 * once — as soon as the password changes (on successful reset, or via
 * change-password), the fingerprint no longer matches and the token is
 * dead, without needing to track/revoke anything in storage.
 */
export function passwordFingerprint(passwordHash: string): string {
  return createHash("sha256").update(passwordHash).digest("hex").slice(0, 24);
}

export async function signResetToken(userId: string, currentPasswordHash: string): Promise<string> {
  return new SignJWT({ fp: passwordFingerprint(currentPasswordHash) })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("30m")
    .sign(resetSecret);
}

/** Verifies signature/expiry only. Caller must separately compare `fp` against `passwordFingerprint(user.passwordHash)`. */
export async function decodeResetToken(token: string): Promise<{ userId: string; fp: string } | null> {
  try {
    const { payload } = await jwtVerify(token, resetSecret);
    return { userId: payload.sub as string, fp: payload.fp as string };
  } catch {
    return null;
  }
}
