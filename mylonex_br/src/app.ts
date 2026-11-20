import Fastify, { LogController } from 'fastify';
import cors from '@fastify/cors';
import type { AppConfig } from './config.js';
import { createServices } from './infrastructure/services.js';
import { registerHomeCatalog } from './modules/catalog/routes.js';
import { registerBuyerAuth } from './modules/auth/routes.js';
import { createSessionVerifier } from './modules/auth/verify-session.js';
import { registerRfqRoutes } from './modules/rfqs/routes.js';
import { registerWhatsAppWebhook } from './modules/rfqs/whatsapp/inbound.js';

export async function buildApp(config: AppConfig) {
  const app = Fastify({
    logger: { level: process.env.LOG_LEVEL || 'info' },
    logController: new LogController({ disableRequestLogging: true }),
  });
  const origins = config.adminOrigin ? [config.frontendOrigin, config.adminOrigin] : [config.frontendOrigin];
  await app.register(cors, { origin: origins, methods: ['GET', 'POST', 'OPTIONS'] });

  app.get('/api/v1/health', async () => ({ status: 'ok', service: 'mylonex_br' }));
  const { db, buyerAuth } = createServices(app, config);
  registerHomeCatalog(app, db);
  await registerBuyerAuth(app, config.frontendOrigin, buyerAuth);
  await registerRfqRoutes(app, createSessionVerifier(buyerAuth), config.frontendOrigin);
  await registerWhatsAppWebhook(app, db);

  return app;
}
