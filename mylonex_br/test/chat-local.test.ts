import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { PrismaClient } from '@prisma/client';
import { localAssistant } from '../src/modules/chat/local-assistant.js';
import { sourcingIntent } from '../src/modules/chat/local-intent.js';

test('local inquiry replies are scoped to the buyer and include real released quote counts', async () => {
  const db = { communicationRequest: { findMany: async (query: { where: object }) => {
    assert.deepEqual(query.where, { buyerId: 'buyer-a', requesterRole: 'BUYER' });
    return [{ id: 'inquiry-id', rfqNumber: 'RFQ-001', fabricName: 'Cotton', quantity: 500, status: 'pending', _count: { matches: 2 } }];
  } } } as unknown as PrismaClient;
  const result = await localAssistant(db, 'buyer-a', 'Check my inquiries and quote responses', []);
  assert.match(result!.content, /RFQ-001/);
  assert.match(result!.content, /released quotes: 2/);
  assert.deepEqual(result!.metadata.inquiries, [{ id: 'inquiry-id', rfqNumber: 'RFQ-001', fabricName: 'Cotton' }]);
});

test('local fabric search retains approved-only tools and explicit specifications', async () => {
  const db = { supplierCatalog: { findMany: async (query: { where: { AND: unknown[] }; take: number }) => {
    assert.equal(query.take, 6);
    assert.deepEqual(query.where.AND[0], { isActive: true, supplier: { status: 'APPROVED' } });
    assert.ok(JSON.stringify(query.where).includes('140'));
    return [];
  } } } as unknown as PrismaClient;
  const result = await localAssistant(db, 'buyer', 'Show cotton twill fabrics with GSM between 140 and 200', []);
  assert.deepEqual(result!.metadata.requirement, { fiberType: 'Cotton', weave: 'Twill', gsmMin: 140, gsmMax: 200 });
  assert.match(result!.content, /No active catalog/);
});

test('RFQ specs accumulate across numeric follow-ups without guessing missing values', () => {
  const first = sourcingIntent('Need cotton twill 150 GSM', []);
  assert.deepEqual(first.requirement, { fiberType: 'Cotton', weave: 'Twill', gsmMin: 150, gsmMax: 150 });
  const next = sourcingIntent('500 meters, width 58 inches', [{ role: 'assistant', content: 'Noted', metadata: { requirement: first.requirement } }]);
  assert.deepEqual(next.requirement, { ...first.requirement, quantity: 500, width: 58 });
  assert.deepEqual(sourcingIntent('Need polyester', [{ role: 'assistant', content: '', metadata: { requirement: next.requirement } }]).requirement, { fiberType: 'Polyester' });
  assert.equal(sourcingIntent('cotton 65/35, 40x40, 120x80', []).requirement.gsmMin, undefined);
  assert.deepEqual(sourcingIntent('cotton 500 to 1000 meters, 150 GSM', []).requirement.gsmMin, 150);
  assert.equal(sourcingIntent('cotton 150 GSM minimum 500 meters', []).requirement.gsmMax, 150);
});

test('RFQ how-to help does not query private inquiry data or submit a request', async () => {
  const result = await localAssistant({} as PrismaClient, 'buyer', 'How do I create an RFQ?', []);
  assert.match(result!.content, /review the specifications/);
  assert.equal(result!.metadata.responseMode, 'local');
});

test('supplier search uses approved records and never selects private contacts', async () => {
  const db = { supplierProfile: { findMany: async (query: { where: object; select: object }) => {
    assert.deepEqual(query.where, { status: 'APPROVED', city: { contains: 'Surat', mode: 'insensitive' } });
    assert.deepEqual(query.select, { companyName: true, city: true });
    return [{ companyName: 'Example Mill', city: 'Surat' }];
  } } } as unknown as PrismaClient;
  const result = await localAssistant(db, 'buyer', 'Find suppliers in Surat', []);
  assert.match(result!.content, /Example Mill/);
});
