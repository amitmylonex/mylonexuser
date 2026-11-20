import { createHmac, timingSafeEqual } from 'node:crypto';
import type { FastifyInstance } from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { BuyerAccessError } from '../../auth/access-error.js';
import { quote } from '../schema.js';
import { writeQuote } from '../service.js';
import { verifySupplierQuoteFlowToken } from './whatsapp-flow-token.js';
import { parseFlowQuote, validateSupplierQuote } from './whatsapp-quote-parser.js';
import { whatsAppWebhookSchema, type WhatsAppInboundMessage } from './whatsapp-webhook-schema.js';
import { prepareWhatsAppQuoteMetadata } from './quote-metadata.js';

function phoneNumber(phone: string | null, country?: string | null) {
  if (!phone) return null;
  const source = phone.trim();
  const digits = source.replace(/\D/g, '');
  const number = source.startsWith('00') ? digits.slice(2) :
    !source.startsWith('+') && digits.length === 10 && country?.replace(/\D/g, '') === '91' ? '91' + digits : digits;
  return /^[1-9]\d{9,14}$/.test(number) ? number : null;
}

export async function processFlowReply(db: PrismaClient, message: WhatsAppInboundMessage) {
  const flow = message.interactive?.nfm_reply;
  if (!flow || message.type !== 'interactive') return false;
  const raw = parseFlowQuote(flow.response_json);
  const claims = verifySupplierQuoteFlowToken(flow.flow_token?.trim() || raw.flowToken?.trim());
  const sender = phoneNumber(message.from);
  if (!claims || !sender) return false;

  return db.$transaction(async tx => {
    const claim = await tx.whatsAppWebhookEvent.createMany({
      data: [{ id: message.id, eventType: 'message' }], skipDuplicates: true,
    });
    if (!claim.count) return false;
    const match = await tx.communicationRequestMatch.findFirst({
      where: { id: claims.matchId, supplierId: claims.supplierId, communicationRequestId: claims.requestId,
        status: 'FORWARDED_TO_SUPPLIER', supplier: { status: 'APPROVED', whatsappConsent: true, whatsappConsentAt: { not: null } } },
      select: { supplier: true, communicationRequest: { select: { quantity: true } } },
    });
    let saved = false;
    let error = 'Unverified supplier or inactive match';
    if (match && phoneNumber(match.supplier.phone, match.supplier.phoneCountryCode) === sender) {
      const parsed = validateSupplierQuote(raw, match.communicationRequest.quantity);
      if (parsed.valid) {
        const v = parsed.quote;
        try {
          const input = quote.parse({
            price: v.price_per_m, leadTimeDays: v.lead_time_days, moq: v.moq_total,
            dispatchLocation: match.supplier.dispatchLocation?.trim() || match.supplier.city?.trim() || 'Unspecified (WhatsApp submission)',
            sampleAvailability: v.sample_summary, notes: v.remarks ?? undefined,
            additionalNotes: prepareWhatsAppQuoteMetadata(JSON.stringify({
              version: 1, submittedVia: 'whatsapp', source: 'FLOW', priceBasis: v.price_basis,
              priceValidity: v.price_validity, moqPerColour: v.moq_per_colour, sampleStatus: v.sample_status,
              sampleYardageM: v.sample_yardage_m, sampleLeadTimeDays: v.sample_lead_time_days, samplingPrice: v.sampling_price,
              remarks: v.remarks, submittedAt: new Date().toISOString(), inboundMessageId: message.id,
            })),
          });
          await writeQuote(tx, match.supplier.userId, claims.matchId, input);
          await tx.communicationRequestMatch.update({ where: { id: claims.matchId }, data: { whatsappStatus: 'QUOTED' } });
          saved = true;
        } catch (failure) {
          if (!(failure instanceof BuyerAccessError)) throw failure;
          error = failure.message;
        }
      } else error = parsed.errors.join('; ');
    }
    await tx.whatsAppWebhookEvent.update({ where: { id: message.id }, data: { status: 'PROCESSED', error: saved ? null : error } });
    return saved;
  });
}

export async function registerWhatsAppWebhook(app: FastifyInstance, db: PrismaClient | null) {
  await app.register(async api => {
    api.removeContentTypeParser('application/json');
    api.addContentTypeParser('application/json', { parseAs: 'buffer' }, (_req, body, done) => done(null, body));
    api.get('/webhook', async (req, reply) => {
      const query = req.query as Record<string, string>;
      const token = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
      if (!token || query['hub.mode'] !== 'subscribe' || query['hub.verify_token'] !== token || typeof query['hub.challenge'] !== 'string') {
        return reply.code(403).send({ message: 'Could not verify webhook.' });
      }
      return reply.type('text/plain').send(query['hub.challenge']);
    });
    api.post('/webhook', { bodyLimit: 256 * 1024 }, async (req, reply) => {
      const secret = process.env.WHATSAPP_APP_SECRET, phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
      if (!db || !secret || !phoneId || process.env.WHATSAPP_ENABLED !== 'true') return reply.code(503).send({ message: 'Webhook is disabled.' });
      const sig = req.headers['x-hub-signature-256'];
      if (!Buffer.isBuffer(req.body) || typeof sig !== 'string' || !/^sha256=[a-f0-9]{64}$/i.test(sig)) return reply.code(401).send();
      const expected = createHmac('sha256', secret).update(req.body).digest();
      if (!timingSafeEqual(expected, Buffer.from(sig.slice(7), 'hex'))) return reply.code(401).send();
      let raw;
      try { raw = JSON.parse(req.body.toString('utf8')); } catch { return reply.code(400).send(); }
      const parsed = whatsAppWebhookSchema.safeParse(raw);
      if (!parsed.success) return reply.code(400).send();
      for (const entry of parsed.data.entry ?? []) for (const change of entry.changes ?? []) {
        if (change.value?.metadata?.phone_number_id !== phoneId) continue;
        for (const message of change.value.messages ?? []) await processFlowReply(db, message);
      }
      return { ok: true };
    });
  }, { prefix: '/api/v1/whatsapp' });
}
