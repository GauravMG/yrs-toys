import type { PrismaClient } from "@yrs/db";
import type { AuthUser, UpdateProfileInput } from "@yrs/shared";

function toAuthUser(user: {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  role: "CUSTOMER" | "ADMIN";
}): AuthUser {
  return { id: user.id, email: user.email, fullName: user.fullName, phone: user.phone, role: user.role };
}

export function userService(prisma: PrismaClient) {
  return {
    async updateProfile(userId: string, input: UpdateProfileInput): Promise<AuthUser> {
      const user = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(input.fullName !== undefined ? { fullName: input.fullName } : {}),
          ...(input.phone !== undefined ? { phone: input.phone } : {}),
        },
      });
      return toAuthUser(user);
    },
  };
}
export type UserService = ReturnType<typeof userService>;
