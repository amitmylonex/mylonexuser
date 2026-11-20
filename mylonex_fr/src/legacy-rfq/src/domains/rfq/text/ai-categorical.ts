import type { AiField } from "./ai-schema";
import { explicitWeaveContext } from "../weave/context";
import { supplyStates } from "./supply-state";
import { inactiveMention, ringSpunCode } from "./intent";

/** Explicit controlled vocabulary, resolved independently of model confidence. */
export function categoricalFields(source: string): AiField[] {
  const result: AiField[] = [];
  const patterns: [AiField["field"], string, RegExp][] = [
    ["productionCycle", "ready_stock", /\b(?:ready(?: stock)?(?!\s+for\s+dyeing)|RS)\b/gi],
    ["productionCycle", "running_production", /\brunning(?: production)?\b/gi],
    ["productionCycle", "made_to_order", /\bmade[ _-]+to[ _-]+order\b/gi],
  ];
  for (const [field, value, pattern] of patterns) for (const match of source.matchAll(pattern)) {
    if (/^rs$/i.test(match[0]) && explicitWeaveContext(source, match.index!, match.index! + match[0].length)) continue;
    if (/^rs$/i.test(match[0]) && ringSpunCode(source, match.index!, match.index! + match[0].length)) continue;
    if (inactiveMention(source, match.index!, match.index! + match[0].length)) continue;
    const before = source.slice(Math.max(0, match.index! - 50), match.index!);
    const after = source.slice(match.index! + match[0].length);
    if (/\b(?:not|no|without|name|named|called|print base|base|colou?r)\s*[:=]?\s*$/i.test(before)) continue;
    if (field === "fabricState" && (/^\s+width\b/i.test(after) || /\bwidth\s*[:=]?\s*$/i.test(before))) continue;
    if (field === "fabricState" && /(?:yarn|piece)[ _-]+$/i.test(before)) continue;
    if (/^rs$/i.test(match[0]) && (/^\s*\.?\s*\d/.test(after) || /\b(?:price|rate|target|INR)\b[^,;\n]*$/i.test(before))) continue;
    result.push({ field, value, sourcePhrases: [match[0]], interpretation: "explicit" });
  }
  for (const { match, value } of supplyStates(source)) result.push({ field: "fabricState", value, sourcePhrases: [match[0]], interpretation: "explicit" });
  return result;
}
