import type { AiFabric, AiField } from "../../../../../src/domains/rfq/text/ai-schema";
import { groundAiSources, TextGroupingConflict } from "../../../../../src/domains/rfq/text/ai-sources";
import type { TextCandidate } from "../../../../../src/domains/rfq/text/proposals";
import { aiTextCandidates, localTextCandidates, equivalentCandidate } from "./text-candidates";
import { mapAiFabric } from "./map-ai-text";
import { initializeBlend } from "./blend-state";
import type { RfqLine } from "./draft";
import { detectSourcingAlternatives } from "../../../../../src/domains/rfq/text/alternatives";
import { inferFabricStateFromShade } from "./shade-inference";
import { applyPlatformWidthDefault } from "./platform-width";
import { recalculateGlmGsm } from "../../../../../src/domains/rfq/text/weight-conversion";

export const RECONCILED_WARNING = "AI and local extraction reconciled. Review source-backed proposals before sending.";
function sourceKeys(input: string, sources: string[]) {
  let cursor = 0;
  return sources.map(source => {
    const text = source.trim(), start = input.indexOf(text, cursor);
    if (start < 0) return undefined;
    cursor = start + text.length; return `${start}:${cursor}`;
  });
}
const labels: Partial<Record<AiField["field"], string>> = { count: "count", construction: "construction|density|epi|ppi", gsm: "gsm", width: "(?:finished|cuttable)?\\s*width", quantity: "total|quantity|qty", blend: "blend|composition|content", weaveType: "weave", finish: "finish", yarnType: "yarn type", endUse: "end use" };
const priority = (candidate: TextCandidate) => labels[candidate.field] && candidate.sourcePhrases.some(phrase => new RegExp(`\\b(?:${labels[candidate.field]})\\s*[:=]`, "i").test(phrase)) ? 2 : 1;

function reconcileFields(candidates: TextCandidate[]) {
  const chosen: AiField[] = [], warnings: string[] = [];
  for (const field of new Set(candidates.map(candidate => candidate.field))) {
    const all = candidates.filter(candidate => candidate.field === field);
    const eligible = all.filter(candidate => candidate.status === "accepted" && candidate.kind === "explicit" && !candidate.qualifier);
    const rank = Math.max(0, ...eligible.map(priority));
    const leading = eligible.filter(candidate => priority(candidate) === rank).sort((a, b) => Number(b.origin === "ai") - Number(a.origin === "ai"));
    const values = new Set(leading.map(candidate => equivalentCandidate(field, candidate.value)));
    if (values.size > 1 && field !== "colour") {
      const reason = `Conflicting ${field} interpretations: ${leading.map(candidate => `${candidate.origin}: ${candidate.value}`).join("; ")}. Confirm the intended value.`;
      for (const candidate of eligible) { candidate.status = "review"; candidate.reason = reason; }
      warnings.push(reason); continue;
    }
    for (const winner of leading) {
      if (chosen.some(item => item.field === field && equivalentCandidate(field, item.value) === equivalentCandidate(field, winner.value))) continue;
      const equivalent = eligible.filter(candidate => equivalentCandidate(field, candidate.value) === equivalentCandidate(field, winner.value));
      chosen.push({ field, value: winner.value, sourcePhrases: [...new Set(equivalent.flatMap(candidate => candidate.sourcePhrases))].slice(0, 20), interpretation: "explicit" });
    }
    for (const candidate of eligible.filter(candidate => !leading.includes(candidate) && !leading.some(winner => equivalentCandidate(field, winner.value) === equivalentCandidate(field, candidate.value)))) {
      candidate.status = "review"; candidate.reason = "Explicit labelled wording takes precedence; this competing interpretation remains available for review.";
      warnings.push(candidate.reason);
    }
  }
  return { chosen, warnings };
}

export function localTextDrafts(lines: RfqLine[], reason: string): RfqLine[] {
  return lines.map(line => initializeBlend({ ...line, textExtractionMode: "deterministic", textCandidates: localTextCandidates(line), warnings: [reason, ...line.warnings] }));
}

/** Align literal entry spans before looking at fields; never zip or concatenate
 * the two extractors' fabric arrays into additional inquiry lines. */
export function reconcileTextDrafts(input: string, local: RfqLine[], validated: AiFabric[], proposals: AiFabric[] = validated): RfqLine[] {
  const ai = groundAiSources(input, { fabrics: validated }).fabrics;
  const raw = groundAiSources(input, { fabrics: proposals }).fabrics;
  const localKeys = sourceKeys(input, local.map(line => line.original));
  const aiKeys = sourceKeys(input, ai.map(fabric => fabric.source));
  const rawKeys = sourceKeys(input, raw.map(fabric => fabric.source));
  if (localKeys.some(key => !key) || localKeys.length !== aiKeys.length || localKeys.some(key => !aiKeys.includes(key)) || rawKeys.some(key => !aiKeys.includes(key))) {
    return localTextDrafts(local, new TextGroupingConflict().message);
  }
  return local.map((line, index) => {
    const fabric = ai[aiKeys.indexOf(localKeys[index])], original = raw[rawKeys.indexOf(localKeys[index])];
    const candidates = [...localTextCandidates(line), ...aiTextCandidates(original, fabric)].map(candidate => {
      const sourcePhrases = candidate.sourcePhrases.map(phrase => !line.original.includes(phrase) && line.original.includes(phrase.trim()) ? phrase.trim() : phrase);
      return sourcePhrases.every(phrase => line.original.includes(phrase)) ? { ...candidate, sourcePhrases }
        : { ...candidate, status: "unsupported" as const, reason: "The supporting phrase is outside this draft's source boundary." };
    });
    const { chosen, warnings } = reconcileFields(candidates);
    const mapped = mapAiFabric({ ...fabric, source: line.original, fields: chosen });
    mapped.plainTextSource = line.plainTextSource;
    mapped.textCandidates = candidates;
    mapped.weaveDetection = line.weaveDetection;
    mapped.sourcingAlternatives = line.sourcingAlternatives || detectSourcingAlternatives(line.original);
    mapped.selectedAlternativeId = line.selectedAlternativeId;
    mapped.widthBasis = line.widthBasis;
    mapped.widthQualifier = line.widthQualifier;
    mapped.gsmMin = line.gsmMin;
    mapped.gsmMax = line.gsmMax;
    mapped.gsmQualifier = line.gsmQualifier;
    mapped.gsmTolerance = line.gsmTolerance;
    mapped.gsmAlternatives = line.gsmAlternatives;
    mapped.gsmBound = line.gsmBound;
    mapped.quantityBound = line.quantityBound;
    mapped.quantityQualifier = line.quantityQualifier;
    mapped.targetPriceAmount = line.targetPriceAmount;
    mapped.targetPriceCurrency = line.targetPriceCurrency;
    mapped.targetPriceCurrencySymbol = line.targetPriceCurrencySymbol;
    mapped.targetPriceCurrencyUnresolved = line.targetPriceCurrencyUnresolved;
    mapped.targetPriceBasis = line.targetPriceBasis;
    mapped.targetPriceQualifier = line.targetPriceQualifier;
    mapped.targetPriceIndicative = line.targetPriceIndicative;
    mapped.targetPriceOperator = line.targetPriceOperator;
    mapped.targetPriceStatus = line.targetPriceStatus;
    mapped.targetPriceMin = line.targetPriceMin;
    mapped.targetPriceMax = line.targetPriceMax;
    mapped.targetPriceTolerance = line.targetPriceTolerance;
    mapped.targetPriceCommercialQualifiers = line.targetPriceCommercialQualifiers;
    mapped.targetPriceConfirmed = line.targetPriceConfirmed;
    mapped.finishQualifiers = line.finishQualifiers;
    mapped.finishExclusions = line.finishExclusions;
    mapped.finishAlternatives = line.finishAlternatives;
    mapped.finishConfirmed = line.finishConfirmed;
    if (line.finishConfirmed && line.finish) {
      mapped.finish = line.finish;
    }
    mapped.colourExclusions = line.colourExclusions;
    mapped.colourAlternatives = line.colourAlternatives;
    mapped.colourReferences = line.colourReferences;
    mapped.unsureColours = line.unsureColours;
    if (line.metadataNotes?.some(note => /^Calculated total/.test(note))) {
      mapped.metadataNotes = line.metadataNotes;
      mapped.draft.quantity = line.draft.quantity;
      mapped.colours = line.colours;
    }
    mapped.coloursConfirmed = line.coloursConfirmed;
    if (line.coloursConfirmed && line.colours.length) {
      mapped.colours = line.colours;
    }
    if (line.targetPriceBasis && line.targetPriceBasis !== "per_metre") {
      delete mapped.draft.targetPriceMax;
    }
    if (line.targetPriceCurrency && line.targetPriceCurrency !== "INR") {
      delete mapped.draft.targetPriceMax;
    }
    if (line.targetPriceCurrencyUnresolved) {
      delete mapped.draft.targetPriceMax;
    }
    if (line.targetPriceAmount && line.targetPriceBasis === "per_metre" && line.targetPriceCurrency === "INR" && !line.targetPriceCurrencyUnresolved) {
      if (!mapped.draft.targetPriceMax && line.draft.targetPriceMax) {
        mapped.draft.targetPriceMax = line.draft.targetPriceMax;
      }
    }
    if (line.gsmMin || line.gsmMax || line.gsmBound || line.gsmAlternatives) {
      delete mapped.draft.gsm;
    }
    if (!mapped.draft.gsm && line.draft.gsm && !line.gsmMin && !line.gsmMax && !line.gsmBound && !line.gsmAlternatives) {
      mapped.draft.gsm = line.draft.gsm;
      const gsmEv = line.sourceEvidence?.find(e => e.field === "gsm");
      if (gsmEv && !mapped.sourceEvidence?.some(e => e.field === "gsm")) {
        mapped.sourceEvidence = [...(mapped.sourceEvidence || []), gsmEv];
      }
    }
    if (line.weightInput) mapped.weightInput = line.weightInput;
    if (line.gsmProvenance) mapped.gsmProvenance = line.gsmProvenance;
    if (line.gsmDerivedReason) mapped.gsmDerivedReason = line.gsmDerivedReason;
    if (line.gsmDefaultWidthUsed) mapped.gsmDefaultWidthUsed = line.gsmDefaultWidthUsed;
    if (line.gsmWidthUsed) mapped.gsmWidthUsed = line.gsmWidthUsed;
    if (line.widthProvenance) { mapped.widthProvenance = line.widthProvenance; mapped.widthDefaultNote = line.widthDefaultNote; }
    if (!mapped.draft.width && line.draft.width) {
      mapped.draft.width = line.draft.width;
    } else if (mapped.draft.width && !mapped.widthProvenance) {
      mapped.widthProvenance = "extracted";
    }
    if (!mapped.draft.weaveType && line.draft.weaveType) {
      mapped.draft.weaveType = line.draft.weaveType;
    }
    if (!mapped.weaveDetail && line.weaveDetail) {
      mapped.weaveDetail = line.weaveDetail;
    }
    if (!mapped.draft.fabricState && line.draft.fabricState) {
      mapped.draft.fabricState = line.draft.fabricState;
      mapped.fabricStateInferred = line.fabricStateInferred;
    }
    inferFabricStateFromShade(mapped);
    applyPlatformWidthDefault(mapped);
    const updatedWeight = recalculateGlmGsm(mapped);
    Object.assign(mapped, updatedWeight);
    const localNotes = (line.draft.additionalSpecs || "").split("\n").filter(note => !/^OPTION\s+\d/i.test(note.trim()) || !fabric.alternatives.some(alternative => alternative.includes(note.trim())));
    mapped.draft.additionalSpecs = [...new Set([...localNotes, ...(mapped.draft.additionalSpecs || "").split("\n")].filter(Boolean))].join("\n") || undefined;
    const issues = new Map<string, string>();
    for (const warning of [RECONCILED_WARNING, ...mapped.warnings.slice(1), ...line.warnings, ...warnings]) {
      const heading = warning.indexOf(":");
      const key = heading > 0 && heading < 80 ? warning.slice(0, heading).toLowerCase() : warning;
      if (!issues.has(key)) issues.set(key, warning);
    }
    mapped.warnings = [...issues.values()];
    return mapped;
  });
}
