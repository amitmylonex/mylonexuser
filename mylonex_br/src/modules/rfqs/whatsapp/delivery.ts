import type { PrismaClient } from '@prisma/client';

type DeliveryResult = 'sent' | 'rejected' | 'retryable';
type Provider = (matchId: string) => Promise<DeliveryResult>;
const maxAttempts = 3;

// No production trigger or provider is registered. Enable only after the forwarding policy is agreed.
export async function enqueueForwardedDelivery(db: PrismaClient, matchId: string) {
  const match = await db.communicationRequestMatch.findFirst({
    where: { id: matchId, status: 'FORWARDED_TO_SUPPLIER',
      supplier: { status: 'APPROVED', whatsappConsent: true, whatsappConsentAt: { not: null }, phone: { not: null } } },
    select: { id: true },
  });
  if (!match) return false;
  const result = await db.whatsAppWebhookEvent.createMany({
    data: [{ id: 'outbound:supplier-rfq:' + matchId, eventType: 'supplier-rfq-delivery', status: 'QUEUED' }],
    skipDuplicates: true,
  });
  return result.count === 1;
}

export async function runDeliveryJob(db: PrismaClient, id: string, provider: Provider) {
  const job = await db.whatsAppWebhookEvent.findFirst({ where: { id, eventType: 'supplier-rfq-delivery', status: 'QUEUED' } });
  if (!job) return;
  const priorAttempts = Number(job.error ?? 0);
  const attempt = priorAttempts + 1;
  if (priorAttempts && Date.now() - job.updatedAt.getTime() < 30000 * 2 ** (priorAttempts - 1)) return;
  const claim = await db.whatsAppWebhookEvent.updateMany({
    where: { id, eventType: job.eventType, status: 'QUEUED', updatedAt: job.updatedAt },
    data: { status: 'SENDING', error: String(attempt) },
  });
  if (!claim.count) return;

  // SENDING is deliberately never automatically reclaimed. A worker crash or timeout
  // can mean the provider accepted the send. Reconcile before manually requeueing.
  let status = 'UNCERTAIN';
  try {
    const matchId = id.slice('outbound:supplier-rfq:'.length);
    const eligible = await db.communicationRequestMatch.findFirst({
      where: { id: matchId, status: 'FORWARDED_TO_SUPPLIER',
        supplier: { status: 'APPROVED', whatsappConsent: true, whatsappConsentAt: { not: null }, phone: { not: null } } },
      select: { supplier: { select: { phone: true, phoneCountryCode: true } } },
    });
    const number = eligible?.supplier.phone?.trim().replace(/[^+\d]/g, '');
    const normalized = number?.startsWith('+') ? number.slice(1) : number?.startsWith('00')
      ? number.slice(2) : number?.length === 10 && eligible?.supplier.phoneCountryCode === '91' ? '91' + number : number;
    const result = normalized && /^[1-9]\d{9,14}$/.test(normalized) ? await provider(matchId) : 'rejected';
    status = result === 'sent' ? 'PROCESSED' : result === 'retryable' && attempt < maxAttempts ? 'QUEUED' : 'FAILED';
  } catch {
    // Ambiguous transport error. Never retry a potential successful send.
  }
  await db.whatsAppWebhookEvent.updateMany({ where: { id, status: 'SENDING' }, data: { status, error: String(attempt) } });
}
