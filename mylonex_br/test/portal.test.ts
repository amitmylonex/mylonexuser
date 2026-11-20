import assert from 'node:assert/strict';
import { test } from 'node:test';
import Fastify from 'fastify';
import { registerBuyerAuth } from '../src/modules/auth/routes.js';
import type { createServices } from '../src/infrastructure/services.js';

test('verified roles can only open their own portal API', async () => {
  const app = Fastify();
  let role = 'BUYER';
  let status = 'APPROVED';
  let hasSupplierProfile = true;
  const account = () => ({ id: 'verified-id', email: 'test@example.com', fullName: 'Test', role });
  const services = {
    db: {
      user: { findUnique: async ({ where }: { where: { id: string } }) => {
        assert.equal(where.id, 'verified-id');
        return account();
      } },
      supplierProfile: { findUnique: async ({ where }: { where: { userId: string } }) => {
        assert.equal(where.userId, 'verified-id');
        return hasSupplierProfile ? { companyName: 'Test mill', status } : null;
      } },
      $transaction: async (run: (tx: unknown) => unknown) => {
        assert.equal(role, 'BUYER', 'Only buyers can enter buyer setup');
        return run({ user: { findUnique: async () => ({ ...account(), buyerProfile: { company: 'Buyer mill' } }) } });
      },
    },
    publicClient: () => ({ auth: { getUser: async (token: string) => ({
      data: { user: token === 'fixture' ? { ...account(), role: 'untrusted', email_confirmed_at: 'yes', app_metadata: {} } : null },
      error: null,
    }) } }),
  } as unknown as ReturnType<typeof createServices>['buyerAuth'];
  const headers = { authorization: 'Bearer fixture' };
  try {
    await registerBuyerAuth(app, 'http://localhost:5173', services);
    for (const [method, path] of [
      ['GET', '/auth/session'], ['POST', '/auth/session'], ['POST', '/buyer/session'],
      ['GET', '/buyer/me'], ['GET', '/supplier/me'], ['GET', '/admin/me'],
    ] as const) {
      const url = '/api/v1' + path;
      const missing = await app.inject({ method, url });
      const invalid = await app.inject({ method, url, headers: { authorization: 'Bearer invalid' } });
      assert.equal(missing.statusCode, 401);
      assert.deepEqual(missing.json(), { message: 'Sign in to continue.' });
      assert.equal(invalid.statusCode, 401);
      assert.deepEqual(invalid.json(), { message: 'Sign in with a confirmed email to continue.' });
      assert.equal(missing.headers['cache-control'], 'no-store');
      assert.equal(invalid.headers['cache-control'], 'no-store');
    }
    for (const candidate of ['BUYER', 'SUPPLIER', 'ADMIN']) {
      role = candidate;
      const session = await app.inject({ url: '/api/v1/auth/session', headers });
      assert.equal(session.statusCode, 200);
      assert.equal(session.json().role, role);
      const login = await app.inject({ method: 'POST', url: '/api/v1/auth/session', headers });
      assert.equal(login.statusCode, 200);
      assert.equal(login.json().role, role);
      for (const portal of ['buyer', 'supplier', 'admin']) {
        const url = '/api/v1/' + portal + '/me';
        assert.equal((await app.inject({ url, headers })).statusCode, portal === role.toLowerCase() ? 200 : 403);
        assert.equal((await app.inject({ url })).statusCode, 401);
      }
    }
    role = 'SUPPLIER';
    for (status of ['PENDING', 'APPROVED', 'SUSPENDED']) {
      const response = await app.inject({ url: '/api/v1/supplier/me', headers });
      assert.equal(response.statusCode, 200);
      assert.equal(response.json().supplierProfile.status, status);
    }
    hasSupplierProfile = false;
    const missingProfile = await app.inject({ url: '/api/v1/supplier/me', headers });
    assert.equal(missingProfile.statusCode, 200);
    assert.deepEqual(missingProfile.json(), { ...account(), supplierProfile: null });
  } finally {
    await app.close();
  }
});
