import { FIBRE_PATTERN, fibreName, contextualFibreCode, BLEND_CODE_PATTERN } from "./fibres.js";
import { evidence, type TextFields } from "./types.js";

import { TextAnalysis } from "./analysis.js";
import { orderedCompositions, type OrderedComposition } from "./composition-lists.js";
import { explicitPercentages } from "./composition-percentages.js";
import { FIBRE_MODIFIERS_PATTERN } from "./composition-attributes.js";
import { reviewUnknownComposition } from "./composition-review.js";
export { FIBRE_MODIFIERS_PATTERN } from "./composition-attributes.js";

function applyOrdered(text: string, candidates: OrderedComposition[], result: TextFields) {
  const values = new Set(candidates.map(candidate => candidate.components.map(item => `${item.percentage}% ${item.displayName}`).join(" ")));
  const review = candidates.find(candidate => candidate.review)?.review || (values.size > 1 ? "Conflicting composition ratios need review; no overall blend was invented." : undefined);
  const directional = candidates.length > 1 && /\b\d+\s*['’]?s\b/i.test(text) && /[x×]/i.test(text);
  result.blend = review ? directional ? "" : [...new Set(candidates.flatMap(candidate => candidate.components.map(item => item.displayName)))].join(" / ") : [...values][0];
  result.evidence.push(...candidates.map(candidate => ({ field: "blend", kind: review ? "unresolved" as const : "explicit" as const,
    start: candidate.start, end: candidate.end, text: text.slice(candidate.start, candidate.end),
    reason: review || "Percentages associated in buyer source order from composition lists; values were not rebalanced." })));
  result.fibreQualifiers = [...new Set(candidates.flatMap(candidate => candidate.components.flatMap(item => item.qualifierNote ? [item.qualifierNote] : [])))];
  if (review) result.warnings.push(review);
  if (review) result.compositionReview = text.slice(candidates[0].start, candidates.at(-1)!.end);
}

/** All callers share mapped Unicode normalization and the same grammar. */
export function extractComposition(text: string, result: TextFields) {
  const analysis = new TextAnalysis(text);
  const local: TextFields = { ...result, blend: "", compositionReview: undefined, fibreQualifiers: undefined, evidence: [], warnings: [] };
  extractNormalizedComposition(analysis.text, local);
  reviewUnknownComposition(analysis.text, local);
  const label = analysis.text.match(/(?:(?:blend|composition)\s*[-:=]?|content\s*[-:=])\s*([^;\n]+)/i);
  const offset = label ? label.index! + label[0].length - label[1].length : 0;
  for (const item of local.evidence) {
    if (label && analysis.text.slice(item.start, item.end) !== item.text) { item.start += offset; item.end += offset; }
    result.evidence.push(analysis.evidence(item));
  }
  result.blend = local.blend;
  result.fibreQualifiers = local.fibreQualifiers;
  result.compositionReview = local.compositionReview;
  result.warnings.push(...local.warnings);
}

function extractNormalizedComposition(text: string, result: TextFields) {
  // A coating or finish names its process/material, never a fabric fibre share.
  // Mask only that phrase and keep every character position stable.
  text = text.replace(/\b(?:pu|p\.u\.?|polyurethane|ptfe|acrylic|rubber|silicone|bamboo charcoal|cotton touch)\s*(?:coated|coating|coat|finish|treatment)\b/gi, match => " ".repeat(match.length));
  const orderedLists = orderedCompositions(text);
  if (orderedLists.some(candidate => candidate.percentSigns)) { applyOrdered(text, orderedLists, result); return; }
  const labelled = text.match(/(?:(?:blend|composition)\s*[-:=]?|content\s*[-:=])\s*([^;\n]+)/i);
  // Yarn wording can repeat a fibre in warp and weft. A labelled composition is
  // the authoritative scope for blend rows, rather than the whole paragraph.
  const scope = labelled ? labelled[1] : text;
  const allFibres = [...scope.matchAll(new RegExp(`\\b(${FIBRE_PATTERN})\\b`, "gi"))];
  const fibres = allFibres.filter(match => {
    if (/\b(?:composition|blend|fibres?|fibers?|content)\s*[:=]/i.test(text)) return true;
    if (contextualFibreCode(match[1])) return false;
    if (!/^(?:cot|vis|poly|ctn|lyo|lin)$/i.test(match[1])) return true;
    if (/\b(?:need|quote|require|want)\s*$/i.test(scope.slice(0, match.index))) return true;
    return allFibres.some(other => other !== match && /^(?:[\s/,+-]|\band\b|\bor\b)*$/i.test(
      scope.slice(Math.min(match.index! + match[0].length, other.index! + other[0].length), Math.max(match.index!, other.index!))));
  });
  const alternativeBridge = new RegExp(`^[\\s\\d.%/,+():\\-\\[\\]]*\\bor\\b\\s*(?:\\d+(?:\\.\\d+)?\\s*%\\s*)?${FIBRE_MODIFIERS_PATTERN}$`, "i");
  if (allFibres.some((fibre, index) => index && alternativeBridge.test(scope.slice(allFibres[index - 1].index! + allFibres[index - 1][0].length, fibre.index)))) {
    result.blend = "";
    result.compositionReview = scope.slice(allFibres[0].index, allFibres.at(-1)!.index! + allFibres.at(-1)![0].length);
    result.warnings.push("Alternative fibre descriptions need buyer selection; they were not combined into a blend.");
    return;
  }
  const explicitCandidates = explicitPercentages(scope);

  if (explicitCandidates.length) {
    const seen = new Set<string>();
    const values: string[] = [];
    for (const item of explicitCandidates) {
      const entry = `${item.percentage}% ${item.displayName}`;
      if (!seen.has(entry)) {
        seen.add(entry);
        values.push(entry);
      }
    }
    result.blend = values.join(" ");
    result.evidence.push(...explicitCandidates.map(c => ({
      field: "blend",
      kind: "explicit" as const,
      text: c.text,
      start: c.start,
      end: c.end,
    })));

    const quals = explicitCandidates.map(c => c.qualifierNote).filter((q): q is string => Boolean(q));
    if (quals.length) {
      result.fibreQualifiers = [...new Set(quals)];
    }

    const explicitFibres = new Set(explicitCandidates.map(c => c.baseFibre.toLowerCase()));
    const unmentioned = fibres.some(f => !explicitFibres.has(fibreName(f[1]).toLowerCase()));
    if (unmentioned) result.warnings.push("Some named fibres lack percentages. Confirm the complete composition; no remainder was inferred.");
    return;
  }

  if (orderedLists.length) { applyOrdered(text, orderedLists, result); return; }
  const unmarked = [...scope.matchAll(new RegExp(`(?<![\\p{L}\\p{N}_./])(\\d+(?:\\.\\d+)?)\\s+(${FIBRE_PATTERN})(?![\\p{L}])`, "giu"))];
  if (unmarked.length >= 2 && unmarked.every((match, index) => !index || /^[\s/,+-]*$/.test(scope.slice(unmarked[index - 1].index! + unmarked[index - 1][0].length, match.index)))) {
    result.blend = unmarked.map(item => `${item[1]}% ${fibreName(item[2])}`).join(" ");
    result.evidence.push(...unmarked.map(item => ({ ...evidence("blend", item), kind: labelled ? "explicit" as const : "inferred" as const,
      reason: "Ordered fibre percentages without % symbols; review." })));
    result.warnings.push("Composition percentages were read from ordered fibre notation; confirm them."); return;
  }
  if (fibres.length) {
    result.blend = [...new Set(fibres.map(match => fibreName(match[1])))].join(" / ");
    result.evidence.push(...fibres.map(match => evidence("blend", match)));
  } else if (labelled) {
    const narrativePattern = /\b(?:percentages?\s+not\s+available|not\s+available|to\s+be\s+confirmed|tbc|tba|tbd|unknown|not\s+known|details\s+awaited|please\s+confirm|confirm\b)/i;
    if (narrativePattern.test(labelled[1])) {
      result.compositionReview = labelled[1].trim();
      const textFibres = [...text.matchAll(new RegExp(`\\b(${FIBRE_PATTERN})\\b`, "gi"))]
        .filter(match => !contextualFibreCode(match[1]))
        .map(match => fibreName(match[1]));
      const uniqueFibres = [...new Set(textFibres)];
      if (uniqueFibres.length) {
        result.blend = uniqueFibres.join(" / ");
      }
    } else {
      result.blend = labelled[1].trim(); result.evidence.push(evidence("blend", labelled));
    }
  }
  const code = scope.match(new RegExp(`\\b(?:CVC|C\\s*/?\\s*L|${BLEND_CODE_PATTERN})\\b`, "i"));
  if (!result.blend && code && /\b(?:quote|need|require|composition|blend|fabric)\b/i.test(text)) {
    result.compositionReview = code[0];
    result.warnings.push(`Blend shorthand ${code[0]} does not establish complete fibre percentages; confirm the composition.`);
  }
  result.warnings.push("Confirm fibre percentages. Named fibres do not imply purity or proportions.");
}
