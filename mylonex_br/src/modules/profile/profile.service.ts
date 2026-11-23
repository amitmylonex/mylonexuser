import type { PrismaClient } from '@prisma/client';
import type { createSessionVerifier } from '../auth/verify-session.js';
import { BuyerAccessError } from '../auth/access-error.js';
import { profileRepository, type ProfileRecord } from './profile.repository.js';
import type { ProfilePatch } from './profile.schemas.js';
import { avatarStorage } from './profile.avatar.js';

type Services = ReturnType<ReturnType<typeof createSessionVerifier>['configured']>;
export function profileService(db: PrismaClient, storage: ReturnType<typeof avatarStorage>) {
  const repo = profileRepository(db);
  async function serialize(record: ProfileRecord) {
    const { avatarPath, ...buyerProfile } = record.buyerProfile ?? { avatarPath: null };
    return { ...record, buyerProfile: record.buyerProfile ? buyerProfile : null,
      avatarUrl: await storage.url(record.id, avatarPath) };
  }
  return {
    read: async (userId: string) => serialize(await repo.read(userId)),
    async update(userId: string, input: ProfilePatch) {
      if ('state' in input || 'city' in input) {
        const current = await repo.read(userId);
        const state = input.state !== undefined ? input.state : current.buyerProfile?.state;
        const city = input.city !== undefined ? input.city : current.buyerProfile?.city;
        if (city && !state) throw new BuyerAccessError(400, 'Select a state before selecting a city.');
        if (state && !await db.indiaCityState.findFirst({ where: { country: 'India', state, ...(city ? { city } : {}) }, select: { id: true } })) {
          throw new BuyerAccessError(400, 'Choose a valid state and city combination.');
        }
      }
      return serialize(await repo.update(userId, input));
    },
    async upload(userId: string, bytes: Uint8Array) {
      const path = await storage.upload(userId, bytes);
      let previous: string | null;
      try { previous = await repo.replaceAvatar(userId, path); }
      catch (error) { await storage.remove(userId, path); throw error; }
      await storage.remove(userId, previous);
      return serialize(await repo.read(userId));
    },
    async remove(userId: string) {
      const previous = await repo.replaceAvatar(userId, null);
      await storage.remove(userId, previous);
      return serialize(await repo.read(userId));
    },
  };
}

export async function changePassword(services: Services, userId: string, email: string, currentPassword: string, newPassword: string) {
  const client = services.publicClient();
  const failed = () => new BuyerAccessError(400, 'Could not change your password. Check the details and try again.');
  const { data, error } = await client.auth.signInWithPassword({ email, password: currentPassword });
  if (error || !data.session) throw failed();
  try {
    if (data.user?.id !== userId) throw failed();
    const result = await client.auth.updateUser({ password: newPassword });
    if (result.error) throw failed();
  } finally {
    // Revoke the temporary reauthentication session; never persist passwords or tokens.
    await client.auth.signOut({ scope: 'local' });
  }
  return { message: 'Your password has been changed. You may need to sign in again.' };
}
