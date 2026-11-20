import type { FastifyInstance } from 'fastify';
import type { UserRole, Prisma, CommunicationRequestResponseStatus } from '@prisma/client';
import { BuyerAccessError as RfqError } from '../auth/access-error.js';
import type { createSessionVerifier } from '../auth/verify-session.js';
import { parseStoredFabricShades } from './fabric-selections.js';
import { idSchema, productionRfq, quote, review } from './schema.js';
import { availableFabrics, createFromFabric, fabricFields, isQuickRfq, submitQuote } from './service.js';
import { z } from 'zod';
import { submitBuyerBatch } from './batch.js';
import { BatchConflictError } from './legacy/src/domains/rfq/batch/schema.js';
import { registerExtractionRoutes } from './extraction-routes.js';

const requestFields = {
  id: true, rfqNumber: true, fabricName: true, quantity: true, deliveryPincode: true,
  productionCycle: true, requiredDeliveryDate: true, targetPriceMin: true, targetPriceMax: true, createdAt: true,
} satisfies Prisma.CommunicationRequestSelect;
const quoteFields = {
  id: true, price: true, leadTimeDays: true, moq: true, dispatchLocation: true, quoteType: true,
  status: true, submissionRevision: true, adminReviewNote: true, notes: true, additionalNotes: true,
  sampleAvailability: true, totalValueEstimate: true, responseImageUrls: true,
} satisfies Prisma.CommunicationRequestResponseSelect;
const quick = { requesterRole: 'BUYER', OR: [
  { specPayload: isQuickRfq() }, { specPayload: { path: ['origin'], equals: 'buyer_batch' } },
] } satisfies Prisma.CommunicationRequestWhereInput;
const releasedStatuses: CommunicationRequestResponseStatus[] = ['APPROVED_FOR_REQUESTER', 'ACCEPTED_BY_BUYER'];
const released = { status: { in: releasedStatuses } } satisfies Prisma.CommunicationRequestResponseWhereInput;
const closed = { status: { in: ['closed', 'cancelled'] } } satisfies Prisma.CommunicationRequestWhereInput;
const quoted = { matches: { some: { response: released } } } satisfies Prisma.CommunicationRequestWhereInput;
const listQuery = z.object({
  q: z.string().trim().max(200).default(''),
  status: z.enum(['all', 'awaiting', 'quoted', 'closed']).default('all'),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});

function validate<T>(schema: z.ZodType<T>, value: unknown): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new RfqError(400, result.error.issues.map(issue => issue.path.join('.') + ': ' + issue.message).join('; '));
  return result.data;
}

export async function registerRfqRoutes(app: FastifyInstance, session: ReturnType<typeof createSessionVerifier>, origin = 'http://localhost:5173') {
  await app.register(async api => {
    api.addHook('onRequest', async (_req, reply) => { reply.header('Cache-Control', 'no-store'); });
    api.setErrorHandler((error, req, reply) => {
      if (error instanceof RfqError) return reply.code(error.status).send({ message: error.message });
      const status = (error as { statusCode?: number }).statusCode;
      if (status && status < 500) return reply.code(status).send({ message: 'Invalid request.' });
      req.log.error({ code: (error as { code?: string }).code }, 'RFQ request failed');
      return reply.code(500).send({ message: 'Could not complete the RFQ request.' });
    });
    async function actor(authorization: string | undefined, role: UserRole) {
      const { db, account } = await session.applicationUser(authorization);
      if (account?.role !== role) throw new RfqError(403, 'This action is unavailable for your account.');
      return { db, id: account.id };
    }
    registerExtractionRoutes(api, session, origin);
    api.post('/buyer/inquiries/batch', { bodyLimit: 2 * 1024 * 1024 }, async (req, reply) => {
      if (req.headers.origin && req.headers.origin !== origin) throw new RfqError(403, 'Cross-origin batch submission is not allowed.');
      const { db, id } = await actor(req.headers.authorization, 'BUYER');
      try {
        return { data: await submitBuyerBatch(db, id, req.body) };
      } catch (error) {
        if (error instanceof BatchConflictError) return reply.code(409).send({ error: { code: 'IDEMPOTENCY_CONFLICT', message: error.message } });
        if (error instanceof z.ZodError) return reply.code(400).send({
          error: { code: 'VALIDATION_ERROR', message: 'Review the highlighted line details before submitting.', details: error.issues },
        });
        throw error;
      }
    });

    api.get('/buyer/fabrics', async req => {
      const { db } = await actor(req.headers.authorization, 'BUYER');
      const items = await db.supplierCatalog.findMany({
        where: availableFabrics, select: fabricFields, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], take: 100,
      });
      return { items: items.map(({ shadeVariants, supplierId: _supplierId, ...item }) =>
        ({ ...item, shades: parseStoredFabricShades(shadeVariants) })) };
    });
    api.post('/buyer/inquiries/from-fabric', async (req, reply) => {
      const { db, id } = await actor(req.headers.authorization, 'BUYER');
      return reply.code(201).send(await createFromFabric(db, id, validate(productionRfq, req.body)));
    });
    api.get('/buyer/inquiries', async req => {
      const { db, id } = await actor(req.headers.authorization, 'BUYER');
      const { q, status, page } = validate(listQuery, req.query);
      const base = { ...quick, buyerId: id };
      const awaiting = { AND: [{ NOT: closed }, { NOT: quoted }] };
      const openQuoted = { AND: [{ NOT: closed }, quoted] };
      const filter = { all: {}, awaiting, quoted: openQuoted, closed }[status];
      const where: Prisma.CommunicationRequestWhereInput = {
        AND: [base, filter, ...(q ? [{ OR: [
          { rfqNumber: { contains: q, mode: 'insensitive' as const } },
          { fabricName: { contains: q, mode: 'insensitive' as const } },
        ] }] : [])],
      };
      const pageSize = 20;
      const [rows, filteredTotal, total, withQuotes, openAwaiting, openWithQuotes, closedTotal, quickTotal] = await db.$transaction([
        db.communicationRequest.findMany({
          where, orderBy: [{ createdAt: 'desc' }, { id: 'desc' }], skip: (page - 1) * pageSize, take: pageSize,
          select: { ...requestFields, requiredDeliveryDate: false, status: true, specPayload: true,
            _count: { select: { matches: true } },
            matches: {
              where: { OR: [{ status: 'FORWARDED_TO_SUPPLIER' }, { response: released }] },
              select: { status: true, response: { select: { status: true } } },
            },
          },
        }),
        db.communicationRequest.count({ where }),
        db.communicationRequest.count({ where: base }),
        db.communicationRequest.count({ where: { AND: [base, quoted] } }),
        db.communicationRequest.count({ where: { AND: [base, awaiting] } }),
        db.communicationRequest.count({ where: { AND: [base, openQuoted] } }),
        db.communicationRequest.count({ where: { AND: [base, closed] } }),
        db.communicationRequest.count({ where: { AND: [base, { specPayload: isQuickRfq() }] } }),
      ], { isolationLevel: 'RepeatableRead' });
      const items = rows.map(({ _count, matches, specPayload, ...row }) => {
        const spec = z.object({ data: z.object({
          weaveType: z.string().optional(), deliveryCity: z.string().nullable().optional(),
          deliveryState: z.string().nullable().optional(),
        }).optional() }).safeParse(specPayload).data;
        const quoteCount = matches.filter(({ response }) => response && released.status.in.includes(response.status)).length;
        return { ...row, isFabricQuickRfq: (specPayload as { origin?: string })?.origin === 'fabric_quick_rfq',
          weaveType: spec?.data?.weaveType,
          deliveryCity: spec?.data?.deliveryCity, deliveryState: spec?.data?.deliveryState,
          matchCount: _count.matches, forwardedCount: matches.filter(match => match.status === 'FORWARDED_TO_SUPPLIER').length,
          quoteCount };
      });
      return { items, filteredTotal, page, pageSize, totals: {
        total, withQuotes, withoutQuotes: total - withQuotes, awaiting: openAwaiting, quoted: openWithQuotes, closed: closedTotal, quick: quickTotal,
      } };
    });
    api.get('/buyer/inquiries/:id', async req => {
      const { db, id: buyerId } = await actor(req.headers.authorization, 'BUYER');
      const { id } = validate(idSchema, req.params);
      const inquiry = await db.communicationRequest.findFirst({
        where: { id, buyerId, ...quick },
        select: {
          ...requestFields, buyerMessage: true, buyerImageUrls: true, status: true, specPayload: true,
          matches: { where: { response: { status: { in: ['APPROVED_FOR_REQUESTER', 'ACCEPTED_BY_BUYER'] } } },
            select: { response: { select: { ...quoteFields, adminReviewNote: false } } } },
        },
      });
      if (!inquiry) throw new RfqError(404, 'Inquiry not found.');
      const { matches, specPayload, ...details } = inquiry;
      return { ...details, isFabricQuickRfq: (specPayload as { origin?: string })?.origin === 'fabric_quick_rfq',
        quotes: matches.flatMap(match => match.response ? [match.response] : [])
        .sort((a, b) => Number(a.price) - Number(b.price)) };
    });

    function supplierFilter(userId: string) {
      return { supplier: { userId, status: 'APPROVED' }, status: 'FORWARDED_TO_SUPPLIER',
        communicationRequest: quick } satisfies Prisma.CommunicationRequestMatchWhereInput;
    }
    api.get('/supplier/inquiries', async req => {
      const { db, id } = await actor(req.headers.authorization, 'SUPPLIER');
      const where = supplierFilter(id);
      const [items, total, responded] = await db.$transaction([
        db.communicationRequestMatch.findMany({
          where, orderBy: [{ forwardedAt: 'desc' }, { id: 'desc' }], take: 100,
          select: { id: true, forwardedAt: true, communicationRequest: { select: requestFields }, response: { select: { status: true } } },
        }),
        db.communicationRequestMatch.count({ where }),
        db.communicationRequestMatch.count({ where: { ...where, response: { isNot: null } } }),
      ], { isolationLevel: 'RepeatableRead' });
      return { items, totals: { total, responded, pending: total - responded } };
    });
    api.get('/supplier/inquiries/:id', async req => {
      const { db, id: supplierUserId } = await actor(req.headers.authorization, 'SUPPLIER');
      const { id } = validate(idSchema, req.params);
      const match = await db.communicationRequestMatch.findFirst({
        where: { ...supplierFilter(supplierUserId), id },
        select: {
          id: true, forwardedAt: true,
          communicationRequest: { select: { ...requestFields, buyerMessage: true, buyerImageUrls: true } },
          response: { select: quoteFields },
        },
      });
      if (!match) throw new RfqError(404, 'Request match not found or unauthorized.');
      return match;
    });
    api.post('/supplier/inquiries/:id/quote', async (req, reply) => {
      const { db, id: userId } = await actor(req.headers.authorization, 'SUPPLIER');
      const { id } = validate(idSchema, req.params);
      return reply.code(201).send(await submitQuote(db, userId, id, validate(quote, req.body)));
    });

    api.get('/admin/rfq-review', async req => {
      const { db } = await actor(req.headers.authorization, 'ADMIN');
      const [matches, quotes] = await Promise.all([
        db.communicationRequestMatch.findMany({
          where: { communicationRequest: quick, status: 'PENDING_ADMIN_REVIEW', supplier: { status: 'APPROVED' } },
          select: { id: true, communicationRequest: { select: { ...requestFields, buyerMessage: true } },
            supplier: { select: { companyName: true } } },
          orderBy: { createdAt: 'asc' }, take: 100,
        }),
        db.communicationRequestResponse.findMany({
          where: { status: 'PENDING_ADMIN_REVIEW', requestMatch: { communicationRequest: quick } },
          select: { ...quoteFields, supplier: { select: { companyName: true } },
            requestMatch: { select: { communicationRequest: { select: requestFields } } } },
          orderBy: { createdAt: 'asc' }, take: 100,
        }),
      ]);
      return { matches, quotes };
    });
    api.post('/admin/rfq-review/matches/:id', async req => {
      const { db, id: adminReviewedByUserId } = await actor(req.headers.authorization, 'ADMIN');
      const { id } = validate(idSchema, req.params);
      const { decision, note } = validate(review, req.body);
      const approval = decision === 'approve';
      const result = await db.communicationRequestMatch.updateMany({
        where: { id, status: 'PENDING_ADMIN_REVIEW', communicationRequest: quick,
          ...(approval ? { supplier: { status: 'APPROVED' } } : {}) },
        data: { status: approval ? 'FORWARDED_TO_SUPPLIER' : 'REJECTED_BY_ADMIN',
          forwardedAt: approval ? new Date() : null, adminReviewedAt: new Date(), adminReviewedByUserId, adminReviewNote: note || null },
      });
      if (!result.count) throw new RfqError(409, 'This match is no longer eligible for review.');
      return { status: approval ? 'FORWARDED_TO_SUPPLIER' : 'REJECTED_BY_ADMIN' };
    });
    api.post('/admin/rfq-review/quotes/:id', async req => {
      const { db, id: adminReviewedByUserId } = await actor(req.headers.authorization, 'ADMIN');
      const { id } = validate(idSchema, req.params);
      const { decision, note } = validate(review, req.body);
      const status = decision === 'approve' ? 'APPROVED_FOR_REQUESTER' : 'REJECTED_BY_ADMIN';
      const result = await db.communicationRequestResponse.updateMany({
        where: { id, status: 'PENDING_ADMIN_REVIEW', requestMatch: { communicationRequest: quick } },
        data: { status, adminReviewedAt: new Date(), adminReviewedByUserId, adminReviewNote: note || null },
      });
      if (!result.count) throw new RfqError(409, 'This quote is no longer eligible for review.');
      return { status };
    });
  }, { prefix: '/api/v1' });
}
