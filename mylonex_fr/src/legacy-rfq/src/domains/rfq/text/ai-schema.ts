import { z } from "zod";

export const AI_FIELDS = ["blend", "count", "construction", "gsm", "width", "quantity", "perColourQuantity", "colour", "fabricState", "productionCycle", "weaveType", "finish", "yarnType", "dyeMethod", "dyeColorType", "printMethod", "printBaseType", "requiredDeliveryDate", "endUse", "targetPriceMax", "customFabricName"] as const;
export const aiFieldSchema = z.object({
  field: z.enum(AI_FIELDS), value: z.string().min(1).max(1000),
  sourcePhrases: z.array(z.string().min(1).max(32000)).min(1).max(20),
  interpretation: z.enum(["explicit", "inferred", "conflicting"]),
}).strict();
export const aiFabricSchema = z.object({
  source: z.string().min(1).max(32000),
  fields: z.array(aiFieldSchema).max(100),
  yarns: z.array(z.object({ direction: z.enum(["warp", "weft"]), source: z.string().min(1).max(2000), blend: z.string().max(500).nullable() }).strict()).max(2),
  alternatives: z.array(z.string().min(1).max(32000)).max(100),
  issues: z.array(z.object({ field: z.enum(AI_FIELDS).nullable(), source: z.string().min(1).max(32000), message: z.string().min(1).max(1000) }).strict()).max(100),
}).strict();
export const aiExtractionSchema = z.object({ fabrics: z.array(aiFabricSchema).min(1).max(200) }).strict();
export const textExtractionResponseSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("ai-assisted"), fabrics: z.array(aiFabricSchema).min(1).max(200), proposals: z.array(aiFabricSchema).min(1).max(200).optional() }).strict(),
  z.object({ mode: z.literal("deterministic"), reason: z.string().min(1).max(1000) }).strict(),
]);
export type AiField = z.infer<typeof aiFieldSchema>;
export type AiFabric = z.infer<typeof aiFabricSchema>;
export type AiExtraction = z.infer<typeof aiExtractionSchema>;
