import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { test } from 'node:test';
import { PrismaClient } from '@prisma/client';
import { buildApp } from '../src/app.js';
import { ensureBuyer } from '../src/modules/accounts/buyer.js';
import { BuyerAccessError } from '../src/modules/auth/access-error.js';

test('buyer endpoints deny anonymous access and reject browser-supplied roles', async () => {
  const app = await buildApp({
    port: 4000, host: '127.0.0.1', frontendOrigin: 'http://localhost:5173', adminOrigin: 'http://localhost:5174',
    supabaseUrl: '', supabaseKey: '', supabaseSecret: '', databaseUrl: '',
  });
  try {
    const catalog = await app.inject({ url: '/api/v1/public/featured-fabrics' });
    assert.equal(catalog.statusCode, 200);
    assert.deepEqual(catalog.json(), { items: [] });
    assert.equal(catalog.headers['cache-control'], undefined);
    const preflight = await app.inject({
      method: 'OPTIONS', url: '/api/v1/auth/session', headers: {
        origin: 'http://localhost:5173',
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'authorization',
      },
    });
    assert.equal(preflight.statusCode, 204);
    assert.equal(preflight.headers['access-control-allow-origin'], 'http://localhost:5173');
    assert.equal(preflight.headers['access-control-allow-methods'], 'GET, POST, PATCH, DELETE, OPTIONS');
    assert.equal(preflight.headers['access-control-allow-headers'], 'authorization');
    for (const origin of ['http://localhost:5174', 'http://localhost:5199']) {
      const response = await app.inject({
        method: 'OPTIONS', url: '/api/v1/admin/rfq-review',
        headers: { origin, 'access-control-request-method': 'GET', 'access-control-request-headers': 'authorization' },
      });
      assert.equal(response.headers['access-control-allow-origin'], origin.endsWith(':5174') ? origin : undefined);
    }
    for (const [method, path] of [['GET', 'me'], ['POST', 'session']] as const) {
      const response = await app.inject({ method, url: '/api/v1/buyer/' + path });
      assert.equal(response.statusCode, 401);
      assert.equal(response.headers['cache-control'], 'no-store');
    }
    const payload = {
      email: 'buyer@example.com', password: 'secret-password', fullName: 'Buyer',
      company: 'Textiles', phone: '12345', agreedToTerms: true,
    };
    for (const invalid of [
      { ...payload, role: 'ADMIN' }, { ...payload, agreedToTerms: false }, { ...payload, fullName: ' ' },
    ]) {
      assert.equal((await app.inject({ method: 'POST', url: '/api/v1/buyer/signup', payload: invalid })).statusCode, 400);
    }
  } finally { await app.close(); }
});

const testUrl = process.env.BUYER_TEST_DATABASE_URL;
test('database enforces identity and role across parallel signup and repair', { skip: !testUrl }, async () => {
  const db = new PrismaClient({ datasourceUrl: testUrl });
  const identities = Array.from({ length: 4 }, () => {
    const id = randomUUID();
    const email = id + '@example.com';
    return { id, email, intent: { id, email, fullName: 'Buyer', company: 'Textiles', phone: '12345' } };
  });
  const [buyer, partial, supplier, admin] = identities;
  const rejectStatus = (status: number) => (error: unknown) => error instanceof BuyerAccessError && error.status === status;
  try {
    await assert.rejects(ensureBuyer(db, { id: buyer.id, email: buyer.email }), rejectStatus(403));
    const results = await Promise.all(Array.from({ length: 4 }, () => ensureBuyer(db, buyer)));
    for (const result of results) {
      assert.equal(result.role, 'BUYER');
      assert.equal(result.buyerProfile?.company, 'Textiles');
    }
    await db.user.create({ data: { id: partial.id, email: partial.email, role: 'BUYER' } });
    await Promise.all(Array.from({ length: 4 }, () => ensureBuyer(db, { id: partial.id, email: partial.email })));
    for (const [account, role] of [[supplier, 'SUPPLIER'], [admin, 'ADMIN']] as const) {
      await db.user.create({ data: { id: account.id, email: account.email, role } });
      await assert.rejects(ensureBuyer(db, account), rejectStatus(403));
      assert.equal((await db.user.findUnique({ where: { id: account.id } }))?.role, role);
    }
    const otherId = randomUUID();
    await assert.rejects(ensureBuyer(db, { id: otherId, email: buyer.email, intent: { ...buyer.intent, id: otherId } }), rejectStatus(409));
    for (const { id } of [buyer, partial]) {
      assert.equal(await db.user.count({ where: { id } }), 1);
      assert.equal(await db.buyerProfile.count({ where: { userId: id } }), 1);
    }
    assert.equal(await db.buyerProfile.count({ where: { userId: { in: [supplier.id, admin.id] } } }), 0);
  } finally {
    await db.user.deleteMany({ where: { id: { in: identities.map(({ id }) => id) } } });
    await db.$disconnect();
  }
});
