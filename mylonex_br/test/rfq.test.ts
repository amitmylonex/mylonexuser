import { test } from 'node:test';
import assert from 'node:assert/strict';
import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { registerRfqRoutes } from '../src/modules/rfqs/routes.js';
import { createSessionVerifier } from '../src/modules/auth/verify-session.js';
import { seedRfqFixture } from './rfq-fixture.js';

const url = process.env.RFQ_TEST_DATABASE_URL;
test('catalog RFQ requires forwarding and quote release, with record ownership and revision checks', { skip: !url }, async () => {
  if (new URL(url!).hostname !== '127.0.0.1' || !new URL(url!).pathname.endsWith('_test')) throw new Error('Use a disposable loopback test database');
  const db = new PrismaClient({ datasourceUrl: url });
  const app = Fastify();
  try {
    const { ids, fabricId } = await seedRfqFixture(db);
    await registerRfqRoutes(app, createSessionVerifier({
      db,
      publicClient: () => ({ auth: { getUser: async (token: keyof typeof ids) => ({
        data: { user: ids[token] ? { id: ids[token], email: token + '@rfq.example', email_confirmed_at: 'confirmed' } : null },
        error: null,
      }) } }),
    } as unknown as Parameters<typeof createSessionVerifier>[0]));
    const call = (actor: string, path: string, payload?: object) => app.inject({
      method: payload ? 'POST' : 'GET', url: '/api/v1' + path, headers: { authorization: 'Bearer ' + actor }, payload,
    });
    try {
      const payload = { selectedPath: 'production', fabricId, quantity: 100, deliveryPincode: '395001', contactPhone: '0000000000' };
      assert.equal((await call('buyer', '/buyer/inquiries/from-fabric', { ...payload, quantity: 99 })).statusCode, 400);
      const created = await call('buyer', '/buyer/inquiries/from-fabric', payload);
      assert.equal(created.statusCode, 201, created.body);
      const inquiry = '/buyer/inquiries/' + created.json().id;
      const awaiting = (await call('buyer', '/buyer/inquiries?status=awaiting&q=fixture+twill')).json();
      assert.equal(awaiting.filteredTotal, 1);
      assert.equal(awaiting.totals.awaiting, 1);
      assert.equal(awaiting.items[0].quoteCount, 0);
      const pending = (await call('admin', '/admin/rfq-review')).json();
      const match = pending.matches.find((m: { communicationRequest: { id: string } }) => m.communicationRequest.id === created.json().id);
      const matchPath = '/supplier/inquiries/' + match.id;
      assert.equal((await call('supplier', matchPath)).statusCode, 404);
      assert.equal((await call('supplier', '/admin/rfq-review/matches/' + match.id, { decision: 'approve' })).statusCode, 403);
      assert.equal((await call('admin', '/admin/rfq-review/matches/' + match.id, { decision: 'approve' })).statusCode, 200);
      assert.equal((await call('supplier', matchPath)).statusCode, 200);
      assert.equal((await call('other', matchPath)).statusCode, 404);
      const quote = { price: 55, leadTimeDays: 10, moq: 100, dispatchLocation: 'Surat' };
      assert.equal((await call('other', matchPath + '/quote', quote)).statusCode, 404);
      const submitted = await Promise.all([call('supplier', matchPath + '/quote', quote), call('supplier', matchPath + '/quote', quote)]);
      assert.deepEqual(submitted.map(result => result.statusCode).sort(), [201, 409], submitted.map(result => result.body).join(', '));
      assert.deepEqual((await call('buyer', inquiry)).json().quotes, []);
      assert.equal((await call('buyer', '/buyer/inquiries?status=quoted')).json().filteredTotal, 0);
      const reviewPath = '/admin/rfq-review/quotes/' + submitted.find(result => result.statusCode === 201)!.json().id;
      assert.equal((await call('admin', reviewPath, { decision: 'reject' })).statusCode, 200);
      const revised = await call('supplier', matchPath + '/quote', { ...quote, price: 53 });
      assert.equal(revised.statusCode, 201, revised.body);
      assert.equal(revised.json().submissionRevision, 2);
      assert.equal((await call('admin', reviewPath, { decision: 'approve' })).statusCode, 200);
      assert.equal((await call('buyer', inquiry)).json().quotes[0].price, '53');
      const quoted = (await call('buyer', '/buyer/inquiries?status=quoted&q=' + created.json().rfqNumber)).json();
      assert.equal(quoted.filteredTotal, 1);
      assert.equal(quoted.totals.quoted, 1);
      assert.equal(quoted.items[0].bestQuote.price, '53');
      const secondPage = (await call('buyer', '/buyer/inquiries?page=2')).json();
      assert.deepEqual(secondPage.items, []);
      assert.equal(secondPage.totals.total, 1);
      await db.supplierProfile.update({ where: { userId: ids.supplier }, data: { status: 'SUSPENDED' } });
      assert.equal((await call('supplier', matchPath)).statusCode, 404);
    } finally {
      await db.user.deleteMany({ where: { id: { in: Object.values(ids) } } });
    }
  } finally {
    await app.close();
    await db.$disconnect();
  }
});
