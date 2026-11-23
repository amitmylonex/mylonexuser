import type { Prisma, PrismaClient } from '@prisma/client';
import { BuyerAccessError } from '../auth/access-error.js';
import type { ProfilePatch } from './profile.schemas.js';

export const profileSelect = {
  id: true, email: true, role: true, fullName: true, createdAt: true, updatedAt: true,
  buyerProfile: { select: { company: true, phone: true, gstNumber: true, city: true,
    address: true, designation: true, state: true, pincode: true, avatarPath: true, updatedAt: true } },
} satisfies Prisma.UserSelect;
export type ProfileRecord = Prisma.UserGetPayload<{ select: typeof profileSelect }>;
export function profileRepository(db: PrismaClient) {
  return {
    async read(userId: string) {
      const record = await db.user.findUnique({ where: { id: userId }, select: profileSelect });
      if (record?.role !== 'BUYER') throw new BuyerAccessError(403, 'Buyer access is required.');
      return record;
    },
    async update(userId: string, input: ProfilePatch) {
      const { fullName, ...fields } = input;
      return db.user.update({ where: { id: userId, role: 'BUYER' },
        data: { ...(fullName !== undefined ? { fullName } : {}),
          buyerProfile: Object.keys(fields).length ? { upsert: { create: fields, update: fields } } : undefined }, select: profileSelect });
    },
    async replaceAvatar(userId: string, path: string | null) {
      return db.$transaction(async tx => {
        // Serialize avatar replacements across all API instances, without holding locks during upload.
        await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${userId} AND role = 'BUYER' FOR UPDATE`;
        const user = await tx.user.findUnique({ where: { id: userId }, select: { role: true } });
        if (user?.role !== 'BUYER') throw new BuyerAccessError(403, 'Buyer access is required.');
        const previous = await tx.buyerProfile.findUnique({ where: { userId }, select: { avatarPath: true } });
        await tx.buyerProfile.upsert({ where: { userId }, create: { userId, avatarPath: path }, update: { avatarPath: path } });
        return previous?.avatarPath ?? null;
      });
    },
  };
}
