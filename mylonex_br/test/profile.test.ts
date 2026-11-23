import assert from 'node:assert/strict';
import { test } from 'node:test';
import Fastify from 'fastify';
import sharp from 'sharp';
import type { PrismaClient } from '@prisma/client';
import type { createServices } from '../src/infrastructure/services.js';
import { createSessionVerifier } from '../src/modules/auth/verify-session.js';
import { registerProfileRoutes } from '../src/modules/profile/profile.routes.js';
import { profileRepository } from '../src/modules/profile/profile.repository.js';
import { profileService, changePassword } from '../src/modules/profile/profile.service.js';
import { profilePatch } from '../src/modules/profile/profile.schemas.js';
import { prepareAvatar } from '../src/modules/profile/profile.avatar.js';
import { profileRateLimit } from '../src/modules/profile/profile.rate-limit.js';

function fixture() {
  let role = 'BUYER';
  const updates: unknown[] = [];
  const record = { id: 'buyer-id', email: 'buyer@example.com', fullName: 'Buyer', role: 'BUYER', createdAt: new Date(), updatedAt: new Date(),
    buyerProfile: { company: 'Company', phone: null, designation: null, gstNumber: null, address: 'Existing address', state: null, city: null, pincode: null, avatarPath: null, updatedAt: new Date() } };
  const db = {
    $queryRaw: async () => [{ attempts: 1 }],
    user: {
      findUnique: async ({ where }: { where: { id: string } }) => { assert.equal(where.id, 'buyer-id'); return { ...record, role }; },
      update: async ({ where, data }: { where: { id: string; role: string }; data: { fullName?: string; buyerProfile?: { upsert: { update: object } } } }) => {
        assert.deepEqual(where, { id: 'buyer-id', role: 'BUYER' }); updates.push(data);
        if (data.fullName) record.fullName = data.fullName;
        Object.assign(record.buyerProfile, data.buyerProfile?.upsert.update);
        return record;
      },
    },
    indiaCityState: { findFirst: async ({ where }: { where: { state: string; city: string } }) => where.state === 'Gujarat' && where.city === 'Surat' ? { id: 'city' } : null },
  } as unknown as PrismaClient;
  const services = {
    db,
    admin: { storage: { from: () => ({ createSignedUrl: async () => ({ data: { signedUrl: 'https://storage.example/signed' } }) }) } },
    publicClient: () => ({ auth: { getUser: async (token: string) => ({ data: { user: token === 'valid' ? {
      id: 'buyer-id', email: 'buyer@example.com', email_confirmed_at: 'yes', app_metadata: {},
    } : null }, error: null }) } }),
  } as unknown as ReturnType<typeof createServices>['buyerAuth'];
  return { db, record, updates, services, setRole: (value: string) => { role = value; } };
}

test('profile routes reject anonymous, foreign origins and non-buyers on every action', async () => {
  const f = fixture(), app = Fastify();
  await registerProfileRoutes(app, createSessionVerifier(f.services), 'http://localhost:5173');
  try {
    for (const [method, url] of [['GET', '/me'], ['PATCH', '/me/profile'], ['POST', '/me/avatar'], ['DELETE', '/me/avatar'], ['POST', '/me/password']] as const) {
      const response = await app.inject({ method, url: '/api/v1' + url });
      assert.equal(response.statusCode, 401);
      assert.equal(response.headers['cache-control'], 'no-store');
      for (const role of ['SUPPLIER', 'ADMIN']) {
        f.setRole(role);
        assert.equal((await app.inject({ method, url: '/api/v1' + url, headers: { authorization: 'Bearer valid' } })).statusCode, 403);
      }
    }
    assert.equal((await app.inject({ url: '/api/v1/me', headers: { authorization: 'Bearer valid', origin: 'https://foreign.example' } })).statusCode, 403);
  } finally { await app.close(); }
});

test('profile APIs derive identity from the token and reject protected fields and invalid contact data', async () => {
  const f = fixture(), app = Fastify();
  await registerProfileRoutes(app, createSessionVerifier(f.services), 'http://localhost:5173');
  const headers = { authorization: 'Bearer valid' };
  try {
    for (const payload of [{ userId: 'victim', fullName: 'Other' }, { id: 'victim' }, { email: 'other@example.com' }, { role: 'ADMIN' },
      { avatarPath: 'victim/photo.webp' }, { phone: '123' }, { pincode: '012345' }, { gstNumber: 'wrong' }, {}]) {
      assert.equal((await app.inject({ method: 'PATCH', url: '/api/v1/me/profile', headers, payload })).statusCode, 400);
    }
    assert.equal(f.updates.length, 0);
    const result = await app.inject({ method: 'PATCH', url: '/api/v1/me/profile', headers, payload: { fullName: 'Updated Name', company: 'New company', phone: '+919876543210', state: 'Gujarat', city: 'Surat', pincode: '395001' } });
    assert.equal(result.statusCode, 200);
    assert.equal(result.json().fullName, 'Updated Name');
    assert.equal(result.json().buyerProfile.address, 'Existing address');
    assert.equal(result.json().buyerProfile.phone, '+919876543210');
    assert.equal(result.json().buyerProfile.avatarPath, undefined);
    assert.equal(result.json().email, 'buyer@example.com');
    assert.equal((await app.inject({ method: 'PATCH', url: '/api/v1/me/profile', headers, payload: { state: 'Gujarat', city: 'Delhi' } })).statusCode, 400);
  } finally { await app.close(); }
});

test('partial profile updates preserve omitted fields and explicitly allow clearing optional fields', async () => {
  assert.equal(profilePatch.parse({ phone: '+91 98765-43210' }).phone, '+919876543210');
  const f = fixture();
  await profileRepository(f.db).update('buyer-id', profilePatch.parse({ designation: 'Owner', gstNumber: null }));
  assert.equal(f.record.buyerProfile.address, 'Existing address');
  assert.equal(f.record.email, 'buyer@example.com');
  assert.equal(f.record.buyerProfile.designation, 'Owner');
  assert.equal(f.record.fullName, 'Buyer');
});

test('avatar validation rejects spoofed MIME, oversize, SVG, corrupt bytes and removes image metadata', async () => {
  const image = await sharp({ create: { width: 32, height: 40, channels: 3, background: '#123456' } }).png().toBuffer();
  const output = await prepareAvatar(image, 'image/png');
  const meta = await sharp(output).metadata();
  assert.equal(meta.format, 'webp');
  assert.equal(meta.exif, undefined);
  for (const [bytes, mime] of [[image, 'image/jpeg'], [image, 'image/svg+xml'], [Buffer.from('bad'), 'image/png'], [Buffer.alloc(2097153), 'image/png']] as const) {
    await assert.rejects(prepareAvatar(bytes, mime), error => (error as { status: number }).status === 400);
  }
});

test('avatar upload removes the new object if the database write fails', async () => {
  const removed: string[] = [];
  const db = { $transaction: async () => { throw new Error('database unavailable'); } } as unknown as PrismaClient;
  const storage = { upload: async () => 'buyer-id/new.webp', url: async () => null, remove: async (_id: string, path: string | null) => { if (path) removed.push(path); } };
  await assert.rejects(profileService(db, storage).upload('buyer-id', Buffer.from('prepared')));
  assert.deepEqual(removed, ['buyer-id/new.webp']);
});

test('shared rate limit fails closed after the database refuses an attempt', async () => {
  const db = { $queryRaw: async () => [] } as unknown as PrismaClient;
  await assert.rejects(profileRateLimit(db, 'buyer-id', 'password'), error => (error as { status: number }).status === 429);
});

test('password change requires successful provider reauthentication for the same user', async () => {
  for (const mode of ['invalid', 'wrong-user', 'valid']) {
    let updated = false, revoked = false;
    const services = { publicClient: () => ({ auth: {
      signInWithPassword: async (input: { email: string; password: string }) => {
        assert.deepEqual(input, { email: 'buyer@example.com', password: 'current-password' });
        return { data: { session: mode === 'invalid' ? null : {}, user: { id: mode === 'wrong-user' ? 'victim' : 'buyer-id' } }, error: mode === 'invalid' ? {} : null };
      },
      updateUser: async (input: { password: string }) => { updated = true; assert.equal(input.password, 'new-password-long'); return { error: null }; },
      signOut: async () => { revoked = true; return { error: null }; },
    } }) } as unknown as NonNullable<ReturnType<typeof createServices>['buyerAuth']>;
    if (mode === 'valid') { await changePassword(services, 'buyer-id', 'buyer@example.com', 'current-password', 'new-password-long'); assert.ok(updated && revoked); }
    else { await assert.rejects(changePassword(services, 'buyer-id', 'buyer@example.com', 'current-password', 'new-password-long')); assert.equal(updated, false); }
  }
});
