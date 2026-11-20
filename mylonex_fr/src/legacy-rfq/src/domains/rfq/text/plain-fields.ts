import { extractComposition } from "./composition";
import { extractMeasurements } from "./measurements";
import { extractDescriptive } from "./descriptive";
import { extractPlainColours } from "./plain-colours";
import { extractPlainQuantities } from "./plain-quantities";
import { FIBRE_PATTERN, fibreName } from "./fibres";
import type { TextFields } from "./types";
import type { TextAnalysis } from "./analysis";
import { qualifyPlainWidths, widthPhrases } from "./width-phrases";
import { extractWeightCandidates, reconcileWeightFields } from "./weight-conversion";

/** Separate the suffix of an already measured width from an adjacent order amount. */
function separateWidthSuffix(text: string) {
  let separated = text;
  for (const width of widthPhrases(text)) {
    const suffix = /\bwidth$/i.exec(width.text);
    if (width.basis === "unqualified" || !width.value || !suffix
      || !/^\s+\d[\d,.]*\s*(?:\(\s*)?m\b/i.test(text.slice(width.end))) continue;
    separated = separated.slice(0, width.end - suffix[0].length) + ";".repeat(suffix[0].length) + separated.slice(width.end);
  }
  return separated;
}

/** Reuse field recognizers; collect their explicit phrases before bare numbers. */
export function collectPlainFields(analysis: TextAnalysis): TextFields {
  const text = analysis.remaining();
  const result: TextFields = { blend: "", count: "", construction: "", finish: "", colours: [], notes: "", warnings: [], evidence: [] };
  extractComposition(text, result);
  const labelled = text.match(/(?:(?:blend|composition)\s*[-:=]?|content\s*[-:=])\s*([^;\n]+)/i);
  if (labelled) for (const item of result.evidence) {
    if (text.slice(item.start, item.end) !== item.text) {
      const offset = labelled.index! + labelled[0].length - labelled[1].length;
      item.start += offset; item.end += offset;
    }
  }
  if (result.warnings.some(item => /named fibres lack percentages/i.test(item))) {
    const scope = labelled ? labelled[1] : text;
    const missing = [...scope.matchAll(new RegExp(`\\b(${FIBRE_PATTERN})\\b`, "gi"))]
      .map(match => fibreName(match[1])).filter(name => !result.blend.toLowerCase().includes(name.toLowerCase()));
    if (missing.length) result.blend += ` / ${[...new Set(missing)].join(" / ")}`;
  }
  for (const item of result.evidence) if (item.reason && !item.kind) item.kind = "inferred";
  if (!result.blend && !result.compositionReview) result.warnings = [];
  const weights = extractWeightCandidates(text);
  const measurementText = separateWidthSuffix(text);
  extractMeasurements(measurementText, result, true, weights);
  qualifyPlainWidths(analysis, result);
  reconcileWeightFields(text, result, weights);
  if (result.weightInput?.unit === "glm") result.weightInput.rawText = analysis.phrase(weights[0].start, weights[0].end);
  extractDescriptive(text, result);
  extractPlainColours(text, result);
  extractPlainQuantities(measurementText, result, undefined, true);
  // Recognizers accept unsigned measurements; retain an explicitly attached sign
  // as part of the candidate so a negative input cannot turn into a positive one.
  for (const item of result.evidence) if (["blend", "gsm", "width", "quantity"].includes(item.field) &&
    text[item.start - 1] === "-" && (item.start < 2 || !/[\p{L}\p{N}]/u.test(text[item.start - 2]))) {
    item.start--; item.text = text.slice(item.start, item.end); item.kind = "unresolved";
    item.reason = "The explicit negative value does not fit the existing positive RFQ field.";
    result.warnings.push(`${item.field}: “${analysis.phrase(item.start, item.end)}” needs a positive value; confirm it.`);
    if (item.field === "blend") result.blend = "";
    else if (item.field === "gsm" || item.field === "width" || item.field === "quantity") delete result[item.field];
  }
  for (const colour of result.colours) {
    const source = result.evidence.find(item => item.field === "colour" && (item.text === colour.name || item.text === colour.sourceText || item.text.includes(colour.sourceText || "")));
    if (source) {
      colour.sourceText = analysis.evidence(source).text;
      if (!colour.sourceText) {
        colour.name = analysis.evidence(source).text;
      }
    }
  }
  const finish = result.evidence.find(item => item.field === "finish" && item.kind === "explicit");
  if (result.finish && finish) result.finish = analysis.evidence(finish).text.replace(/\s+finish$/i, "").replace(/^./, char => char.toUpperCase());
  if (result.fibreQualifiers) {
    const blendEvs = result.evidence.filter(item => item.field === "blend").map(item => analysis.evidence(item).text).join(" ");
    result.fibreQualifiers = result.fibreQualifiers.map(q => {
      const match = q.match(/^([a-zA-Z\s-]+ qualifier:\s*)(.*)$/);
      if (match) {
        const rawWord = match[2];
        const origWordMatch = blendEvs.match(new RegExp(`\\b${rawWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i"));
        if (origWordMatch) {
          return `${match[1]}${origWordMatch[0]}`;
        }
      }
      return q;
    });
  }
  return result;
}
