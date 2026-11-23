import type { FastifyInstance } from 'fastify';
import OpenAI from 'openai';
import { ZodError } from 'zod';
import type { createSessionVerifier } from '../auth/verify-session.js';
import { BuyerAccessError } from '../auth/access-error.js';
import { databaseErrorDetails } from '../../infrastructure/database-error.js';
import { chatInput, conversationParams, pageQuery, validate } from './schema.js';
import { chatRepository } from './repository.js';
import { createChatService } from './service.js';
import { createChatLoadControl } from './load-control.js';

export async function registerChatRoutes(app: FastifyInstance, session: ReturnType<typeof createSessionVerifier>, origin: string) {
  const key = process.env.OPENAI_API_KEY;
  const client = key ? new OpenAI({ apiKey: key, timeout: 40000, maxRetries: 0 }) : null;
  const enter = createChatLoadControl();
  let send: ReturnType<typeof createChatService> | undefined;
  await app.register(async api => {
    api.addHook('onRequest', async (req, reply) => {
      reply.header('Cache-Control', 'no-store');
      if (req.headers.origin && req.headers.origin !== origin) throw new BuyerAccessError(403, 'Cross-origin chat requests are not allowed.');
    });
    api.setErrorHandler((error, req, reply) => {
      if (error instanceof BuyerAccessError) {
        if ([429, 503].includes(error.status)) reply.header('Retry-After', '60');
        return reply.code(error.status).send({ message: error.message });
      }
      const status = (error as { statusCode?: number }).statusCode;
      if (error instanceof ZodError || (status && status < 500)) return reply.code(status ?? 400).send({ message: 'Check your chat request.' });
      req.log.error(databaseErrorDetails(error), 'Chat request failed');
      return reply.code(503).send({ message: 'Chat is temporarily unavailable. Please try again shortly.' });
    });
    async function actor(authorization?: string) {
      const { db, account } = await session.applicationUser(authorization);
      if (account?.role !== 'BUYER') throw new BuyerAccessError(403, 'Buyer access is required.');
      return { db, id: account.id };
    }
    api.get('/conversations', async req => {
      const { db, id } = await actor(req.headers.authorization);
      return chatRepository(db, id).list(validate(pageQuery, req.query).before);
    });
    api.get('/conversations/:id', async req => {
      const user = await actor(req.headers.authorization);
      return chatRepository(user.db, user.id).messages(validate(conversationParams, req.params).id, validate(pageQuery, req.query).before);
    });
    api.post('/conversations/:id/delete', async req => {
      const user = await actor(req.headers.authorization);
      return chatRepository(user.db, user.id).remove(validate(conversationParams, req.params).id);
    });
    api.post('/messages', { bodyLimit: 20000 }, async req => {
      const input = validate(chatInput, req.body);
      const { db, id } = await actor(req.headers.authorization);
      const leave = enter(id);
      try {
        send ??= createChatService(db, client, process.env.OPENAI_CHAT_MODEL || 'gpt-4o-mini', details => {
          app.log.warn(details, 'AI chat processing failed; using guided help');
        });
        return await send(id, input);
      }
      finally { leave(); }
    });
  }, { prefix: '/api/v1/buyer/chat' });
}
