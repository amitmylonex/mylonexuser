import { clauseAt } from "./context";
import { normalizeTerm } from "./vocabulary";

/** A request verb can govern a coordinated list, bounded by its clause or an
 * explicit positive reset. A later "not rib knit" never reaches backwards. */
export function negatedWeaveRanges(text: string) {
  const ranges: { start: number; end: number }[] = [];
  for (const match of text.matchAll(/\b(?:not|no|non|without|don['’]t|doesn['’]t)\b\s*[-–—]?\s*(?:(?:want|need|require|use|include|quote|supply|accept|request)\b\s*)?/gi)) {
    const start = match.index!, contentStart = start + match[0].length;
    const clause = clauseAt(text, start, contentStart);
    const tail = text.slice(contentStart, clause.end);
    const reset = tail.search(/\b(?:but|however|instead|rather|we\s+(?:want|need|require)|please\s+quote)\b/i);
    ranges.push({ start, end: reset < 0 ? clause.end : contentStart + reset });
  }
  return ranges;
}

export function negatedWeaveSpan(text: string, start: number, end: number, ranges = negatedWeaveRanges(text)) {
  return ranges.some(range => range.start < end && start < range.end) ||
    /\b(?:not|no|without)\s*$/.test(normalizeTerm(text.slice(0, start)));
}
