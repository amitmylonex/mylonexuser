import { FIBRE_PATTERN } from "./fibres.js";
import { cleanQualifier, FIBRE_MODIFIERS_PATTERN, resolveFibreCandidate } from "./composition-attributes.js";
import { compositionNumberScope } from "./composition-number-scope.js";

type Percentage = ReturnType<typeof resolveFibreCandidate> & { percentage: string; start: number; end: number; text: string };

/** The existing percentage-before/after rules, with bounded modifier tokens. */
export function explicitPercentages(scope: string): Percentage[] {
  const candidates: Percentage[] = [];
  // A comma beside a labelled/typed technical number is a field boundary,
  // including when no whitespace separates it from the next percentage.
  const scan = /\d\s*,\s*\d+(?:[.,]\d+)?\s*(?:%|percent\b|pct\b)/i.test(scope) ? compositionNumberScope(scope) : scope;
  const before = new RegExp(`(?<![\\d.])(?<![\\d.],)(\\d+(?:[.,]\\d+)?)\\s*(?:%|percent\\b|pct\\b)(?:\\s*of)?\\s*[,/;-]?\\s*(${FIBRE_MODIFIERS_PATTERN})(${FIBRE_PATTERN})\\b`, "gi");
  const after = new RegExp(`\\b(${FIBRE_MODIFIERS_PATTERN})(${FIBRE_PATTERN})\\s*[:=-]?\\s*(?:\\(\\s*)?(\\d+(?:[.,]\\d+)?)\\s*(?:%|percent\\b|pct\\b)(?:\\s*\\))?`, "gi");
  const firstPct = scan.search(/\d+(?:[.,]\d+)?\s*(?:%|percent\b|pct\b)/i);
  const firstFibre = scan.search(new RegExp(`\\b(${FIBRE_PATTERN})\\b`, "i"));
  const order = firstPct !== -1 && (firstFibre === -1 || firstPct < firstFibre) ? [before, after] : [after, before];
  for (const expression of order) for (const match of scan.matchAll(expression)) {
    const percentage = match[expression === before ? 1 : 3].replace(",", ".");
    const qualifier = match[expression === before ? 2 : 1];
    const alias = match[expression === before ? 3 : 2];
    const start = match.index!, end = start + match[0].length;
    // Do not salvage the tail of an unclear spaced decimal/list expression.
    if (expression === before && /\d\s*,\s*$/.test(scan.slice(0, start))) continue;
    if (candidates.some(item => item.start < end && start < item.end) || qualifier && !cleanQualifier(qualifier)) continue;
    candidates.push({ ...resolveFibreCandidate(alias, qualifier), percentage, start, end, text: scope.slice(start, end) });
  }
  return candidates.sort((a, b) => a.start - b.start);
}
