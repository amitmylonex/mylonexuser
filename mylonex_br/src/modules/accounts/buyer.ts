import { Prisma, type PrismaClient } from '@prisma/client';
import { z } from 'zod';
import type { User } from '@supabase/supabase-js';
import { BuyerAccessError } from '../auth/access-error.js';
import { buyerProfileFields } from './buyer-profile.schema.js';

export const signupIntent = z.object({
  id: z.string(),
  email: z.email(),
  ...buyerProfileFields,
});
type Intent = z.infer<typeof signupIntent>;
export type Identity = { id: string; email: string; intent?: Intent };

export function identityFor(user: User) {
  const parsed = signupIntent.safeParse(user.app_metadata.mylonex_buyer_signup);
  return { id: user.id, email: user.email!.toLowerCase(), intent: parsed.data };
}

const select = {
  id: true, role: true, email: true, fullName: true,
  buyerProfile: { select: { company: true, phone: true, gstNumber: true } },
} satisfies Prisma.UserSelect;

export function readBuyer(db: PrismaClient, id: string) {
  return db.user.findUnique({ where: { id }, select });
}

export function requireBuyerRecord<T extends { role: string }>(user: T | null): T {
  if (!user) throw new BuyerAccessError(403, 'No buyer account is linked to this sign-in. Contact support if you already registered.');
  if (user.role !== 'BUYER') throw new BuyerAccessError(403, 'This account does not have access to the buyer portal.');
  return user;
}

export async function ensureBuyer(db: PrismaClient, identity: Identity) {
  const { id, email, intent } = identity;
  const details = intent?.id === id && intent.email === email ? intent : undefined;
  const profile = details ? { company: details.company, phone: details.phone, gstNumber: details.gstNumber || null } : {};

  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(async tx => {
        const current = await tx.user.findUnique({ where: { id }, select });
        if (current) requireBuyerRecord(current);
        else if (!details) requireBuyerRecord(null);

        if (current?.email !== email) {
          const collision = await tx.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' }, NOT: { id } },
            select: { id: true },
          });
          if (collision) throw new BuyerAccessError(409, 'This email is already linked to another account. Contact support.');
        }

        if (!current) {
          return tx.user.create({
            data: { id, email, role: 'BUYER', fullName: details?.fullName, buyerProfile: { create: profile } },
            select,
          });
        }
        if (current.buyerProfile && current.email === email) return current;
        return tx.user.update({
          where: { id, role: 'BUYER' },
          data: {
            email,
            buyerProfile: current.buyerProfile ? undefined : { create: profile },
          },
          select,
        });
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (attempt < 3 && error instanceof Prisma.PrismaClientKnownRequestError &&
          ['P2002', 'P2034'].includes(error.code)) continue;
      throw error;
    }
  }
}
