import assert from 'node:assert/strict';
import { test } from 'node:test';
import { randomUUID } from 'node:crypto';
import Fastify from 'fastify';
import type { PrismaClient } from '@prisma/client';
import type OpenAI from 'openai';
import { registerChatRoutes } from '../src/modules/chat/routes.js';
import type { createSessionVerifier } from '../src/modules/auth/verify-session.js';
import { createChatLoadControl } from '../src/modules/chat/load-control.js';
import { chatRepository } from '../src/modules/chat/repository.js';
import { createChatService } from '../src/modules/chat/service.js';
import { runChatTool } from '../src/modules/chat/tools.js';
import { BuyerAccessError } from '../src/modules/auth/access-error.js';

const denied = (status: number) => (error: unknown) => error instanceof BuyerAccessError && error.status === status;
function savingDb() {
  const saved: { role: string; content: string; metadata?: unknown }[] = [];
  const tx = {
    conversation: { create: async () => ({ id: 'saved-chat', title: 'Chat', updatedAt: new Date() }) },
    message: { create: async ({ data }: { data: { role: string; content: string; metadata?: unknown } }) => {
      saved.push(data); return { id: String(saved.length), ...data };
    } },
  };
  return { db: { $transaction: async (work: (tx: unknown) => unknown) => work(tx) } as unknown as PrismaClient, saved };
}
test('chat admission bounds concurrent calls, per-buyer rate, and releases slots', () => {
  const enter = createChatLoadControl(1);
  const leave = enter('buyer', 0);
  assert.throws(() => enter('buyer', 0), denied(409));
  assert.throws(() => enter('other', 0), denied(503));
  leave();
  for (let n = 0; n < 9; n++) enter('buyer', 0)();
  assert.throws(() => enter('buyer', 0), denied(429));
  enter('buyer', 60001)();
});

test('chat routes deny anonymous, non-buyer, foreign origin and malformed requests', async () => {
  const session = {
    applicationUser: async (token?: string) => {
      if (!token) throw new BuyerAccessError(401, 'Sign in.');
      return { db: {}, account: { id: 'buyer', role: token === 'supplier' ? 'SUPPLIER' : 'BUYER' } };
    },
  } as unknown as ReturnType<typeof createSessionVerifier>;
  const app = Fastify();
  await registerChatRoutes(app, session, 'http://localhost:5173');
  try {
    for (const [method, path] of [['GET', '/conversations'], ['GET', '/conversations/' + randomUUID()], ['POST', '/conversations/' + randomUUID() + '/delete']] as const) {
      assert.equal((await app.inject({ method, url: '/api/v1/buyer/chat' + path })).statusCode, 401);
      assert.equal((await app.inject({ method, url: '/api/v1/buyer/chat' + path, headers: { authorization: 'supplier' } })).statusCode, 403);
    }
    const invalid = await app.inject({ method: 'POST', url: '/api/v1/buyer/chat/messages', headers: { authorization: 'buyer' }, payload: { message: 'hello', userId: 'other' } });
    assert.equal(invalid.statusCode, 400);
    assert.equal(invalid.headers['cache-control'], 'no-store');
    assert.equal((await app.inject({ url: '/api/v1/buyer/chat/conversations', headers: { origin: 'https://foreign.example' } })).statusCode, 403);
    assert.equal((await app.inject({ method: 'POST', url: '/api/v1/buyer/chat/messages', payload: { message: 'hello' } })).statusCode, 401);
  } finally { await app.close(); }
});

test('foreign conversation IDs fail closed before calling AI or writing history', async () => {
  let aiCalls = 0;
  const db = { conversation: { findFirst: async (query: { where: object }) => {
    assert.deepEqual(query.where, { id: 'foreign-chat', userId: 'buyer' }); return null;
  } } } as unknown as PrismaClient;
  const client = { chat: { completions: { create: async () => { aiCalls++; } } } } as unknown as OpenAI;
  await assert.rejects(createChatService(db, client, 'test')('buyer', { conversationId: 'foreign-chat', message: 'Hello' }), denied(404));
  assert.equal(aiCalls, 0);
  await assert.rejects(chatRepository(db, 'buyer').messages('foreign-chat'), denied(404));
});

test('inquiry tools use authenticated buyer and expose only released quote counts', async () => {
  const db = { communicationRequest: { findMany: async (query: { where: object; take: number; select: object }) => {
    assert.deepEqual(query.where, { buyerId: 'actual-buyer', requesterRole: 'BUYER' });
    assert.equal(query.take, 5);
    assert.match(JSON.stringify(query.select), /APPROVED_FOR_REQUESTER/);
    assert.doesNotMatch(JSON.stringify(query.select), /supplierOriginalPrice|contactPhone/);
    return [];
  } } } as unknown as PrismaClient;
  await runChatTool(db, 'actual-buyer', 'get_my_inquiries', {});
  await assert.rejects(runChatTool(db, 'actual-buyer', 'get_my_inquiries', { limit: 100000 }));
  await assert.rejects(runChatTool(db, 'actual-buyer', 'get_my_inquiries', { userId: 'victim' }));
  assert.deepEqual(await runChatTool(db, 'actual-buyer', 'extract_sourcing_requirement', { fiberType: 'Cotton' }), {
    requirement: { fiberType: 'Cotton' }, nextStep: 'Review these specifications in the RFQ builder before submitting.',
  });
});

test('provider failure saves guided help without exposing internal errors', async () => {
  const { db, saved } = savingDb();
  const client = { chat: { completions: { create: async () => { throw new Error('private provider details'); } } } } as unknown as OpenAI;
  const result = await createChatService(db, client, 'test')('buyer', { message: 'Discuss global textile trade policy' });
  assert.equal((result.message.metadata as { responseMode: string }).responseMode, 'local');
  assert.doesNotMatch(result.message.content, /private provider/);
  assert.deepEqual(saved.map(row => row.role), ['user', 'assistant']);
});

test('tool loop and output tokens are bounded even when model keeps requesting tools', async () => {
  const { db } = savingDb();
  let calls = 0;
  const client = { chat: { completions: { create: async (request: { max_completion_tokens: number; tool_choice: string }) => {
    calls++;
    assert.equal(request.max_completion_tokens, 1500);
    if (calls === 4) assert.equal(request.tool_choice, 'none');
    return { choices: [{ message: { role: 'assistant', content: null, tool_calls: [{ type: 'function', id: String(calls), function: { name: 'get_catalog_categories', arguments: '{}' } }] } }] };
  } } } } as unknown as OpenAI;
  const result = await createChatService(db, client, 'test')('buyer', { message: 'Discuss global textile trade policy' });
  assert.equal((result.message.metadata as { responseMode: string }).responseMode, 'local');
  assert.equal(calls, 4);
});

test('greetings, buyer help and unknown messages work and persist without OpenAI', async () => {
  for (const message of ['hii', 'How do I submit an RFQ?', 'Explain GSM', 'something not recognized']) {
    const { db, saved } = savingDb();
    const result = await createChatService(db, null, 'unused')('buyer', { message });
    assert.ok(result.message.content.length > 40);
    assert.equal((result.message.metadata as { responseMode: string }).responseMode, 'local');
    assert.equal(saved.length, 2);
  }
});

test('basic buyer intents never call the configured AI provider', async () => {
  const { db } = savingDb();
  let calls = 0;
  const client = { chat: { completions: { create: async () => { calls++; throw new Error('not expected'); } } } } as unknown as OpenAI;
  const send = createChatService(db, client, 'unused');
  await send('buyer', { message: 'hii' });
  await send('buyer', { message: 'What fabric categories are available?' });
  assert.equal(calls, 0);
});

test('provider circuit breaker avoids repeated failed calls while local chat remains available', async () => {
  const { db } = savingDb();
  let calls = 0;
  const client = { chat: { completions: { create: async () => { calls++; throw Object.assign(new Error('secret'), { status: 401 }); } } } } as unknown as OpenAI;
  const send = createChatService(db, client, 'test');
  await send('buyer', { message: 'Discuss global textile trade policy' });
  await send('buyer', { message: 'Discuss global textile trade policy again' });
  await send('buyer', { message: 'Hello' });
  assert.equal(calls, 1);
});
