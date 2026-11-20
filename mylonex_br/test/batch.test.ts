import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import Fastify from 'fastify';
import { registerRfqRoutes } from '../src/modules/rfqs/routes.js';
import { createSessionVerifier } from '../src/modules/auth/verify-session.js';
import { createSupplierQuoteFlowToken } from '../src/modules/rfqs/whatsapp/whatsapp-flow-token.js';
import { registerWhatsAppWebhook } from '../src/modules/rfqs/whatsapp/inbound.js';
import { enqueueForwardedDelivery, runDeliveryJob } from '../src/modules/rfqs/whatsapp/delivery.js';

const url = process.env.RFQ_TEST_DATABASE_URL;
test('batch validates atomically, matches, and safely replays', { skip: !url }, async () => {
  assert.equal(new URL(url!).hostname, '127.0.0.1');
  assert.ok(new URL(url!).pathname.endsWith('_test'));
  const db = new PrismaClient({ datasourceUrl: url });
  const app = Fastify();
  const buyerId = randomUUID();
  const adminId = randomUUID();
  const supplierUserId = randomUUID();
  const messageId = 'fixture:' + randomUUID();
  let deliveryId: string | undefined;
  const originalSecret = process.env.WHATSAPP_APP_SECRET;
  const originalEnabled = process.env.WHATSAPP_ENABLED;
  const originalPhone = process.env.WHATSAPP_PHONE_NUMBER_ID;
  try {
    await db.user.createMany({ data: [
      { id: buyerId, role: 'BUYER', email: buyerId + '@example.test' },
      { id: adminId, role: 'ADMIN', email: adminId + '@example.test' },
      { id: supplierUserId, role: 'SUPPLIER', email: supplierUserId + '@example.test' },
    ] });
    const supplier = await db.supplierProfile.create({ data: { userId: supplierUserId, companyName: 'Batch Mill', status: 'APPROVED',
      phone: '+12025550123', whatsappConsent: true, whatsappConsentAt: new Date() }, select: { id: true } });
    await db.supplierCatalog.create({ data: {
      supplierId: supplier.id, fabricName: 'Cotton Twill', gsm: 140, widthInches: 58,
      weaveType: 'twill', productionCycle: 'made_to_order', minimumOrderQuantity: 100,
      pricePerMeter: 50, compositionText: '100% Cotton', fabricState: 'dyed',
    }, select: { id: true } });
    await registerRfqRoutes(app, createSessionVerifier({ db, publicClient: () => ({ auth: { getUser: async (id: string) => ({
      data: { user: { id, email: id + '@example.test', email_confirmed_at: 'yes' } }, error: null,
    }) } }) } as unknown as Parameters<typeof createSessionVerifier>[0]));
    await registerWhatsAppWebhook(app, db);
    const request = (id: string, path: string, payload?: object) => app.inject({ url: '/api/v1' + path,
      headers: { authorization: 'Bearer ' + id }, method: payload ? 'POST' : 'GET', payload });
    const inquiry = { fabricStructure: 'woven', materialType: 'pure', pureFiber: 'Cotton', customFabricName: 'Batch Twill',
      gsm: 140, width: '58 inches', weaveType: 'Twill', fabricState: 'dyed', colorInfo: 'Navy', dyeMethod: 'piece_dyed',
      dyeColorType: 'reactive', endUse: 'Shirting', selectedPath: 'production', quantity: 1500,
      deliveryPincode: '400001', deliveryCountry: 'India', deliveryState: 'Maharashtra', deliveryCity: 'Mumbai',
      productionCycle: 'made_to_order', contactPhone: '0000000000', certifications: [] };
    const input = { idempotencyKey: randomUUID(), lines: [{ lineId: randomUUID(), inquiry }] };
    const invalid = { ...input, lines: [...input.lines, { lineId: randomUUID(), inquiry: { ...inquiry, quantity: -1 } }] };
    assert.equal((await request(buyerId, '/buyer/inquiries/batch', invalid)).statusCode, 400);
    assert.equal(await db.communicationRequest.count({ where: { buyerId } }), 0);
    const result = await request(buyerId, '/buyer/inquiries/batch', input);
    assert.equal(result.statusCode, 200, result.body);
    assert.deepEqual((await request(buyerId, '/buyer/inquiries/batch', input)).json(), result.json());
    assert.equal((await request(buyerId, '/buyer/inquiries/batch', { ...input, lines: [{ ...input.lines[0], inquiry: { ...inquiry, quantity: 1600 } }] })).statusCode, 409);
    const id = result.json().data.lines[0].inquiryId;
    const match = await db.communicationRequestMatch.findFirst({ where: { communicationRequestId: id, supplierId: supplier.id } });
    assert.ok(match);
    assert.equal(await enqueueForwardedDelivery(db, match.id), false);
    assert.equal((await request(supplierUserId, '/supplier/inquiries/' + match.id)).statusCode, 404);
    const forward = await request(adminId, '/admin/rfq-review/matches/' + match.id, { decision: 'approve' });
    assert.equal(forward.statusCode, 200, forward.body);
    deliveryId = 'outbound:supplier-rfq:' + match.id;
    assert.equal(await enqueueForwardedDelivery(db, match.id), true);
    assert.equal(await enqueueForwardedDelivery(db, match.id), false);
    let sends = 0;
    await runDeliveryJob(db, deliveryId, async () => { sends++; throw new Error('Ambiguous timeout'); });
    await runDeliveryJob(db, deliveryId, async () => { sends++; return 'sent'; });
    assert.equal(sends, 1);
    assert.equal((await db.whatsAppWebhookEvent.findUniqueOrThrow({ where: { id: deliveryId } })).status, 'UNCERTAIN');
    // Start a separate test sequence after an operator has reconciled the ambiguous attempt.
    await db.whatsAppWebhookEvent.update({ where: { id: deliveryId }, data: { status: 'QUEUED', error: null } });
    let retries = 0;
    for (let attempt = 0; attempt < 4; attempt++) {
      await db.whatsAppWebhookEvent.updateMany({ where: { id: deliveryId, status: 'QUEUED' },
        data: { updatedAt: new Date(0) } });
      await runDeliveryJob(db, deliveryId, async () => { retries++; return 'retryable'; });
    }
    assert.equal(retries, 3);
    assert.equal((await db.whatsAppWebhookEvent.findUniqueOrThrow({ where: { id: deliveryId } })).status, 'FAILED');
    process.env.WHATSAPP_APP_SECRET = 'local-fixture-key';
    process.env.WHATSAPP_ENABLED = 'true';
    process.env.WHATSAPP_PHONE_NUMBER_ID = 'fixture-phone';
    const message = {
      id: messageId, from: '12025550123', type: 'interactive',
      interactive: { nfm_reply: { flow_token: createSupplierQuoteFlowToken(match.id, supplier.id, id),
        response_json: { price_per_m: '52', moq_total: '100', moq_per_colour: '50', lead_time_days: '10',
          sample_available: 'yes', sample_yardage_m: '1', sampling_price: '0' } } },
    };
    const payload = JSON.stringify({ entry: [{ changes: [{ value: {
      metadata: { phone_number_id: 'fixture-phone' }, messages: [message],
    } }] }] });
    const sig = 'sha256=' + createHmac('sha256', 'local-fixture-key').update(payload).digest('hex');
    const webhook = (signature: string) => app.inject({ url: '/api/v1/whatsapp/webhook', method: 'POST',
      headers: { 'content-type': 'application/json', 'x-hub-signature-256': signature }, payload });
    assert.equal((await webhook('sha256=' + '0'.repeat(64))).statusCode, 401);
    assert.equal((await webhook(sig)).statusCode, 200);
    assert.equal((await webhook(sig)).statusCode, 200);
    assert.equal(await db.communicationRequestResponse.count({ where: { requestMatchId: match.id } }), 1);
    const quote = await db.communicationRequestResponse.findUniqueOrThrow({ where: { requestMatchId: match.id } });
    assert.deepEqual((await request(buyerId, '/buyer/inquiries/' + id)).json().quotes, []);
    assert.equal((await request(adminId, '/admin/rfq-review/quotes/' + quote.id, { decision: 'approve' })).statusCode, 200);
    assert.equal((await request(buyerId, '/buyer/inquiries/' + id)).json().quotes[0].price, '52');
  } finally {
    if (originalSecret === undefined) delete process.env.WHATSAPP_APP_SECRET;
    else process.env.WHATSAPP_APP_SECRET = originalSecret;
    if (originalEnabled === undefined) delete process.env.WHATSAPP_ENABLED;
    else process.env.WHATSAPP_ENABLED = originalEnabled;
    if (originalPhone === undefined) delete process.env.WHATSAPP_PHONE_NUMBER_ID;
    else process.env.WHATSAPP_PHONE_NUMBER_ID = originalPhone;
    await db.whatsAppWebhookEvent.deleteMany({ where: { id: { in: [messageId, ...(deliveryId ? [deliveryId] : [])] } } });
    await app.close();
    await db.user.deleteMany({ where: { id: { in: [buyerId, adminId, supplierUserId] } } });
    await db.$disconnect();
  }
});
