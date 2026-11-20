import { NUMBER } from "./measurements";
import type { TextFields } from "./types";
import { FIBRE_PATTERN } from "./fibres";
import { pantoneMentions } from "./pantone";

/** Protect syntactic roles even when explicit parsing rejected a conflict/range.
 * These spans are exclusions, not new measurements or assumptions about units. */
export function protectedNumbers(text: string, result: TextFields): boolean[] {
  const blocked = new Array<boolean>(text.length).fill(false);
  const protect = (start: number, end: number) => { for (let i = start; i < end; i++) blocked[i] = true; };
  for (const item of result.evidence) protect(item.start, item.end);
  for (const item of pantoneMentions(text)) protect(item.index!, item.index! + item[0].length);
  const range = `${NUMBER}(?:\\s*(?:[-–—/]|to|[xX×]|±|\\+/-)\\s*${NUMBER})+`;
  const unit = '(?:%|gsm|glm|g[\\s·•.-]*m(?:⁻²|[−-]2)|(?:grams?|gms?|g)\\s*(?:\\/|per)?\\s*(?:m[²2]|m\\^2|sqm|sq\\.?\\s*m\\.?|sqmt|square\\s+met(?:re|er)s?|sq\\s+met(?:re|er)s?)|oz\\b|ounces?\\b|kg\\b|kilograms?\\b|["″”]|inches\\b|inch\\b|ins?\\b|inchs\\b|cms?\\b|mm\\b|centimet(?:re|er)s?\\b|(?:(?:linear|running)\\s+)?(?:metres?|meters?|mtrs?|m|yards?|yds?)\\b|rolls?\\b|pieces?\\b|pcs?\\b|days?\\b|weeks?\\b|s\\b|d\\b|denier\\b|gg\\b|epi\\b|ppi\\b|ppl\\b)';
  const labels = '(?:gsm|glm|grammage|fabric\\s+weight|sample\\s+weight|swatch\\s+weight|oz|ounces?|weight|width|length|dimensions?|size|count|warp(?: yarn)? count|weft(?: yarn)? count|yarn count|gauge|gg|denier|epi|ppi|ppl|ends per inch|picks per inch|reed|pick|price|target price|rate|cost|budget|article|code|sku|shade|colou?r|moq|stock|available|sample|swatch|yardage|delivery|dispatch|tolerance|shrinkage)';
  const expressions = [
    new RegExp(range, "giu"),
    new RegExp(`${NUMBER}\\s*${unit}`, "giu"),
    new RegExp(`${NUMBER}\\s*(?:percent|pct|per cent)\\b|\\b(?:${FIBRE_PATTERN})\\s+${NUMBER}\\b|${NUMBER}\\s+(?:${FIBRE_PATTERN})\\b`, "giu"),
    new RegExp(`\\b${labels}\\b[^,;\\n.!?\\d]{0,40}${NUMBER}`, "giu"),
    // A technical/commercial label scopes alternatives until a clause delimiter.
    new RegExp(`\\b${labels}\\b[^,;\\n.!?]*`, "giu"),
    new RegExp(`\\b(?:moq|stock|available|sample|swatch|yardage|shade|colou?r|navy|blue|black|price|rate)\\b[^,;\\n.!?\\d]{0,30}${NUMBER}(?:\\s*${unit})?(?:\\s*(?:,|and|or)\\s*${NUMBER}(?:\\s*${unit})?)+`, "giu"),
    new RegExp(`${NUMBER}\\s*(?:GSM|GLM|EPI|PPI|PPL|ends per inch|picks per inch|reed|pick)\\b`, "giu"),
    /\b\d{4}[-/]\d{1,2}[-/]\d{1,2}\b|\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b/gu,
    new RegExp(`(?:₹|\\$|€|£|\\bINR|\\bRs\\.?|\\bUSD)\\s*${NUMBER}|${NUMBER}\\s*(?:INR|USD|Rs|rupees)\\b`, "giu"),
    new RegExp(`${NUMBER}\\s*(?:/|per\\s+)\\s*(?:metres?|meters?|m|m[²2]|yards?|yds?|kg|rolls?|pieces?)\\b`, "giu"),
    new RegExp(`${NUMBER}\\s*(?:wide|width|long|length|thick|thickness|height)\\b`, "giu"),
    new RegExp(`(?<![\\p{L}\\p{N}])[-−]\\s*${NUMBER}`, "giu"),
    new RegExp(`\\b(?:not|instead of|replacing|replace|ignore(?: the)? earlier|earlier)\\s*(?:₹|\\$|€|£|\\bINR|\\bRs\\.?)?\\s*${NUMBER}`, "giu"),
    /\b[\p{L}\p{N}]+[-_][\p{L}\p{N}_-]+\b/gu,
    new RegExp(`\\b(?:navy(?: blue)?|light blue|dark blue|blue|black|white|red|green|beige|grey|gray|pink|yellow|teal)\\b\\s*[:=-]?\\s*${NUMBER}`, "giu"),
    // Numbered items and ordinal IDs, not fabric measurements.
    /^\s*\d+[.)](?=\s)/gm,
    new RegExp(`(?:±|\\+/-)\\s*${NUMBER}|${NUMBER}\\s*(?:±|\\+/-)\\s*${NUMBER}`, "giu"),
    new RegExp(`${NUMBER}\\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)(?:\\s+${NUMBER})?`, "giu"),
    /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{2,4})?\b/giu,
    new RegExp(`${NUMBER}\\s*(?:washes?|home\\s+washes?|launderings?|cycles?)\\b`, "giu"),
    new RegExp(`\\b(?:UPF|durability)\\s*[:=]?\\s*${NUMBER}\\+?`, "giu"),
    new RegExp(`(?:colou?r\\s+)?fastness\\s*(?:to\\s+[a-z]+\\s*)?(?:grade|rating)?\\s*[:=]?\\s*${NUMBER}`, "giu"),
    new RegExp(`lab\\s*dips?\\s*(?:in|within)?\\s*${NUMBER}\\s*days?`, "giu"),
  ];
  for (const expression of expressions) for (const match of text.matchAll(expression)) protect(match.index!, match.index! + match[0].length);
  return blocked;
}
