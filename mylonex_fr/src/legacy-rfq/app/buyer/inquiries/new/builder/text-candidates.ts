import type { AiFabric, AiField } from "../../../../../src/domains/rfq/text/ai-schema";
import { AI_FIELDS } from "../../../../../src/domains/rfq/text/ai-schema";
import type { TextCandidate } from "../../../../../src/domains/rfq/text/proposals";
import { validAiField } from "../../../../../src/domains/rfq/text/ai-field-validation";
import { normalize, canonicalBlend, perColourMetres, measurements } from "../../../../../src/domains/rfq/text/ai-grounding";
import { widthPhrases } from "../../../../../src/domains/rfq/text/width-phrases";
import { technicalPhrases } from "../../../../../src/domains/rfq/text/technical-phrases";
import { TextAnalysis } from "../../../../../src/domains/rfq/text/analysis";
import { reserveAlternatives } from "../../../../../src/domains/rfq/text/alternatives";
import { canonicalCountNotation } from "../../../../../src/domains/rfq/text/yarn-notation";
import { quantityBounds } from "../../../../../src/domains/rfq/text/plain-quantities";
import { normalizeColour } from "../../../../../src/domains/rfq/text/colours";
import { normalizedWeave } from "../../../../../src/domains/rfq/weave/phrases";
import type { RfqLine } from "./draft";

export function equivalentCandidate(field: AiField["field"], value: string) {
  if (field === "blend") return canonicalBlend(value).rows.map(row => `${normalize(row.fibre)}:${Number(row.percentage)}`).sort().join("|");
  if (field === "colour") return normalizeColour(value).name.toLowerCase();
  if (field === "weaveType") return normalizedWeave(value);
  return normalize(value);
}
const units: Partial<Record<AiField["field"], string>> = { width: "inches", gsm: "g/m²", quantity: "m", perColourQuantity: "m" };
export function makeTextCandidate(field: AiField, source: string, origin: TextCandidate["origin"], accepted: boolean): TextCandidate {
  const supported = validAiField(field, source);
  const qualified = field.field === "width" ? widthPhrases(source).find(item => item.basis === "greige" && field.sourcePhrases.some(phrase => item.text.includes(phrase) || phrase.includes(item.text))) : undefined;
  const proposedWidth = /^\d+(?:\.\d+)?$/.test(field.value) ? `${Number(field.value)} inches` : measurements(field.value).width;
  const width = qualified?.value && parseFloat(qualified.value) === parseFloat(proposedWidth || "") ? qualified : undefined;
  const amount = field.field === "quantity" ? Number(field.value) || Number(field.value.match(/\d+(?:\.\d+)?/)?.[0]) : undefined;
  const bound = field.field === "quantity" ? quantityBounds(source).find(item => item.value === amount && field.sourcePhrases.some(phrase => item.source.includes(phrase) || phrase.includes(item.source))) : undefined;
  const value = bound ? `${bound.operator} ${bound.value} m` : supported || (width ? (width.value.includes("inches") ? width.value : `${width.value} inches`) : undefined) || field.value;
  return { field: field.field, value: field.field === "count" ? canonicalCountNotation(value) : value, origin,
    reportedKind: origin === "ai" ? field.interpretation : undefined,
    sourcePhrases: bound ? [bound.source] : width ? [width.text] : field.sourcePhrases, kind: field.interpretation === "inferred" ? "inferred" : field.interpretation === "conflicting" ? "unresolved" : "explicit",
    unit: units[field.field], qualifier: bound ? "quantity bound" : qualified?.qualifier,
    status: bound || width ? "review" : supported ? accepted ? "accepted" : "review" : "unsupported",
    reason: bound ? "This is not an exact order quantity. Enter a confirmed exact quantity manually; the bound remains in source notes." : width ? "Stated greige width; confirm finished/cuttable width before applying it." : !supported ? "Source wording does not establish a valid value for this field." : !accepted ? "Review the source context before applying this proposal." : undefined };
}
export function localTextCandidates(line: RfqLine): TextCandidate[] {
  const result: TextCandidate[] = [...(line.textCandidates ?? []).filter(item => item.field === "fabricState" && item.kind === "inferred")];
  const analysis = new TextAnalysis(line.original); reserveAlternatives(analysis);
  const commonSource = line.original.slice(0, analysis.claims[0]?.start ?? line.original.length);
  for (const field of AI_FIELDS) {
    if (field === "perColourQuantity" || field === "fabricState" && result.some(item => item.field === field)) continue;
    const current = field === "colour" ? undefined : field in line ? line[field as "count" | "construction" | "blend" | "finish"] : line.draft[field as keyof typeof line.draft];
    const evidence = line.sourceEvidence?.filter(item => item.field === (field === "weaveType" ? "weave" : field)) || [];
    if (field === "colour") {
      for (const colour of line.colours) {
        const hit = evidence.find(item => normalize(item.text) === normalize(colour.name) || (colour.sourceText && normalize(item.text) === normalize(colour.sourceText)));
        const phrase = hit ? line.original.slice(hit.start, hit.end) : colour.sourceText && line.original.includes(colour.sourceText) ? colour.sourceText : colour.name;
        result.push(makeTextCandidate({ field, value: colour.name, sourcePhrases: [phrase], interpretation: "explicit" }, line.original, "local", true));
      }
    } else if (current !== undefined && current !== "") {
      const widthProof = field === "width" ? widthPhrases(commonSource).filter(item => item.basis !== "greige" && item.value === current).map(item => item.text) : [];
      result.push(makeTextCandidate({ field, value: field === "quantity" ? `${current} m` : String(current), sourcePhrases: widthProof.length ? widthProof : evidence.length ? evidence.slice(0, 20).map(item => item.text) : [commonSource], interpretation: evidence.some(item => item.kind === "inferred") ? "inferred" : "explicit" }, line.original, "local", true));
    } else for (const item of evidence.filter(item => item.kind === "inferred" || item.kind === "unresolved")) {
      const labelled = field === "count" || field === "construction" ? technicalPhrases(new TextAnalysis(item.text)).candidates.find(candidate => candidate.field === field) : undefined;
      const value = labelled?.value || (item.value ? `${item.value}${field === "width" ? " inches" : ""}` : undefined);
      if (value) {
        const candidate = makeTextCandidate({ field, value, sourcePhrases: [item.text], interpretation: item.kind === "inferred" ? "inferred" : "explicit" }, line.original, "local", false);
        if (item.kind === "inferred") { candidate.status = "review"; candidate.reason = item.reason || "Inferred locally; buyer confirmation required."; }
        result.push(candidate);
      }
    }
  }
  for (const width of widthPhrases(commonSource).filter(item => item.value && !result.some(candidate => candidate.field === "width" && candidate.sourcePhrases.includes(item.text)))) {
    result.push(makeTextCandidate({ field: "width", value: width.value!, sourcePhrases: [width.text], interpretation: "explicit" }, line.original, "local", line.draft.width === width.value));
  }
  const perColour = perColourMetres(commonSource);
  for (const bound of quantityBounds(commonSource)) if (!result.some(candidate => candidate.field === "quantity" && candidate.value === `${bound.operator} ${bound.value} m`)) {
    result.push(makeTextCandidate({ field: "quantity", value: `${bound.value} m`, sourcePhrases: [bound.source], interpretation: "explicit" }, line.original, "local", false));
  }
  if (perColour) result.push(makeTextCandidate({ field: "perColourQuantity", value: `${perColour} m`, sourcePhrases: [commonSource], interpretation: "explicit" }, line.original, "local", true));
  return result;
}
export function aiTextCandidates(raw: AiFabric, validated: AiFabric) {
  return raw.fields.map(field => {
    const equivalent = validated.fields.find(item => item.field === field.field && equivalentCandidate(field.field, item.value) === equivalentCandidate(field.field, validAiField(field, raw.source) || field.value));
    const candidate = makeTextCandidate(field, raw.source, "ai", !!equivalent);
    if (equivalent) { candidate.value = field.field === "count" ? canonicalCountNotation(equivalent.value) : equivalent.value; candidate.kind = "explicit"; }
    return candidate;
  });
}
