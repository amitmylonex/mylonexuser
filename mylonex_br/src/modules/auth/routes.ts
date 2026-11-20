import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { createServices } from '../../infrastructure/services.js';
import { databaseErrorDetails } from '../../infrastructure/database-error.js';
import { ensureBuyer, identityFor, signupIntent } from '../accounts/buyer.js';
import { registerAccountRoutes } from '../accounts/routes.js';
import { BuyerAccessError } from './access-error.js';
import { signupSchema } from './signup.schema.js';
import { createSessionVerifier } from './verify-session.js';

const confirmation = { status: 'confirmation_required' };



export async function registerBuyerAuth(
  app: FastifyInstance,
  frontendOrigin: string,
  services: ReturnType<typeof createServices>['buyerAuth'],
) {
  const session = createSessionVerifier(services);
  const { configured, applicationUser } = session;

  await app.register(async api => {
    api.addHook('onRequest', async (_req, reply) => { reply.header('Cache-Control', 'no-store'); });
    api.setErrorHandler((error, req, reply) => {
      if (error instanceof BuyerAccessError) return reply.code(error.status).send({ message: error.message });
      const failure = error as { statusCode?: number } | null;
      if (typeof failure?.statusCode === 'number' && failure.statusCode < 500) {
        return reply.code(failure.statusCode).send({ message: 'Invalid request.' });
      }
      req.log.error(databaseErrorDetails(error), 'Account authentication failed');
      return reply.code(500).send({ message: 'Unable to complete this request. Please try again.' });
    });

    api.post('/buyer/signup', { bodyLimit: 16384 }, async (req, reply) => {
      const validated = signupSchema.safeParse(req.body);
      if (!validated.success) throw new BuyerAccessError(400, 'Check your signup details and accept the terms and privacy policy.');
      const { db, admin, publicClient } = configured();
      const { email, password, fullName, company, phone, gstNumber } = validated.data;
      const attempt = randomUUID();
      const { data, error } = await publicClient().auth.signUp({
        email, password,
        options: {
          emailRedirectTo: new URL('/auth/callback', frontendOrigin).href,
          data: { full_name: fullName, buyer_signup_attempt: attempt },
        },
      });

      if (error) {
        if (['user_already_exists', 'email_exists'].includes(error.code ?? '')) return reply.code(202).send(confirmation);
        if (error.status === 429) throw new BuyerAccessError(429, 'Too many attempts. Please wait before trying again.');
        if (error.code === 'weak_password') throw new BuyerAccessError(400, 'Choose a stronger password.');
        if (error.status && error.status < 500) throw new BuyerAccessError(400, 'Could not register with those details. Check your email and password.');
        throw new BuyerAccessError(503, 'Signup is temporarily unavailable. Try again shortly.');
      }
      if (!data.user?.identities?.length) return reply.code(202).send(confirmation);

      const check = await admin.auth.admin.getUserById(data.user.id);
      if (check.error || !check.data.user) throw new BuyerAccessError(503, 'Could not verify signup. Try again shortly.');
      const user = check.data.user;
      if (user.email?.toLowerCase() !== email || user.user_metadata.buyer_signup_attempt !== attempt) {
        return reply.code(202).send(confirmation);
      }
      // Persist the signup intent in server-managed metadata before the DB write.
      // A later verified sign-in can retry an interrupted write; user_metadata cannot grant access.
      let provisionedIdentity = user;
      const original = signupIntent.safeParse(user.app_metadata.mylonex_buyer_signup);
      if (!original.success || original.data.id !== user.id || original.data.email !== email) {
        const saved = await admin.auth.admin.updateUserById(user.id, {
          app_metadata: { mylonex_buyer_signup: { id: user.id, email, fullName, company, phone, gstNumber } },
        });
        if (saved.error || !saved.data.user) throw new BuyerAccessError(503, 'Could not finish signup. Try again shortly or contact support.');
        provisionedIdentity = saved.data.user;
      }
      try {
        await ensureBuyer(db, identityFor(provisionedIdentity));
      } catch (error) {
        if (error instanceof BuyerAccessError) return reply.code(202).send(confirmation);
        throw error;
      }
      return data.session
        ? reply.code(201).send({ status: 'signed_in', accessToken: data.session.access_token, refreshToken: data.session.refresh_token })
        : reply.code(202).send(confirmation);
    });

    api.get('/auth/session', async req => {
      const { account } = await applicationUser(req.headers.authorization);
      if (!account) throw new BuyerAccessError(403, 'No MyloNex account is linked to this sign-in.');
      return account;
    });

    api.post('/auth/session', async req => {
      const { db, user, account } = await applicationUser(req.headers.authorization);
      if (account && account.role !== 'BUYER') return account;
      const identity = identityFor(user);
      if (!account && !identity.intent) {
        throw new BuyerAccessError(403, 'No MyloNex account is linked to this sign-in.');
      }
      return ensureBuyer(db, identity);
    });

    registerAccountRoutes(api, session);
  }, { prefix: '/api/v1' });
}

