import type { createServices } from '../../infrastructure/services.js';
import { BuyerAccessError } from './access-error.js';

type AuthServices = ReturnType<typeof createServices>['buyerAuth'];

export function createSessionVerifier(services: AuthServices) {
  function configured() {
    if (!services) throw new BuyerAccessError(503, 'Buyer authentication is not configured.');
    return services;
  }

  async function verified(authorization: string | undefined) {
    const token = /^Bearer ([^\s]+)$/i.exec(authorization ?? '')?.[1];
    if (!token) throw new BuyerAccessError(401, 'Sign in to continue.');
    const { db, publicClient } = configured();
    const { data, error } = await publicClient().auth.getUser(token);
    if (error && (!error.status || error.status >= 500 || error.status === 429)) {
      throw new BuyerAccessError(503, 'Could not verify your session. Try again shortly.');
    }
    if (error || !data.user?.email || !data.user.email_confirmed_at) {
      throw new BuyerAccessError(401, 'Sign in with a confirmed email to continue.');
    }
    return { db, user: data.user };
  }

  async function applicationUser(authorization: string | undefined) {
    const { db, user } = await verified(authorization);
    const account = await db.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, fullName: true, role: true },
    });
    return { db, user, account };
  }

  return { configured, verified, applicationUser };
}
