import type { TextAnalysis } from "./analysis.js";
import type { NumericPair, TechnicalCandidate, TechnicalField, SpecificationGroup } from "./technical-phrases.js";
import type { TextFields, Evidence } from "./types.js";

const comparable = (value: string) => value.toLowerCase().replace(/[’']/g, "").replace(/\s+/g, "").replace(/[×*]/g, "x");
const integer = (value: string) => /^\d+$/.test(value) && Number(value) > 0;
/** Fields that describe yarn-level attributes rather than fabric-level roles.
 * A colour name inside a typed yarn description (e.g. "Poly FD White") is a
 * yarn descriptor, not a fabric colour; it must not block count assignment. */
const COUNT_COMPATIBLE_FIELDS = new Set(["blend", "colour"]);
export function reserveTechnical(analysis: TextAnalysis, candidates: TechnicalCandidate[]) {
  return candidates.filter(candidate => analysis.claim(analysis.evidence({ field: candidate.field, start: candidate.start, end: candidate.end, text: "", kind: "explicit" }), candidate.field === "count" ? [...COUNT_COMPATIBLE_FIELDS] : []));
}
export function extractPlainTechnical(analysis: TextAnalysis, result: TextFields, phrases: { candidates: TechnicalCandidate[]; pairs: NumericPair[]; groups: SpecificationGroup[] }, fabricContext: boolean) {
  const candidates = [...phrases.candidates];
  const add = (field: TechnicalField, pair: NumericPair) => {
    candidates.push({ field, start: pair.start, end: pair.end, value: pair.value || analysis.phrase(pair.start, pair.end), priority: "pattern" });
    analysis.claim(analysis.evidence({ field, start: pair.start, end: pair.end, text: "", kind: "explicit" }), field === "count" ? [...COUNT_COMPATIBLE_FIELDS] : []);
  };
  // Resolve complete typed groups independently of other pairs. Existing label
  // ownership can identify one half without hiding the other half of its group.
  // Blend and colour claims inside a typed count span are yarn-level attributes;
  // they do not block the group from being assigned as count/construction.
  for (const group of phrases.groups) {
    const countSpan = analysis.span(group.count.start, group.count.end);
    const countOwned = analysis.claims.find(item => item.start < countSpan.end && item.end > countSpan.start && !COUNT_COMPATIBLE_FIELDS.has(item.field));
    const densitySpan = analysis.span(group.density.start, group.density.end);
    const densityOwned = analysis.claims.find(item => item.start < densitySpan.end && item.end > densitySpan.start);
    if (countOwned && countOwned.field !== "count" || densityOwned && densityOwned.field !== "construction") continue;
    if (!countOwned) add("count", group.count);
    if (!densityOwned) add("construction", group.density);
  }
  const pending = phrases.pairs.filter(pair => !analysis.owned(pair.start, pair.end));
  const pairs = pending.filter(pair => {
    const before = analysis.tokens.filter(token => token.end <= pair.start && token.kind === "word").pop();
    if (!before || !["dimensions", "dimension", "size", "repeat", "date", "delivery", "price", "rate", "budget", "shade", "article"].includes(before.text)) return true;
    if (analysis.text.slice(before.end, pair.start).trim().replace(/[:=]/g, "")) return true;
    analysis.claim(analysis.evidence({ field: before.text, start: pair.start, end: pair.end, text: "", kind: "unresolved", reason: "An explicit non-count role was supplied." }));
    return false;
  });
  if (pairs.length === 2) {
    const [first, second] = pairs;
    const between = analysis.text.slice(first.end, second.start);
    const adjacent = [...between].every(char => /\s/.test(char) || "-,/|".includes(char));
    const density = integer(second.left) && integer(second.right);
    const established = first.yarnUnits || between.trim().length > 0 || fabricContext && (!!(result.width || result.gsm || result.quantity) || /\n/.test(between));
    if (adjacent && density && established) { add("count", first); add("construction", second); }
    else if (adjacent && density) result.warnings.push(`Proposed count “${analysis.phrase(first.start, first.end)}” and construction “${analysis.phrase(second.start, second.end)}” follow a common ordering, but the context does not establish their roles. Confirm the mapping.`);
  } else if (pairs.length === 1) {
    const pair = pairs[0];
    const count = candidates.filter(item => item.field === "count").pop();
    if (pair.yarnUnits) add("count", pair);
    else if (count && count.end <= pair.start && integer(pair.left) && integer(pair.right) &&
      !analysis.text.slice(count.end, pair.start).trim()) add("construction", pair);
  }
  for (const field of ["count", "construction"] as const) {
    const values = candidates.filter(item => item.field === field);
    const explicit = values.filter(item => item.priority === "label");
    const authoritative = explicit.length ? explicit : values;
    const conflict = new Set(authoritative.map(item => comparable(item.value))).size > 1;
    if (conflict) result.warnings.push(`Conflicting ${field} specifications: ${authoritative.map(item => item.value).join(" / ")}. Confirm the intended value.`);
    else if (authoritative.length) result[field] = authoritative[0].value;
    for (const candidate of values) {
      const span = analysis.span(candidate.start, candidate.end);
      const claim = analysis.claims.find(item => item.field === field && item.start === span.start && item.end === span.end);
      const applied = !conflict && comparable(candidate.value) === comparable(result[field]);
      if (claim) { claim.kind = applied ? "explicit" : "unresolved"; claim.reason = applied ? undefined : "Conflicting technical wording needs review."; }
      if (!conflict && !applied) result.warnings.push(`Explicit ${field} “${result[field]}” was kept; the other candidate “${candidate.value}” needs review.`);
    }
  }
  const ambiguous = pairs.filter(pair => !analysis.owned(pair.start, pair.end));
  for (const pair of ambiguous) {
    const item: Evidence = analysis.evidence({ field: "count/construction", start: pair.start, end: pair.end, text: "", kind: "unresolved", reason: "Available wording does not establish count versus construction." });
    analysis.claim(item);
  }
  if (ambiguous.length && !result.warnings.some(warning => warning.startsWith("Proposed count")))
    result.warnings.push(`Review numeric ${ambiguous.length === 1 ? "pair" : "pairs"} ${ambiguous.map(pair => `“${analysis.phrase(pair.start, pair.end)}”`).join(", ")}; count versus construction is ambiguous.`);
  if (analysis.tokens.some(token => token.text === "reed")) result.warnings.push("Reed information stays in notes; it was not converted to EPI.");
  if (analysis.tokens.some(token => token.text === "ppl")) result.warnings.push("PPL may mean PPI; confirm construction before entering it.");
}
