import sharp from 'sharp';
import { randomUUID } from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { BuyerAccessError } from '../auth/access-error.js';
import { avatarMime, MAX_AVATAR_BYTES } from './profile.schemas.js';

export async function prepareAvatar(bytes: Uint8Array, mime: string) {
  if (!avatarMime.safeParse(mime).success || !bytes.length || bytes.length > MAX_AVATAR_BYTES) {
    throw new BuyerAccessError(400, 'Choose a JPEG, PNG or WebP image up to 2 MB.');
  }
  try {
    const image = sharp(bytes, { limitInputPixels: 16000000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (!['jpeg', 'png', 'webp'].includes(metadata.format ?? '') || (metadata.pages ?? 1) > 1 ||
      mime !== (metadata.format === 'jpeg' ? 'image/jpeg' : 'image/' + metadata.format)) throw new Error('Invalid format');
    return await image.rotate().resize(256, 256, { fit: 'cover', withoutEnlargement: true }).webp({ quality: 85 }).toBuffer();
  } catch { throw new BuyerAccessError(400, 'This image could not be read. Choose a valid JPEG, PNG or WebP.'); }
}

export function avatarStorage(admin: SupabaseClient, bucket: string, log: (event: string) => void) {
  const store = admin.storage.from(bucket);
  const owned = (id: string, path: string) => path.startsWith(id + '/') && /^[\w-]+\/[\w-]+\.webp$/.test(path);
  return {
    async upload(userId: string, bytes: Uint8Array) {
      const path = `${userId}/${randomUUID()}.webp`;
      const { error } = await store.upload(path, bytes, { contentType: 'image/webp', upsert: false, cacheControl: '3600' });
      if (error) throw new BuyerAccessError(503, 'The photo could not be saved. Please try again.');
      return path;
    },
    async url(userId: string, path: string | null) {
      if (!path || !owned(userId, path)) return null;
      const { data, error } = await store.createSignedUrl(path, 3600);
      if (error) { log('avatar_sign_failed'); return null; }
      return data.signedUrl;
    },
    async remove(userId: string, path: string | null) {
      if (!path || !owned(userId, path)) return;
      const { error } = await store.remove([path]);
      if (error) log('avatar_cleanup_failed');
    },
  };
}
