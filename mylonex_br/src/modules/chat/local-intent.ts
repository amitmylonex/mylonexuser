import type { Prisma } from '@prisma/client';

export type Requirement = Record<string, string | number>;
type HistoryMessage = { role: string; content: string; metadata?: Prisma.JsonValue | null };
const fibres = /\b(cotton|polyester|linen|silk|wool|viscose|modal|lyocell|nylon|blended)\b/i;
const weaves = /\b(plain|twill|satin|dobby|jacquard|oxford|canvas|poplin|denim)\b/i;

export function sourcingIntent(message: string, history: HistoryMessage[]) {
  const text = message.toLowerCase();
  const fibre = message.match(fibres)?.[1];
  const weave = message.match(weaves)?.[1];
  const gsmRange = text.match(/\bgsm\s*(?:between|:)?\s*(\d{2,4})\s*(?:-|–|to|and)\s*(\d{2,4})\b|\b(\d{2,4})\s*(?:-|–|to|and)\s*(\d{2,4})\s*gsm\b/i);
  const gsmExact = text.match(/\b(\d{2,4})\s*gsm\b|\bgsm\s*[:=]?\s*(\d{2,4})\b/i);
  const quantity = text.match(/\b(\d[\d,]*(?:\.\d+)?)\s*(?:meters?|metres?|mtrs?|mts?|m)\b/i);
  const width = text.match(/\b(?:width\s*[:=]?\s*)?(\d{2,3}(?:\.\d+)?)\s*(?:inches|inch|in\b|["″])/i);
  const previous = [...history].reverse().find(row => row.role === 'assistant' && row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata) && 'requirement' in row.metadata);
  const stored = previous?.metadata as { requirement?: Requirement } | undefined;
  const continuation = !/\b(?:new requirement|start over|different fabric|find|show|search|need|want)\b/i.test(text)
    && !!(gsmExact || quantity || width || weave) && !!stored?.requirement;
  const requirement: Requirement = continuation ? { ...stored.requirement } : {};
  if (fibre) requirement.fiberType = fibre[0].toUpperCase() + fibre.slice(1);
  if (weave) requirement.weave = weave[0].toUpperCase() + weave.slice(1);
  // Require GSM context to avoid treating construction, blend ratios or quantities as GSM.
  if (gsmRange && /gsm/i.test(message)) {
    const min = Number(gsmRange[1] || gsmRange[3]), max = Number(gsmRange[2] || gsmRange[4]);
    if (min <= max && max <= 3000) { requirement.gsmMin = min; requirement.gsmMax = max; }
  } else if (gsmExact) {
    const value = Number(gsmExact[1] || gsmExact[2]);
    const prefix = text.slice(Math.max(0, gsmExact.index! - 25), gsmExact.index).trim();
    const isMaximum = /\b(?:up to|maximum|max|under|below)\s*[:=]?$/i.test(prefix);
    const isMinimum = /\b(?:at least|minimum|min|above|over)\s*[:=]?$/i.test(prefix);
    if (value <= 3000) {
      if (!isMaximum) requirement.gsmMin = value;
      if (!isMinimum) requirement.gsmMax = value;
    }
  }
  if (quantity) {
    const value = Number(quantity[1].replaceAll(',', ''));
    if (Number.isInteger(value) && value > 0 && value <= 100000000 && !/\b(?:up to|at least|minimum|maximum|under|over)\s*\d[\d,]*\s*(?:m|meter|metre)/i.test(message)) requirement.quantity = value;
  }
  if (width && Number(width[1]) <= 200) requirement.width = Number(width[1]);
  const city = message.match(/\b(?:surat|ahmedabad|bhiwandi|tirupur|coimbatore|mumbai|delhi|ludhiana|salem|bengaluru|bangalore|jaipur|chennai)\b/i)?.[0];
  const sourcing = !!(fibre || weave || continuation || /\b(?:fabric|catalog|cloth|sourcing|source|material)\b/i.test(message));
  return { requirement, city, sourcing, hasSpecs: Object.keys(requirement).length > 0 };
}
