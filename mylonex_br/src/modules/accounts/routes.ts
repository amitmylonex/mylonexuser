import type { FastifyInstance } from 'fastify';
import type { createSessionVerifier } from '../auth/verify-session.js';
import { BuyerAccessError } from '../auth/access-error.js';
import { ensureBuyer, identityFor, readBuyer, requireBuyerRecord } from './buyer.js';

export function registerAccountRoutes(
  api: FastifyInstance,
  { verified, applicationUser }: ReturnType<typeof createSessionVerifier>,
) {
  api.post('/buyer/session', async req => {
    const { db, user } = await verified(req.headers.authorization);
    return ensureBuyer(db, identityFor(user));
  });

  api.get('/buyer/me', async req => {
    const { db, user } = await verified(req.headers.authorization);
    return requireBuyerRecord(await readBuyer(db, user.id));
  });

  api.get('/supplier/me', async req => {
    const { db, account } = await applicationUser(req.headers.authorization);
    if (account?.role !== 'SUPPLIER') {
      throw new BuyerAccessError(403, 'This account does not have access to the supplier portal.');
    }
    const supplierProfile = await db.supplierProfile.findUnique({
      where: { userId: account.id },
      select: { companyName: true, status: true },
    });
    // Status is visible to the account owner even when marketplace participation is restricted.
    return { ...account, supplierProfile };
  });

  api.get('/admin/me', async req => {
    const { account } = await applicationUser(req.headers.authorization);
    if (account?.role !== 'ADMIN') {
      throw new BuyerAccessError(403, 'This account does not have access to the admin portal.');
    }
    return account;
  });
}
