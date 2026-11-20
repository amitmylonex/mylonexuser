import { z } from 'zod';

const int = z.number().int().positive().max(2147483647);
const text = z.string().trim();
export const idSchema = z.object({ id: z.uuid() });
export const productionRfq = z.object({
  selectedPath: z.literal('production'),
  fabricId: z.uuid(),
  quantity: int,
  deliveryPincode: text.min(3),
  deliveryCountry: text.min(1).optional(),
  deliveryState: text.min(1).optional(),
  deliveryCity: text.min(1).optional(),
  contactPhone: text.min(10),
  targetPriceMin: z.number().positive().optional(),
  targetPriceMax: z.number().positive().optional(),
  requiredDeliveryDate: z.iso.date().optional(),
  productionCycle: z.enum(['ready_stock', 'running_production', 'made_to_order']).optional(),
  buyerMessage: text.max(500).optional(),
  referenceImageUrls: z.array(z.url()).max(5).optional(),
  selectedShadeIds: z.array(text.min(1)).min(1).max(100)
    .refine(ids => new Set(ids).size === ids.length, 'Selected shades must be unique').optional(),
}).refine(input => !input.targetPriceMin || !input.targetPriceMax || input.targetPriceMax >= input.targetPriceMin,
  { path: ['targetPriceMax'], message: 'Target price max must be greater than or equal to target price min' });
export type ProductionRfq = z.infer<typeof productionRfq>;

const charge = z.coerce.number().nonnegative().optional();
const optionalTrimmed = text.transform(value => value || undefined).optional();
export const quote = z.object({
  price: z.coerce.number().positive().max(9999999999.99),
  leadTimeDays: z.coerce.number().int().positive().max(2147483647),
  moq: z.coerce.number().int().positive().max(2147483647),
  dispatchLocation: text.min(1),
  quoteType: z.enum(['exact', 'indicative']).default('indicative'),
  sampleAvailability: optionalTrimmed,
  additionalNotes: optionalTrimmed,
  notes: optionalTrimmed,
  totalValueEstimate: z.object({ gst: charge, delivery: charge, otherCharges: charge, total: charge }).optional(),
  responseImageUrls: z.array(z.url()).default([]),
});
export type Quote = z.infer<typeof quote>;

export const review = z.object({ decision: z.enum(['approve', 'reject']), note: text.max(1000).optional() });
