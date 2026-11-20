import { createHash, randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { batchSubmissionSchema, batchResultSchema, BatchConflictError } from './legacy/src/domains/rfq/batch/schema.js';
import { buildAnonymizedRequesterReference, buildSpecSummary, getComposition, getFabricName } from './legacy/src/domains/rfq/summary.js';
import { determineRouting } from './legacy/src/domains/rfq/routing.js';
import { formatRfqNumber } from './numbers.js';
import { generateMatchesForCommunicationRequest } from './batch-matching.js';

function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') {
    return '{' + Object.entries(value).filter(([, value]) => value !== undefined)
      .sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0)
      .map(([key, value]) => JSON.stringify(key) + ':' + canonical(value)).join(',') + '}';
  }
  return JSON.stringify(value);
}

export async function submitBuyerBatch(db: PrismaClient, buyerId: string, raw: unknown) {
  const input = batchSubmissionSchema.parse(raw);
  const payloadHash = createHash('sha256').update(canonical(input.lines)).digest('hex');
  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(async tx => {
        await tx.$queryRaw`SELECT 1 AS locked FROM (SELECT pg_advisory_xact_lock(775301)) AS batch_lock`;
        const existing = await tx.rfqBatch.findUnique({
          where: { buyerId_idempotencyKey: { buyerId, idempotencyKey: input.idempotencyKey } },
        });
        if (existing) {
          if (existing.payloadHash !== payloadHash) throw new BatchConflictError('This submission key belongs to different lines. Restore the original submission before retrying.');
          return { ...batchResultSchema.parse(existing.result), dispatch: { claimed: existing.claimedLineIds.length,
            completed: existing.completedLineIds.length, failed: existing.failedLineIds.length } };
        }
        const date = new Date();
        const prefix = formatRfqNumber(date, 0).slice(0, -4);
        const used = await tx.communicationRequest.findMany({ where: { rfqNumber: { startsWith: prefix } }, select: { rfqNumber: true } });
        let sequence = used.reduce((max, item) => Math.max(max, Number(item.rfqNumber.slice(prefix.length)) || 0), 0);
        const result = { batchId: randomUUID(), lines: input.lines.map(line => ({
          lineId: line.lineId, inquiryId: randomUUID(), rfqNumber: formatRfqNumber(date, ++sequence),
        })) };
        await tx.communicationRequest.createMany({ data: input.lines.map(({ inquiry }, index) => ({
          id: result.lines[index].inquiryId, buyerId, rfqNumber: result.lines[index].rfqNumber,
          buyerMessage: buildSpecSummary(inquiry), fabricName: getFabricName(inquiry),
          quantity: inquiry.quantity, deliveryPincode: inquiry.deliveryPincode,
          targetPriceMin: inquiry.targetPriceMin, targetPriceMax: inquiry.targetPriceMax,
          requiredDeliveryDate: inquiry.requiredDeliveryDate ? new Date(inquiry.requiredDeliveryDate) : null,
          productionCycle: inquiry.productionCycle, buyerImageUrls: inquiry.referenceImageUrls,
          contactPhone: inquiry.contactPhone, anonymizedBuyerReference: buildAnonymizedRequesterReference(buyerId, 'BUYER'),
          ...determineRouting(inquiry),
          specPayload: { origin: 'buyer_batch', composition: getComposition(inquiry), fabricStructure: inquiry.fabricStructure,
            endUse: inquiry.endUse, data: inquiry },
        })) });
        // Matching only writes local records. Commit those records with the requests and receipt.
        for (const line of result.lines) await generateMatchesForCommunicationRequest(tx, line.inquiryId);
        const complete = result.lines.map(line => line.lineId);
        await tx.rfqBatch.create({ data: { id: result.batchId, buyerId, idempotencyKey: input.idempotencyKey,
          payloadHash, result, claimedLineIds: complete, completedLineIds: complete } });
        return { ...result, dispatch: { claimed: complete.length, completed: complete.length, failed: 0 } };
      }, { maxWait: 15000, timeout: 30000 });
    } catch (error) {
      if (attempt < 4 && error && typeof error === 'object' && 'code' in error && ['P2002', 'P2034'].includes(String(error.code))) continue;
      throw error;
    }
  }
}
