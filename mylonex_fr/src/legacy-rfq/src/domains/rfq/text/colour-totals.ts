import { COLOUR, normalizeColour } from "./colours";
import { NUMBER, numeric } from "./measurements";
import { pantoneMentions, normalizePantone } from "./pantone";
import type { TextFields } from "./types";

export function hasIncompleteColourList(text: string) {
  return /\b(?:including|incl\.?|such as|partial(?:ly)?|TBC|TBA|remaining|(?:other|additional|more|another|unnamed|unspecified)\s+(?:colou?rs?|shades?))\b/i.test(text);
}

/** Group-local allocation ledger. Never infer a total from incomplete choices. */
export function reconcileColourTotal(text: string, result: TextFields) {
  const unit = "(?:metres?|meters?|metrs|mtrs?|mts|m|yards?|yds?)";
  const amount = `(${NUMBER})(?:\\s*([-–—]|to)\\s*${NUMBER})?\\s*[([]?\\s*(${unit})\\b(?![²2])\\.?\\s*[)\\]]?`;
  const patterns = [
    new RegExp(`\\b(${COLOUR})\\s*[:=–—-]?\\s*${amount}`, "gi"),
    new RegExp(`${amount}\\s*(?:in\\s+|of\\s+|for\\s+|shade\\s+|colou?r\\s+)?(${COLOUR})\\b`, "gi")
  ];
  const allocations = new Map<string, number>();
  let uncertain = false;
  let calculationSpan: { start: number; end: number } | undefined;
  const allocationSpans: { start: number; end: number }[] = [];
  for (const [index, regex] of patterns.entries()) for (const match of text.matchAll(regex)) {
    const name = normalizeColour(match[index === 0 ? 1 : 4]).name;
    if (index === 1 && (/\n/.test(match[0]) || /^\s*[:=–—-]\\s*\d/.test(text.slice(match.index! + match[0].length))
      || /^\s+(?:finish|finishing|treatment)\b/i.test(text.slice(match.index! + match[0].length)))) continue;
    const value = numeric(match[index === 0 ? 2 : 1]) * (/^(?:yard|yd)/i.test(match[index === 0 ? 4 : 3]) ? 0.9144 : 1);
    const prefix = text.slice(0, match.index!).split(/[,;\n.!?]/).pop()!;
    if (index === 1 && /\b(?:total|quantity|qty)\s*[:=]?\s*$/i.test(prefix)) continue;
    const suffix = text.slice(match.index! + match[0].length).split(/[,;\n]/)[0];
    if (/\b(?:no|not|without|previous|earlier|last order|instead of|replacing)\b/i.test(prefix)
      || /^\s*(?:previously|earlier|superseded|last order)\b/i.test(suffix)) { uncertain = true; continue; }
    const invalid = !!match[index === 0 ? 3 : 2] || /\b(?:about|approx(?:imately)?|around|over|under|minimum|maximum)\b|[<>±]/i.test(prefix)
      || /^\s*(?:approx(?:imately)?\b|±|\+\/-)/i.test(suffix);
    if (invalid) { uncertain = true; continue; }
    if (!Number.isInteger(value) || value <= 0 || value > 2147483647) { uncertain = true; continue; }
    if (allocations.has(name) && allocations.get(name) !== value) uncertain = true;
    allocations.set(name, value);
    allocationSpans.push({ start: match.index!, end: match.index! + match[0].length });
    calculationSpan ??= { start: match.index!, end: match.index! + match[0].length };
  }
  for (const p of pantoneMentions(text)) {
    const pName = normalizePantone(p[0]);
    if (!pName) continue;
    const pStart = p.index!, pEnd = pStart + p[0].length;
    const beforeP = text.slice(Math.max(0, pStart - 40), pStart);
    const afterP = text.slice(pEnd, Math.min(text.length, pEnd + 40));
    const matchBefore = beforeP.match(new RegExp(`${amount}\\s*(?:shade|colou?r)?\\s*$`, "i"));
    const matchAfter = afterP.match(new RegExp(`^\\s*[:=–—-]*(?:@\\s*)?${amount}`, "i"));
    const m = matchBefore || matchAfter;
    if (m) {
      const val = numeric(m[1]) * (/^(?:yard|yd)/i.test(m[3]) ? 0.9144 : 1);
      if (Number.isInteger(val) && val > 0 && val <= 2147483647) {
        allocations.set(pName, val);
        calculationSpan ??= { start: pStart, end: pEnd };
      }
    }
  }
  for (const c of result.colours) {
    if (c.metres && /^\d+$/.test(c.metres.trim())) {
      const val = Number(c.metres.trim());
      if (val > 0 && val <= 2147483647) {
        const n = normalizePantone(c.name) || normalizeColour(c.name).name;
        if (!allocations.has(n)) {
          allocations.set(n, val);
        }
      }
    }
  }
  const each = text.match(new RegExp(`${amount}\\s*(?:each|per[ -]+col(?:ou?r)?|colou?r[ -]*wise)\\b`, "i"));
  if (each && result.colours.length && !each[2]) {
    if (/\b(?:not|no|without)\s*$/i.test(text.slice(0, each.index))) {
      uncertain = true;
    } else if (!/\b(?:about|approx|around|or|TBC|TBA)\b/i.test(text)) {
      calculationSpan ??= { start: each.index!, end: each.index! + each[0].length };
      const value = numeric(each[1]) * (/^(?:yard|yd)/i.test(each[3]) ? 0.9144 : 1);
      if (!Number.isInteger(value) || value <= 0 || value > 2147483647) uncertain = true;
      for (const c of result.colours) {
        const n = normalizePantone(c.name) || normalizeColour(c.name).name;
        if (allocations.has(n) && allocations.get(n) !== value) uncertain = true;
        allocations.set(n, value);
      }
    }
  }
  if (!allocations.size) {
    if (uncertain) {
      delete result.quantity;
      result.warnings.push("Colour allocations are uncertain or excluded; confirm the current order quantity.");
    }
    return;
  }
  const statedEvidence = result.evidence.find(e => e.field === "quantity" && e.kind !== "inferred" && e.kind !== "unresolved"
    && !allocationSpans.some(s => s.start <= e.start && e.end <= s.end)
    && !(each && each.index! <= e.start && e.end <= each.index! + each[0].length));
  for (const [name, value] of allocations) {
    let colour = result.colours.find(c => (normalizePantone(c.name) || normalizeColour(c.name).name) === name);
    if (!colour) { colour = { name, sourceText: name, metres: "" }; result.colours.push(colour); }
    colour.metres = String(value);
  }
  const sum = [...allocations.values()].reduce((a, b) => a + b, 0);
  const hasColourOr = (result.colourAlternatives && result.colourAlternatives.length > 0) || new RegExp(`\\b(?:${COLOUR})\\s+(?:\\d+\\s*(?:m|metres?|meters?|mtrs?)\\b\\s*)?(?:or|either)\\b`, "i").test(text);
  const hasIncompleteWords = hasIncompleteColourList(text) || /\b(?:rolls?|pieces?|pcs|kilograms?|kg)\b/i.test(text);
  const complete = !uncertain && Number.isInteger(sum) && sum <= 2147483647
    && (result.colours.length > 0
      ? result.colours.every(c => {
          const n = normalizePantone(c.name) || normalizeColour(c.name).name;
          return allocations.has(n) || (c.metres && Number(c.metres) > 0);
        })
      : allocations.size > 0)
    && !hasColourOr && !hasIncompleteWords;
  const explicit = [...text.matchAll(new RegExp(`(?:\\b(?:total(?:\\s+(?:requirement|order|quantity|qty|need|volume|meters?|metres?|mtrs?))?(?:\\s+(?:is|of))?|quantity|qty)\\s*[:=–—-]?\\s*${amount}|${amount}(?<!\\.)\\s+(?:in\\s+)?total\\b)`, "gi"))]
    .filter(m => !allocationSpans.some(s => s.start <= m.index! && m.index! < s.end));
  const statedValues = new Set(explicit.map(m => numeric(m[1] || m[4]) * (/^(?:yard|yd)/i.test(m[3] || m[6]) ? 0.9144 : 1)));
  const stated = statedValues.size === 1 ? [...statedValues][0] : statedEvidence ? result.quantity : undefined;
  const hasStated = explicit.length > 0 || !!statedEvidence;
  result.evidence = result.evidence.filter(e => !(e.field === "quantity" && e.kind === "inferred" && /calculated/i.test(e.reason || "")));
  if (!complete) {
    if (explicit.length === 0) delete result.quantity;
    result.warnings.push(hasColourOr
      ? "Alternative colour allocations require review; no additive total was calculated."
      : `Known colour subtotal: ${sum} m; incomplete, uncertain or non-additive allocations require review.`);
    return;
  }
  if (hasStated && stated !== sum) {
    delete result.quantity;
    result.warnings.push(`Conflicting total quantity: stated ${stated ?? "unresolved"} m; colour breakdown ${sum} m. Confirm the order total.`);
    return;
  }
  result.quantity = sum;
  result.warnings = result.warnings.filter(w => !/^Proposed total:/.test(w) && !/^Known colour subtotal:/.test(w));
  const reason = `Calculated total ${sum} m from distinct colour allocations (${[...allocations].map(([n, v]) => `${n}: ${v} m`).join(" + ")}).`;
  result.notes = [result.notes, reason].filter(Boolean).join("\n");
  const span = calculationSpan || { start: 0, end: text.length };
  result.evidence.push({ field: "quantity", kind: "inferred", ...span, text: text.slice(span.start, span.end), value: sum, unit: "m", reason });
  return true;
}
