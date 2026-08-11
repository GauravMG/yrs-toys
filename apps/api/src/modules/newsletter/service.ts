import type { PrismaClient } from "@yrs/db";

export function newsletterService(prisma: PrismaClient) {
  return {
    async subscribe(email: string): Promise<void> {
      await prisma.newsletterSubscriber.upsert({
        where: { email },
        create: { email, isActive: true },
        update: { isActive: true },
      });
    },

    async unsubscribe(email: string): Promise<void> {
      await prisma.newsletterSubscriber.updateMany({ where: { email }, data: { isActive: false } });
    },
  };
}
export type NewsletterService = ReturnType<typeof newsletterService>;
