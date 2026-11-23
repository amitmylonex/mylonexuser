import { z } from 'zod';
import type { PrismaClient, Prisma } from '@prisma/client';
import type { ChatCompletionTool } from 'openai/resources/chat/completions';
import { availableFabrics } from '../rfqs/service.js';

const text = z.string().trim().min(1).max(120).optional();
const search = z.object({ query: text, city: text, weave: text,
  gsmMin: z.number().int().min(1).max(3000).optional(), gsmMax: z.number().int().min(1).max(3000).optional(),
}).strict();
const requirement = z.object({
  fiberType: text, weave: text, gsmMin: z.number().positive().max(3000).optional(),
  gsmMax: z.number().positive().max(3000).optional(), width: z.number().positive().max(200).optional().describe('Width in inches, only if explicitly supplied with a known unit. Omit ambiguous or missing width.'),
  quantity: z.number().int().positive().max(100000000).optional().describe('Quantity in meters. Do not guess a quantity or convert kilograms without an explicitly supplied conversion.'), deliveryTimeline: text, notes: z.string().max(1000).optional(),
}).strict();
export const toolSchemas = {
  search_fabrics: search,
  search_suppliers: z.object({ query: text, city: text }).strict(),
  get_my_inquiries: z.object({ limit: z.number().int().min(1).max(10).default(5) }).strict(),
  get_catalog_categories: z.object({}).strict(),
  extract_sourcing_requirement: requirement,
};
const descriptions = {
  search_fabrics: 'Search active fabrics from approved suppliers; use separate fiber query, weave and GSM filters.',
  search_suppliers: 'Find approved supplier company names and cities. No private contact details.',
  get_my_inquiries: 'Read the signed-in buyer’s recent inquiries and released quote counts.',
  get_catalog_categories: 'Read supported fabric and sourcing categories.',
  extract_sourcing_requirement: 'Capture only explicitly supplied sourcing specifications, accumulating earlier messages. Never invent missing specifications.',
};
export const chatTools: ChatCompletionTool[] = Object.entries(toolSchemas).map(([name, schema]) => ({
  type: 'function', function: { name, description: descriptions[name as keyof typeof descriptions], parameters: z.toJSONSchema(schema) },
}));

export async function runChatTool(db: PrismaClient, userId: string, name: string, input: unknown) {
  switch (name) {
    case 'search_fabrics': {
      const args = search.parse(input);
      const filters: Prisma.SupplierCatalogWhereInput[] = [availableFabrics];
      if (args.query) filters.push({ OR: [
        { fabricName: { contains: args.query, mode: 'insensitive' } },
        { compositionText: { contains: args.query, mode: 'insensitive' } },
      ] });
      if (args.city) filters.push({ OR: [{ city: { contains: args.city, mode: 'insensitive' } }, { supplier: { city: { contains: args.city, mode: 'insensitive' } } }] });
      if (args.weave) filters.push({ weaveType: { contains: args.weave, mode: 'insensitive' } });
      if (args.gsmMin || args.gsmMax) filters.push({ gsm: { gte: args.gsmMin, lte: args.gsmMax } });
      return db.supplierCatalog.findMany({ where: { AND: filters }, take: 6, orderBy: { createdAt: 'desc' },
        select: { id: true, fabricName: true, compositionText: true, weaveType: true, gsm: true, widthInches: true,
          pricePerMeter: true, minimumOrderQuantity: true, productionCycle: true, leadTimeDays: true,
          supplier: { select: { companyName: true, city: true } } },
      });
    }
    case 'search_suppliers': {
      const args = toolSchemas.search_suppliers.parse(input);
      return db.supplierProfile.findMany({ where: { status: 'APPROVED',
        ...(args.city ? { city: { contains: args.city, mode: 'insensitive' as const } } : {}),
        ...(args.query ? { companyName: { contains: args.query, mode: 'insensitive' as const } } : {}),
      }, take: 6, orderBy: { id: 'asc' }, select: { companyName: true, city: true } });
    }
    case 'get_my_inquiries': {
      const { limit } = toolSchemas.get_my_inquiries.parse(input);
      return db.communicationRequest.findMany({ where: { buyerId: userId, requesterRole: 'BUYER' }, take: limit,
        orderBy: { createdAt: 'desc' }, select: { id: true, rfqNumber: true, fabricName: true, quantity: true, status: true,
          createdAt: true, _count: { select: { matches: { where: { response: { status: { in: ['APPROVED_FOR_REQUESTER', 'ACCEPTED_BY_BUYER'] } } } } } } },
      });
    }
    case 'get_catalog_categories':
      toolSchemas.get_catalog_categories.parse(input);
      return { fibers: ['Cotton', 'Polyester', 'Silk', 'Wool', 'Linen', 'Viscose', 'Blended'],
        weaves: ['Plain', 'Twill', 'Satin', 'Dobby', 'Jacquard', 'Oxford', 'Canvas', 'Poplin'],
        states: ['Greige', 'RFD', 'Dyed', 'Printed'], productionCycles: ['ready_stock', 'running_production', 'made_to_order'] };
    case 'extract_sourcing_requirement': return { requirement: requirement.parse(input), nextStep: 'Review these specifications in the RFQ builder before submitting.' };
    default: throw new Error('Unknown chat tool');
  }
}
