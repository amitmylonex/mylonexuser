import type { FastifyInstance, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import type { createSessionVerifier } from '../auth/verify-session.js';
import { BuyerAccessError } from '../auth/access-error.js';
import { databaseErrorDetails } from '../../infrastructure/database-error.js';
import { profilePatch, passwordChange, MAX_AVATAR_BYTES } from './profile.schemas.js';
import { avatarStorage, prepareAvatar } from './profile.avatar.js';
import { profileService, changePassword } from './profile.service.js';
import { profileRateLimit } from './profile.rate-limit.js';

export async function registerProfileRoutes(app: FastifyInstance, session: ReturnType<typeof createSessionVerifier>, origin: string) {
  await app.register(async api => {
    api.addHook('onRequest', async (req, reply) => {
      reply.header('Cache-Control', 'no-store');
      reply.header('X-Request-Id', req.id);
      if (req.headers.origin && req.headers.origin !== origin) throw new BuyerAccessError(403, 'This origin is not allowed.');
    });
    api.setErrorHandler((error, req, reply) => {
      if (error instanceof BuyerAccessError) {
        if (error.status === 429) reply.header('Retry-After', '900');
        return reply.code(error.status).send({ message: error.message });
      }
      if (error instanceof ZodError) return reply.code(400).send({ message: error.issues.map(issue => issue.message).join(' ') });
      const status = (error as { statusCode?: number }).statusCode;
      if (status && status < 500) return reply.code(status).send({ message: 'Invalid profile request.' });
      req.log.error(databaseErrorDetails(error), 'Buyer profile request failed');
      return reply.code(503).send({ message: 'Profile services are temporarily unavailable. Please try again.' });
    });
    api.addContentTypeParser('multipart/form-data', { parseAs: 'buffer' }, (_req, body, done) => done(null, body));
    async function actor(req: FastifyRequest, action?: 'update' | 'avatar' | 'password') {
      const result = await session.applicationUser(req.headers.authorization);
      if (result.account?.role !== 'BUYER') throw new BuyerAccessError(403, 'Buyer access is required.');
      if (action) await profileRateLimit(result.db, result.account.id, action);
      return { ...result, id: result.account.id };
    }
    function service(db: ReturnType<typeof session.configured>['db']) {
      const bucket = process.env.SUPABASE_AVATARS_BUCKET || 'mylonex-avatars';
      return profileService(db, avatarStorage(session.configured().admin, bucket, event => app.log.warn({ event }, 'Profile storage operation failed')));
    }
    api.get('/me', async req => {
      const { db, id } = await actor(req);
      return service(db).read(id);
    });
    api.patch('/me/profile', { bodyLimit: 10000 }, async req => {
      const { db, id } = await actor(req, 'update');
      return service(db).update(id, profilePatch.parse(req.body));
    });
    api.post('/me/avatar', { bodyLimit: MAX_AVATAR_BYTES + 65536 }, async req => {
      const { db, id } = await actor(req, 'avatar');
      if (!Buffer.isBuffer(req.body)) throw new BuyerAccessError(400, 'Upload one image as multipart form data.');
      let form: FormData;
      try { form = await new Response(new Uint8Array(req.body), { headers: { 'content-type': req.headers['content-type']! } }).formData(); }
      catch { throw new BuyerAccessError(400, 'This image upload could not be read.'); }
      if ([...form.keys()].length !== 1 || form.getAll('avatar').length !== 1 || !(form.get('avatar') instanceof File)) {
        throw new BuyerAccessError(400, 'Upload exactly one image in the avatar field.');
      }
      const file = form.get('avatar') as File;
      const bytes = await prepareAvatar(new Uint8Array(await file.arrayBuffer()), file.type);
      return service(db).upload(id, bytes);
    });
    api.delete('/me/avatar', async req => {
      const { db, id } = await actor(req, 'avatar');
      return service(db).remove(id);
    });
    api.post('/me/password', { bodyLimit: 4096 }, async req => {
      const { user, id } = await actor(req, 'password');
      const input = passwordChange.parse(req.body);
      return changePassword(session.configured(), id, user.email!, input.currentPassword, input.newPassword);
    });
  }, { prefix: '/api/v1' });
}
