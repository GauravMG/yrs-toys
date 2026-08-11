import type { PrismaClient } from "@yrs/db";

export function authRepository(prisma: PrismaClient) {
  return {
    findUserByEmail(email: string) {
      return prisma.user.findUnique({ where: { email } });
    },
    findUserById(id: string) {
      return prisma.user.findUnique({ where: { id } });
    },
    createUser(data: { email: string; passwordHash: string; fullName: string; phone?: string }) {
      return prisma.user.create({ data });
    },
    updatePasswordHash(userId: string, passwordHash: string) {
      return prisma.user.update({ where: { id: userId }, data: { passwordHash } });
    },
    createRefreshToken(data: { userId: string; tokenHash: string; expiresAt: Date; createdByIp?: string }) {
      return prisma.refreshToken.create({ data });
    },
    findRefreshTokenByHash(tokenHash: string) {
      return prisma.refreshToken.findUnique({ where: { tokenHash } });
    },
    revokeRefreshToken(id: string, replacedByTokenId?: string) {
      return prisma.refreshToken.update({
        where: { id },
        data: { revokedAt: new Date(), replacedByTokenId },
      });
    },
    revokeAllTokensForUser(userId: string) {
      return prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    },
  };
}
export type AuthRepository = ReturnType<typeof authRepository>;
