import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { browseBuyerCatalog } from '../src/modules/catalog/buyer-browse.js';

test('collection browsing applies eligibility, production filter and bounded previews/counts', async () => {
  const db = { fabricCollection: {
    findMany: async (query: { where: object; take: number; skip: number; select: { catalogEntries: { take: number } } }) => {
      assert.equal(query.take, 12); assert.equal(query.skip, 12); assert.equal(query.select.catalogEntries.take, 1);
      assert.deepEqual(query.where, { isArchived: false, supplier: { status: 'APPROVED' }, catalogEntries: { some: { isActive: true, supplier: { status: 'APPROVED' }, productionCycle: 'ready_stock' } } });
      return [{ id: 'collection' }];
    }, count: async () => 25,
  }, $transaction: async (queries: Promise<unknown>[]) => Promise.all(queries) } as unknown as PrismaClient;
  const result = await browseBuyerCatalog(db, { mode: 'collection', type: 'ready_stock', page: 2 });
  assert.equal(result.totalPages, 3); assert.equal(result.total, 25);
});

test('legacy API defaults still return individual fabrics with shade choices', async () => {
  const db = { supplierCatalog: {
    findMany: async (query: { where: object; take: number }) => {
      assert.deepEqual(query.where, { isActive: true, supplier: { status: 'APPROVED' } });
      assert.equal(query.take, 12);
      return [{ id: 'fabric', supplierId: 'internal', shadeVariants: [], fabricName: 'Twill' }];
    }, count: async () => 1,
  }, $transaction: async (queries: Promise<unknown>[]) => Promise.all(queries) } as unknown as PrismaClient;
  const result = await browseBuyerCatalog(db, {});
  assert.equal(result.mode, 'fabric');
  assert.deepEqual(result.items, [{ id: 'fabric', fabricName: 'Twill', shades: [] }]);
});

test('invalid filters and unavailable collections fail without exposing catalog records', async () => {
  for (const input of [{ page: 0 }, { page: 10001 }, { type: 'invalid' }, { mode: 'invalid' }, { collectionId: 'invalid' }]) {
    await assert.rejects(browseBuyerCatalog({} as PrismaClient, input), error => (error as { status: number }).status === 400);
  }
  const db = { fabricCollection: { findFirst: async () => null } } as unknown as PrismaClient;
  await assert.rejects(browseBuyerCatalog(db, { mode: 'fabric', collectionId: '00000000-0000-4000-8000-000000000001' }), error => (error as { status: number }).status === 404);
});
