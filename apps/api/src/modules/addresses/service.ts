import type { PrismaClient } from "@yrs/db";
import type { Address, AddressInput } from "@yrs/shared";
import { NotFoundError } from "../../lib/http-errors.js";

type AddressRow = {
  id: string;
  userId: string;
  label: string | null;
  fullName: string;
  phone: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function toAddress(a: AddressRow): Address {
  return {
    id: a.id,
    userId: a.userId,
    label: a.label ?? undefined,
    fullName: a.fullName,
    phone: a.phone,
    line1: a.line1,
    line2: a.line2 ?? undefined,
    city: a.city,
    state: a.state,
    postalCode: a.postalCode,
    country: a.country,
    isDefault: a.isDefault,
    createdAt: a.createdAt.toISOString(),
    updatedAt: a.updatedAt.toISOString(),
  };
}

export function addressService(prisma: PrismaClient) {
  async function getOwned(userId: string, id: string): Promise<AddressRow> {
    const address = await prisma.address.findUnique({ where: { id } });
    if (!address || address.userId !== userId) throw new NotFoundError("Address not found");
    return address;
  }

  return {
    async list(userId: string): Promise<Address[]> {
      const addresses = await prisma.address.findMany({ where: { userId }, orderBy: { createdAt: "asc" } });
      return addresses.map(toAddress);
    },

    async create(userId: string, input: AddressInput): Promise<Address> {
      const existingCount = await prisma.address.count({ where: { userId } });
      const isFirst = existingCount === 0;
      const isDefault = isFirst ? true : (input.isDefault ?? false);

      const created = await prisma.$transaction(async (tx) => {
        if (isDefault) {
          await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
        }
        return tx.address.create({
          data: { ...input, userId, isDefault },
        });
      });
      return toAddress(created);
    },

    async update(userId: string, id: string, input: Partial<AddressInput>): Promise<Address> {
      await getOwned(userId, id);

      const updated = await prisma.$transaction(async (tx) => {
        if (input.isDefault === true) {
          await tx.address.updateMany({
            where: { userId, isDefault: true, id: { not: id } },
            data: { isDefault: false },
          });
        }
        return tx.address.update({ where: { id }, data: input });
      });
      return toAddress(updated);
    },

    async remove(userId: string, id: string): Promise<void> {
      await getOwned(userId, id);
      await prisma.address.delete({ where: { id } });
    },

    async setDefault(userId: string, id: string): Promise<Address> {
      await getOwned(userId, id);
      const updated = await prisma.$transaction(async (tx) => {
        await tx.address.updateMany({
          where: { userId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
        return tx.address.update({ where: { id }, data: { isDefault: true } });
      });
      return toAddress(updated);
    },
  };
}
export type AddressService = ReturnType<typeof addressService>;
