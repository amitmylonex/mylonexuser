import { type AiFabric, type AiField } from "./ai-schema.js";
import { sourceSpan, canonicalBlend, normalize, sourceComposition, directionalCompositions } from "./ai-grounding.js";
import { validAiField, greigeWidth } from "./ai-field-validation.js";
import { collectPlainFields } from "./plain-fields.js";
import { TextAnalysis } from "./analysis.js";
import { reserveAlternatives } from "./alternatives.js";
import { groundAiSources } from "./ai-sources.js";
import { technicalPhrases, startsTypedYarn } from "./technical-phrases.js";
import { categoricalFields } from "./ai-categorical.js";
import { classifyPlainWeaves } from "./plain-weave.js";
import { extractPlainTechnical, reserveTechnical } from "./plain-technical.js";
import { reservePlainContext } from "./plain-context.js";

const issue = (fabric: AiFabric, field: AiField["field"] | null, source: string, message: string) => fabric.issues.push({ field, source, message });
export function validateAiExtraction(input: string, raw: unknown) {
  const result = groundAiSources(input, raw);
  for (const fabric of result.fabrics) {
    const analysis = new TextAnalysis(fabric.source); reserveAlternatives(analysis);
    const alternatives = analysis.claims.filter(item => item.field === "alternatives");
    reservePlainContext(analysis);
    if (alternatives.length) fabric.alternatives = alternatives.map(item => item.text);
    const baseline = collectPlainFields(analysis);
    for (const item of baseline.evidence) analysis.claim(analysis.evidence(item));
    const technical = technicalPhrases(analysis);
    const labelled = technical.candidates.filter(item => item.priority === "label");
    const weaves = classifyPlainWeaves(analysis);
    reserveTechnical(analysis, technical.candidates);
    extractPlainTechnical(analysis, baseline, technical, weaves.mentions.length > 0 || !!baseline.blend);
    const commonSource = fabric.source.slice(0, alternatives[0]?.start ?? fabric.source.length);
    const categorical = categoricalFields(commonSource);
    // Vocabulary evidence establishes these meanings even if the model labels
    // an established abbreviation as inferred, or omits it entirely.
    fabric.fields = [...fabric.fields.filter(field => field.field !== "productionCycle" && field.field !== "fabricState"), ...categorical];
    fabric.issues = fabric.issues.filter(item => !((item.field === "productionCycle" || item.field === "fabricState") &&
      categorical.some(field => field.sourcePhrases.includes(item.source)) &&
      new Set(categorical.filter(field => field.field === item.field).map(field => field.value)).size <= 1));
    const candidates: AiField[] = [];
    for (const field of fabric.fields) {
      for (const phrase of field.sourcePhrases) sourceSpan(fabric.source, phrase);
      if (field.sourcePhrases.some(phrase => { const span = sourceSpan(fabric.source, phrase); return alternatives.some(alternative => alternative.start < span.end && alternative.end > span.start); })) {
        issue(fabric, field.field, field.sourcePhrases[0], "An unselected sourcing alternative cannot fill a common field."); continue;
      }
      const value = validAiField(field, fabric.source);
      // The qualifier itself establishes why this width is not a cuttable-width
      // proposal. Report that specific review issue once below.
      if (field.field === "width" && greigeWidth(fabric.source) && value === undefined) continue;
      if ((field.field === "count" || field.field === "construction") && /^\d+(?:\.\d+)?\s*[x×*/]\s*\d+(?:\.\d+)?$/.test(value || field.value) &&
        (!baseline[field.field] || normalize(baseline[field.field]) !== normalize(value || field.value)) &&
        !(field.field === "construction" && fabric.yarns.length === 2 && fabric.yarns.every(yarn => startsTypedYarn(new TextAnalysis(yarn.source))))) {
        issue(fabric, field.field, field.sourcePhrases[0], `Confirm proposed ${field.field}: ${field.value}; the available textile notation does not establish this assignment.`); continue;
      }
      if (field.interpretation === "conflicting" || value === undefined) {
        issue(fabric, field.field, field.sourcePhrases[0], `Review proposed ${field.field}: ${field.value}. ${field.interpretation === "conflicting" ? "Conflicting wording was supplied." : "The source does not establish a validated explicit value."}`); continue;
      }
      if (field.field === "gsm" || field.field === "width" || field.field === "quantity") {
        const explicit = baseline[field.field];
        if (explicit !== undefined && String(explicit) !== (field.field === "quantity" ? value.replace(/ m$/, "") : value) || baseline.warnings.some(warning => warning.startsWith(`${field.field}:`) || field.field === "quantity" && /conflicting.*quantit/i.test(warning))) {
          issue(fabric, field.field, field.sourcePhrases[0], "Explicit local wording conflicts with the AI proposal; confirm the value."); continue;
        }
      }
      if ((field.field === "count" || field.field === "construction") && labelled.some(item => item.field === field.field && normalize(item.value) !== normalize(value))) {
        issue(fabric, field.field, field.sourcePhrases[0], "Explicit technical labels conflict; confirm the intended specification."); continue;
      }
      if (field.field === "weaveType") {
        const qualifier = value.match(/\s*(\([^)]+\))\s*$/);
        const known = qualifier && weaves.mentions.find(mention => normalize(value.slice(0, qualifier.index).trim()) === normalize(mention.matchedTerm));
        if (known) {
          issue(fabric, "weaveType", field.sourcePhrases[0], `Weave qualifier retained for review: ${qualifier[1]}`);
          candidates.push({ ...field, value: known.matchedTerm }); continue;
        }
      }
      candidates.push({ ...field, value, interpretation: "explicit" });
    }
    fabric.fields = candidates.filter(field => {
      if (field.field === "colour") return true;
      const conflict = candidates.some(other => other.field === field.field && normalize(other.value) !== normalize(field.value));
      if (conflict) issue(fabric, field.field, field.sourcePhrases[0], `Conflicting ${field.field} proposals were left blank.`);
      return !conflict;
    }).filter((field, index, fields) => fields.findIndex(other => other.field === field.field && normalize(other.value) === normalize(field.value)) === index);
    // Directional yarn proportions are not additive. The common composition is
    // supported only when BOTH yarn specifications agree with its source values.
    const yarnBlends = fabric.yarns.map(yarn => {
      const supported = canonicalBlend(sourceComposition(yarn.source));
      yarn.blend = supported.state === "complete" ? supported.value : null;
      return yarn.blend || undefined;
    }).filter(Boolean);
    const directional = directionalCompositions(commonSource);
    const compositions = directional.length === 2 ? directional.map(item => item.value) : yarnBlends;
    if ((yarnBlends.length > 0 || directional.length > 1) && (compositions.length !== 2 || compositions.some(value => !value) || new Set(compositions.map(value => normalize(value || ""))).size !== 1)) {
      fabric.fields = fabric.fields.filter(field => field.field !== "blend");
      issue(fabric, "blend", fabric.yarns[0]?.source || fabric.source, "Warp/weft compositions differ or need confirmation. Overall composition was not averaged or added.");
    } else if (compositions.length === 2 && compositions[0]) {
      fabric.fields = fabric.fields.filter(field => field.field !== "blend");
      fabric.fields.push({ field: "blend", value: compositions[0], sourcePhrases: fabric.yarns.length === 2 ? fabric.yarns.map(yarn => yarn.source) : directional.map(item => item.source), interpretation: "explicit" });
    }
    for (const field of fabric.fields.filter(field => field.field === "blend")) {
      const blend = canonicalBlend(field.value);
      if (blend.state !== "complete") issue(fabric, "blend", field.sourcePhrases[0], blend.error || "Complete all stated fibre percentages to 100%; no remainder was inferred.");
    }
    if (greigeWidth(fabric.source)) issue(fabric, "width", fabric.source, "Greige width is retained in source notes. Confirm finished/cuttable width before filling the required width field.");
    fabric.issues = fabric.issues.filter((item, position, items) => items.findIndex(other => other.field === item.field && other.message === item.message && other.source === item.source) === position);
  }
  return result;
}
