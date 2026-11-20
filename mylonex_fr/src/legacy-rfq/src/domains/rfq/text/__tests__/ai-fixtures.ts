import type { AiExtraction, AiField } from "../ai-schema";
export const SIMPLE = '100% cotton 2/1 twill 30x30 110x60 58" ready 1000m dyed';
export const YARNS = '20’s P/V (65/35) × 20’s P/V (65/35) × 100 × 56 × 63” Griege width, 2/2 Twill';
export const OPTIONS = 'OPTION 1 100% GOTS NOP-certified organic cotton\nOPTION 2 BCI cotton.\nOPTION 3 Regen Agri Cotton';
export const A = `A) 16 OE × 16 OE / 96 × 60, 65” RS, 2/2 Matty (OL) –\n${OPTIONS}`;
export const B = `B) 20 CCW × 20 CCW / 96 × 48, 3/1 Drill –\n${OPTIONS}`;
export const COMBINED = `${A}\n\n${B}`;
export const field = (name: AiField["field"], value: string, ...sourcePhrases: string[]): AiField => ({ field: name, value, sourcePhrases, interpretation: "explicit" });
export const extraction = (source: string, fields: AiField[]): AiExtraction => ({ fabrics: [{ source, fields, yarns: [], alternatives: [], issues: [] }] });
export const SIMPLE_AI = extraction(SIMPLE, [field("blend", "100% Cotton", "100% cotton"), field("weaveType", "2/1 twill", "2/1 twill"), field("count", "30x30", "30x30"), field("construction", "110x60", "110x60"), field("width", "58 inches", '58"'), field("productionCycle", "ready_stock", "ready"), field("quantity", "1000 m", "1000m"), field("fabricState", "dyed", "dyed")]);
export const YARNS_AI = extraction(YARNS, [field("count", "20s × 20s", '20’s P/V (65/35) × 20’s P/V (65/35)'), field("construction", "100 × 56", "100 × 56"), field("weaveType", "2/2 Twill", "2/2 Twill"), field("blend", "65% Polyester 35% Viscose", "P/V (65/35)")]);
YARNS_AI.fabrics[0].yarns = ["warp", "weft"].map(direction => ({ direction: direction as "warp" | "weft", source: "20’s P/V (65/35)", blend: "65% Polyester 35% Viscose" }));
export const COMBINED_AI: AiExtraction = { fabrics: [
  { source: A, fields: [field("count", "16 OE × 16 OE", "16 OE × 16 OE"), field("construction", "96 × 60", "96 × 60"), field("width", "65 inches", "65”"), field("productionCycle", "ready_stock", "RS"), field("weaveType", "2/2 Matty", "2/2 Matty")], yarns: [], alternatives: OPTIONS.split("\n"), issues: [{ field: null, source: "(OL)", message: "Confirm the OL qualifier." }] },
  { source: `\n\n${B}`, fields: [field("count", "20 CCW × 20 CCW", "20 CCW × 20 CCW"), field("construction", "96 × 48", "96 × 48"), field("weaveType", "3/1 Drill", "3/1 Drill")], yarns: [], alternatives: OPTIONS.split("\n"), issues: [] },
] };
