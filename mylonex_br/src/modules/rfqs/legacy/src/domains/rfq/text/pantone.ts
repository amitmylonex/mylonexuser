import reference from "../../../../config/textile-pantone-reference.json" with { type: "json" };
import { evidence, type TextFields } from "./types.js";
import { inactiveMention } from "./intent.js";

export const TEXTILE_PANTONE = /\b(?:(?:Pantone|PMS)\s*)?(1[1-9])[- ](\d{4})\s*(TCX|TPX|TPG|TSX)?\b/gi;
const names = new Map(reference.entries.map(entry => [entry.code.toUpperCase(), entry]));

export function pantoneMentions(text: string) {
  const textile = [...text.matchAll(TEXTILE_PANTONE)].filter(m => /pantone|pms|tcx|tpx|tpg|tsx/i.test(m[0]));
  const graphics = [...text.matchAll(/\b(?:PMS|Pantone)\s+\d{3,4}\s*[CUM]\b/gi)];
  return [...textile, ...graphics].sort((a, b) => a.index! - b.index!);
}
export function normalizePantone(raw: string): string | undefined {
  const match = pantoneMentions(raw).find(m => m[0].trim().length === raw.trim().length);
  if (!match) return undefined;
  if (!match[1]) return match[0].replace(/\s+/g, " ").toUpperCase();
  return `${/^pantone/i.test(raw) ? "Pantone " : /^pms/i.test(raw) ? "PMS " : ""}${match[1]}-${match[2]}${match[3] ? ` ${match[3].toUpperCase()}` : ""}`;
}
export function extractPantone(text: string, result: TextFields) {
  for (const match of pantoneMentions(text)) {
    const start = match.index!, end = start + match[0].length;
    if (inactiveMention(text, start, end)) continue;
    const name = normalizePantone(match[0])!;
    if (!result.colours.some(c => normalizePantone(c.name) === name)) result.colours.push({ name, sourceText: match[0], metres: "" });
    result.evidence.push(evidence("colour", match));
    if (!match[1]) result.warnings.push(`Graphics reference ${name}; confirm a textile reference. No equivalent was invented.`);
    else if (!match[3]) result.warnings.push(`Pantone suffix unspecified for ${name}; no swatch system was assumed.`);
    else if (/TPX|TPG/i.test(match[3])) result.warnings.push(`Pantone paper reference ${name} retained without conversion.`);
    const entry = names.get(`${match[1]}-${match[2]} ${match[3]}`.toUpperCase());
    if (entry) {
      const note = `Workbook reference: ${entry.code} = ${entry.name} (Pantone row ${entry.row}; supplied workbook mapping, not independently verified).`;
      result.notes = [result.notes, note].filter(Boolean).join("\n");
    }
  }
}
