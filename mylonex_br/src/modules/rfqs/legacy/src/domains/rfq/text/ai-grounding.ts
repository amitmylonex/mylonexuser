import { extractComposition } from "./composition.js";
import { extractMeasurements } from "./measurements.js";
import { extractPlainColours } from "./plain-colours.js";
import { extractPlainQuantities } from "./plain-quantities.js";
import { parseBlendRows, serializeBlend } from "../blend/rows.js";
import { validateBlendRows } from "../blend/validation.js";
import type { TextFields } from "./types.js";
import { positiveCompositionText } from "./plain-context.js";

export const emptyFields = (): TextFields => ({ blend: "", count: "", construction: "", finish: "", colours: [], notes: "", warnings: [], evidence: [] });
export const normalize = (value: string) => value.normalize("NFKC").toLowerCase().replace(/[’‘']/g, "").replace(/[×*]/g, "x").replace(/[\s–—-]+/g, "");
export function measurements(value: string) { const result = emptyFields(); extractMeasurements(value, result); return result; }
export function metres(value: string) { const result = emptyFields(); extractPlainColours(value, result); extractPlainQuantities(value, result, undefined, true); return result.quantity; }
export function perColourMetres(value: string) {
  const result = emptyFields(); extractPlainQuantities(value, result, undefined, true);
  const phrase = result.evidence.find(item => item.field === "per-colour quantity" && item.kind !== "unresolved");
  return phrase ? metres(phrase.text) : undefined;
}
export function canonicalBlend(value: string) {
  const parsed = parseBlendRows(value);
  return { ...parsed, ...validateBlendRows(parsed.rows, parsed.legacyText), value: serializeBlend(parsed.rows, true) };
}
/** Source shorthand is decoded, not a model confidence claim or an assumed average. */
export function sourceComposition(source: string) {
  return sourceCompositionResult(source).blend;
}
export function sourceCompositionResult(source: string) {
  source = positiveCompositionText(source);
  const result = emptyFields(); extractComposition(source, result); return result;
}
export function directionalCompositions(source: string) {
  return [...source.matchAll(/\b[PCV]\s*\/\s*[PCV]\s*\(\s*\d+(?:\.\d+)?\s*\/\s*\d+(?:\.\d+)?\s*\)/gi)]
    .map(match => ({ source: match[0], value: canonicalBlend(sourceComposition(match[0])).value }));
}
export function numbersSupported(value: string, source: string) {
  const requested: string[] = value.normalize("NFKC").match(/\d+(?:\.\d+)?/g) || [];
  const available: string[] = source.normalize("NFKC").match(/\d+(?:\.\d+)?/g) || [];
  return requested.every(number => { const index = available.indexOf(number); if (index < 0) return false; available.splice(index, 1); return true; });
}
export function sourceSpan(source: string, phrase: string) {
  const start = source.indexOf(phrase); if (start < 0) throw new Error("Source phrase was fabricated or belongs to another fabric.");
  return { start, end: start + phrase.length };
}
