import { z } from "zod";
export const evidenceSchema = z.object({
  field: z.string().max(100), text: z.string().max(32000), start: z.number().int().nonnegative(), end: z.number().int().nonnegative(),
  kind: z.enum(["explicit", "inferred", "unresolved"]).optional(), value: z.number().finite().positive().optional(),
  unit: z.string().max(60).optional(), reason: z.string().max(1000).optional(), applied: z.boolean().optional(),
});
export type Evidence = z.infer<typeof evidenceSchema>;
export type TextFields = {
  blend: string; width?: string; gsm?: number; quantity?: number; count: string; construction: string;
  finish: string; colours: { name: string; metres: string; sourceText?: string }[]; endUse?: string;
  notes: string; warnings: string[]; evidence: Evidence[];
  gsmMin?: number;
  gsmMax?: number;
  gsmQualifier?: string;
  gsmTolerance?: number;
  gsmAlternatives?: number[];
  gsmBound?: { value: number; operator: ">" | ">=" | "<" | "<="; label: string };
  quantityBound?: { value: number; operator: ">" | ">=" | "<" | "<="; label: string };
  quantityQualifier?: string;
  targetPriceAmount?: number;
  targetPriceCurrency?: string;
  targetPriceCurrencySymbol?: string;
  targetPriceCurrencyUnresolved?: boolean;
  targetPriceBasis?: "per_metre" | "per_yard" | "per_kg" | "per_piece" | "per_roll" | "unspecified";
  targetPriceQualifier?: string;
  targetPriceIndicative?: boolean;
  targetPriceOperator?: ">" | ">=" | "<" | "<=";
  targetPriceStatus?: "exact" | "range" | "approximate" | "indicative" | "tolerance" | "alternatives" | "bound";
  targetPriceMin?: number;
  targetPriceMax?: number;
  targetPriceTolerance?: number;
  targetPriceCommercialQualifiers?: string[];
  targetPriceConfirmed?: boolean;
  finishQualifiers?: string[];
  finishExclusions?: string[];
  finishAlternatives?: string[];
  finishConfirmed?: boolean;
  colourExclusions?: string[];
  colourAlternatives?: string[];
  colourReferences?: string[];
  coloursConfirmed?: boolean;
  fibreQualifiers?: string[];
  compositionReview?: string;
  weightInput?: {
    value: number;
    unit: "glm" | "oz/yd2" | "oz/m2" | "bare_oz" | "gsm";
    rawText: string;
    rawUnit: string;
    min?: number;
    max?: number;
    tolerance?: number;
    basis?: string;
  };
  gsmProvenance?: "extracted" | "derived" | "manual" | "cleared";
  gsmDerivedReason?: string;
  gsmDefaultWidthUsed?: boolean;
  gsmWidthUsed?: string;
};
export function evidence(field: string, match: RegExpMatchArray, reason?: string): Evidence {
  return { field, kind: "explicit", text: match[0], start: match.index!, end: match.index! + match[0].length, ...(reason ? { reason } : {}) };
}
