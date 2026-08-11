import type { PrismaClient } from "@yrs/db";
import type { AuthResponse, AuthUser, RegisterInput, LoginInput, ChangePasswordInput } from "@yrs/shared";
import { authRepository } from "./repository.js";
import { hashPassword, verifyPassword } from "../../lib/argon2.js";
import {
  signAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  refreshTokenExpiresAt,
} from "../../lib/jwt-tokens.js";
import { signResetToken, decodeResetToken, passwordFingerprint } from "../../lib/reset-token.js";
import { sendMail } from "../../email/mailer.js";
import { passwordResetEmail } from "../../email/templates/password-reset.js";
import { ConflictError, UnauthorizedError, BadRequestError } from "../../lib/http-errors.js";
import { env } from "../../config/env.js";

function toAuthUser(user: { id: string; email: string; fullName: string; phone: string | null; role: "CUSTOMER" | "ADMIN" }): AuthUser {
  return { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, role: user.role };
}

export function authService(prisma: PrismaClient) {
  const repo = authRepository(prisma);

  async function issueTokenPair(userId: string, role: "CUSTOMER" | "ADMIN", ip?: string) {
    const accessToken = await signAccessToken({ sub: userId, role });
    const { token: refreshToken, tokenHash } = generateRefreshToken();
    await repo.createRefreshToken({
      userId,
      tokenHash,
      expiresAt: refreshTokenExpiresAt(),
      createdByIp: ip,
    });
    return { accessToken, refreshToken };
  }

  return {
    async register(input: RegisterInput, ip?: string): Promise<AuthResponse & { refreshToken: string }> {
      const existing = await repo.findUserByEmail(input.email);
      if (existing) throw new ConflictError("An account with this email already exists");

      const passwordHash = await hashPassword(input.password);
      const user = await repo.createUser({
        email: input.email,
        passwordHash,
        fullName: input.fullName,
        phone: input.phone,
      });

      const { accessToken, refreshToken } = await issueTokenPair(user.id, user.role, ip);
      return { user: toAuthUser(user), accessToken, refreshToken };
    },

    async login(input: LoginInput, ip?: string): Promise<AuthResponse & { refreshToken: string }> {
      const user = await repo.findUserByEmail(input.email);
      if (!user) throw new UnauthorizedError("Invalid email or password");

      const valid = await verifyPassword(user.passwordHash, input.password);
      if (!valid) throw new UnauthorizedError("Invalid email or password");

      const { accessToken, refreshToken } = await issueTokenPair(user.id, user.role, ip);
      return { user: toAuthUser(user), accessToken, refreshToken };
    },

    async refresh(rawToken: string, ip?: string): Promise<AuthResponse & { refreshToken: string }> {
      const tokenHash = hashRefreshToken(rawToken);
      const existing = await repo.findRefreshTokenByHash(tokenHash);
      if (!existing) throw new UnauthorizedError("Invalid refresh token");

      if (existing.revokedAt || existing.expiresAt < new Date()) {
        // Reuse of an already-rotated/expired token is a signal of theft —
        // revoke the whole chain for this user so a stolen token can't be
        // replayed even after rotation.
        await repo.revokeAllTokensForUser(existing.userId);
        throw new UnauthorizedError("Refresh token is no longer valid");
      }

      const user = await repo.findUserById(existing.userId);
      if (!user) throw new UnauthorizedError("Invalid refresh token");

      const accessToken = await signAccessToken({ sub: user.id, role: user.role });
      const { token: newRefreshToken, tokenHash: newHash } = generateRefreshToken();
      const created = await repo.createRefreshToken({
        userId: user.id,
        tokenHash: newHash,
        expiresAt: refreshTokenExpiresAt(),
        createdByIp: ip,
      });
      await repo.revokeRefreshToken(existing.id, created.id);

      return { user: toAuthUser(user), accessToken, refreshToken: newRefreshToken };
    },

    async logout(rawToken: string): Promise<void> {
      const tokenHash = hashRefreshToken(rawToken);
      const existing = await repo.findRefreshTokenByHash(tokenHash);
      if (existing && !existing.revokedAt) {
        await repo.revokeRefreshToken(existing.id);
      }
    },

    async me(userId: string): Promise<AuthUser> {
      const user = await repo.findUserById(userId);
      if (!user) throw new UnauthorizedError();
      return toAuthUser(user);
    },

    async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
      const user = await repo.findUserById(userId);
      if (!user) throw new UnauthorizedError();

      const valid = await verifyPassword(user.passwordHash, input.currentPassword);
      if (!valid) throw new BadRequestError("Current password is incorrect");

      const newHash = await hashPassword(input.newPassword);
      await repo.updatePasswordHash(userId, newHash);
      await repo.revokeAllTokensForUser(userId);
    },

    async forgotPassword(email: string): Promise<void> {
      const user = await repo.findUserByEmail(email);
      // Deliberately silent on unknown emails to avoid account enumeration.
      if (!user) return;

      const token = await signResetToken(user.id, user.passwordHash);
      const resetUrl = `${env.CORS_ORIGIN_WEB}/reset-password?token=${encodeURIComponent(token)}`;
      const { subject, html } = passwordResetEmail({ fullName: user.fullName, resetUrl });
      await sendMail({ to: user.email, subject, html });
    },

    async resetPassword(token: string, newPassword: string): Promise<void> {
      const decoded = await decodeResetToken(token);
      if (!decoded) throw new BadRequestError("This reset link is invalid or has expired");

      const user = await repo.findUserById(decoded.userId);
      if (!user) throw new BadRequestError("This reset link is invalid or has expired");

      if (passwordFingerprint(user.passwordHash) !== decoded.fp) {
        throw new BadRequestError("This reset link has already been used");
      }

      const newHash = await hashPassword(newPassword);
      await repo.updatePasswordHash(user.id, newHash);
      await repo.revokeAllTokensForUser(user.id);
    },
  };
}
export type AuthService = ReturnType<typeof authService>;
