import type { PrismaClient, Prisma } from '@prisma/client';
import { runChatTool } from './tools.js';
import { sourcingIntent } from './local-intent.js';

type History = { role: string; content: string; metadata?: Prisma.JsonValue | null }[];
export type LocalReply = { content: string; metadata: Record<string, Prisma.InputJsonValue> };
const help = 'I can search active fabrics and approved suppliers, check your inquiries and released quote counts, and help prepare an RFQ. Try “cotton twill 150 GSM”, “suppliers in Surat”, or “show my inquiries”. For a custom RFQ, choose **New RFQ**, review the specifications and delivery details, then submit.';
const json = (value: unknown): Prisma.InputJsonValue => JSON.parse(JSON.stringify(value));

export async function localAssistant(db: PrismaClient, userId: string, message: string, history: History, fallback = false): Promise<LocalReply | null> {
  const text = message.trim().toLowerCase();
  const metadata: Record<string, Prisma.InputJsonValue> = { responseMode: 'local' };
  const reply = (content: string) => ({ content, metadata });
  if (/^(?:hi+|hey+|hello+|namaste|good\s+(?:morning|afternoon|evening))[!.,\s]*$/i.test(text)) return reply('Hello! Welcome to MyloNex. ' + help);
  if (/^(?:thanks?(?: you)?|thank you|ok(?:ay)?|great|bye)[!.,\s]*$/i.test(text)) return reply('You’re welcome! I’m here whenever you need help with fabrics, suppliers or your RFQs.');
  if (/\b(?:how are you|who are you|what can you do|help|support|how (?:do|can|to|should)|create (?:an? )?(?:rfq|inquiry)|submit (?:an? )?(?:rfq|inquiry))\b/i.test(text)) return reply(help);
  if (/\b(?:what is|what does|explain|meaning of)\b.*\b(?:gsm|moq|rfq|twill|greige)\b/i.test(text)) {
    const term = text.match(/\b(gsm|moq|rfq|twill|greige)\b/)?.[1];
    const answers: Record<string, string> = {
      gsm: 'GSM means grams per square meter: the weight of one square meter of fabric. It helps compare fabric weight; suitability also depends on fibre, weave and finish.',
      moq: 'MOQ means minimum order quantity. Check the fabric listing and supplier quote for the applicable quantity and shade conditions.',
      rfq: 'An RFQ is a Request for Quotation. Share the fabric specifications, quantity, delivery location and timeline so suppliers can quote. Use New RFQ to review and submit it.',
      twill: 'Twill is a weave with a diagonal pattern. Tell me the fibre, GSM, width and quantity you need, and I can help search the catalog.',
      greige: 'Greige is fabric before final processing such as dyeing or printing. Specify the required finish and finished width when preparing your RFQ.',
    };
    return reply(answers[term!]);
  }
  if (/\b(?:categor(?:y|ies)|weaves? and states|fabric types)\b/i.test(text)) {
    const result = await runChatTool(db, userId, 'get_catalog_categories', {}) as { fibers: string[]; weaves: string[]; states: string[] };
    return reply(`MyloNex supports these sourcing options:\n- **Fibres:** ${result.fibers.join(', ')}\n- **Weaves:** ${result.weaves.join(', ')}\n- **Fabric states:** ${result.states.join(', ')}\n\nAvailability comes from active listings. Tell me the fabric you need, or open Fabrics to browse.`);
  }
  if (/\b(?:my|recent|past|status|track|check|show|list)\b.*\b(?:inquir(?:y|ies)|rfqs?|quotes?|responses?)\b|\b(?:inquir(?:y|ies)|rfqs?)\b.*\b(?:status|track|quote)\b/i.test(text)) {
    const rows = await runChatTool(db, userId, 'get_my_inquiries', {}) as { id: string; rfqNumber: string; fabricName: string; quantity: number; status: string; _count: { matches: number } }[];
    metadata.inquiries = json(rows.map(row => ({ id: row.id, rfqNumber: row.rfqNumber, fabricName: row.fabricName })));
    return reply(rows.length ? 'Here are your recent inquiries:\n' + rows.map(row =>
      `- **${row.rfqNumber}** — ${row.fabricName}, ${row.quantity} m; status: ${row.status.replaceAll('_', ' ')}; released quotes: ${row._count.matches}.`).join('\n') + '\n\nOpen an inquiry below to review the available quotes and next steps.'
      : 'You do not have any inquiries yet. Choose **New RFQ** to describe what you need, or browse **Fabrics** and request a production quote.');
  }
  const intent = sourcingIntent(message, history);
  if (/\b(?:suppliers?|mills?|manufacturers?|traders?)\b/i.test(text)) {
    if (/\b(?:in|from|based)\b/i.test(text) && !intent.city) return reply('Which city should I search? You can also browse Fabrics for active listings from approved suppliers.');
    const rows = await runChatTool(db, userId, 'search_suppliers', { ...(intent.city ? { city: intent.city } : {}) }) as { companyName: string; city: string | null }[];
    return reply(rows.length ? `Approved suppliers${intent.city ? ' in ' + intent.city : ''}:\n` + rows.map(row => `- **${row.companyName}**${row.city ? ' — ' + row.city : ''}`).join('\n') + '\n\nBrowse Fabrics or create an RFQ to request a quote.'
      : `No approved suppliers${intent.city ? ' in ' + intent.city : ''} matched this search. You can still create a custom RFQ for review.`);
  }
  if (intent.sourcing && intent.hasSpecs) {
    const r = intent.requirement;
    // The read-only tool validates every extracted value and retains buyer ownership.
    const rows = await runChatTool(db, userId, 'search_fabrics', {
      ...(r.fiberType ? { query: r.fiberType } : {}), ...(r.weave ? { weave: r.weave } : {}),
      ...(r.gsmMin ? { gsmMin: r.gsmMin } : {}), ...(r.gsmMax ? { gsmMax: r.gsmMax } : {}), ...(intent.city ? { city: intent.city } : {}),
    }) as { fabricName: string; gsm: number; weaveType: string }[];
    metadata.requirement = json(r); metadata.fabrics = json(rows);
    const missing = [!r.fiberType && 'fibre/composition', !r.weave && 'weave', !r.gsmMin && !r.gsmMax && 'GSM', !r.width && 'width with units', !r.quantity && 'quantity in meters'].filter(Boolean);
    return reply('I’ve noted the specifications in the requirement card below. ' + (rows.length
      ? `I found ${rows.length} active catalog listing(s) matching the fibre, weave and GSM filters supplied. Check width, MOQ, shade and availability in each listing before requesting a quote.`
      : 'No active catalog listings matched those filters. You can prepare a custom RFQ for review.') +
      (missing.length ? '\n\nPlease also provide: ' + missing.join(', ') + '.' : '') + '\n\nUse **Review in RFQ builder** to check all specifications and add delivery details before submitting.');
  }
  if (intent.sourcing && /\b(?:browse|show|find|search|catalog|available)\b/i.test(text)) {
    const rows = await runChatTool(db, userId, 'search_fabrics', {}) as unknown[];
    metadata.fabrics = json(rows);
    return reply(rows.length ? 'Here are some recent active fabrics from approved suppliers. Tell me your fibre, weave and GSM to narrow the search.' : 'There are no matching active catalog listings to show. Choose New RFQ to prepare a custom requirement.');
  }
  return fallback ? reply('I can help with guided sourcing and buyer account tasks. ' + help + '\n\nFor a complex textile question, please give specific details or use the RFQ form for review.') : null;
}
