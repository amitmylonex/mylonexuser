import { BUYER_FABRIC_STATES, PRODUCTION_CYCLES, WOVEN_END_USES } from "../../../../../src/domains/rfq/constants";
import { detectWovenWeaves } from "../../../../../src/domains/rfq/weave/detect";
import { extractTextFields } from "../../../../../src/domains/rfq/text/extract";
import { deterministicGroups, MAX_TEXT, type TextGroup } from "../../../../../src/domains/rfq/text/grouping";
import { newLine, type RfqLine } from "./draft";
import { extractPlainLine } from "./plain-text-extraction";
import { splitPlainEntries } from "../../../../../src/domains/rfq/text/plain-grouping";
import { assessLineReadiness } from "./readiness";
import { inferFabricStateFromShade } from "./shade-inference";
import { applyPlatformWidthDefault } from "./platform-width";
import { recalculateGlmGsm } from "../../../../../src/domains/rfq/text/weight-conversion";
import { parseWidthBounds } from "../../../../../src/domains/rfq/text/width-bounds";
import { supplyStates } from "../../../../../src/domains/rfq/text/supply-state";

export const MAX_LINES = 200;
export const TEXT_REVIEW_WARNING = "Review grouping and every extracted value before sending. Unresolved wording is retained in notes and the original source.";
export function exactOption<T extends string>(value: string, options: readonly T[]): T | undefined {
  return options.find(option => option.toLowerCase().replace(/_/g, " ") === value.trim().toLowerCase().replace(/_/g, " "));
}
export function parseDescription(text: string): RfqLine {
  return description(text);
}
export function parsePlainDescription(text: string): RfqLine {
  const line = extractPlainLine(text);
  line.warnings.push(TEXT_REVIEW_WARNING);
  return line;
}
function description(text: string): RfqLine {
  const line = newLine();
  const extracted = extractTextFields(text);
  line.original = text;
  line.blend = extracted.blend;
  line.compositionUncertain = !!extracted.blend && !/%|\d+\s*\/\s*\d+/.test(extracted.blend);
  line.count = extracted.count; line.construction = extracted.construction; line.finish = extracted.finish;
  line.sourceEvidence = extracted.evidence;
  line.colours = extracted.colours.map(colour => ({ id: crypto.randomUUID(), ...colour }));
  line.warnings = extracted.warnings;
  line.gsmMin = extracted.gsmMin;
  line.gsmMax = extracted.gsmMax;
  line.gsmQualifier = extracted.gsmQualifier;
  line.gsmTolerance = extracted.gsmTolerance;
  line.gsmAlternatives = extracted.gsmAlternatives;
  line.gsmBound = extracted.gsmBound;
  line.quantityBound = extracted.quantityBound;
  line.quantityQualifier = extracted.quantityQualifier;
  line.weightInput = extracted.weightInput;
  line.gsmProvenance = extracted.gsmProvenance ?? (extracted.gsm !== undefined ? "extracted" : undefined);
  line.gsmDerivedReason = extracted.gsmDerivedReason;
  line.gsmDefaultWidthUsed = extracted.gsmDefaultWidthUsed;
  line.gsmWidthUsed = extracted.gsmWidthUsed;
  if (extracted.width) {
    line.widthProvenance = "extracted";
    const bounds = parseWidthBounds(extracted.width);
    if (bounds?.isRange) {
      line.widthMin = bounds.minInches;
      line.widthMax = bounds.maxInches;
    }
  }
  line.draft = { ...line.draft, gsm: extracted.gsm, width: extracted.width, quantity: extracted.quantity,
    endUse: exactOption(extracted.endUse || "", WOVEN_END_USES), additionalSpecs: extracted.notes || undefined };
  line.weaveDetection = detectWovenWeaves(text);
  const mentions = line.weaveDetection.mentions;
  const explicitWeaveLabel = text.match(/(?:^|\n)\s*(?:weave(?:\s*(?:type|detail|architecture|structure|pattern))?)\s*[:=-]\s*([^\r\n,;]+)/i);
  if (explicitWeaveLabel) {
    const rawWeave = explicitWeaveLabel[1].trim();
    const matchingMention = mentions.find(m => m.matchedTerm.toLowerCase() === rawWeave.toLowerCase());
    if (matchingMention && matchingMention.status === "recognized") {
      line.draft.weaveType = matchingMention.matchedTerm;
    } else if (matchingMention) {
      line.weaveDetail = matchingMention.matchedTerm;
    } else {
      line.draft.weaveType = rawWeave;
    }
  } else if (mentions.length === 1 && mentions[0].status === "recognized") {
    line.draft.weaveType = mentions[0].matchedTerm;
  } else if (mentions.length === 1 && mentions[0].status !== "recognized") {
    line.weaveDetail = mentions[0].matchedTerm;
  } else if (mentions.length > 1) {
    line.warnings.push("Several weave mentions were detected. Review every mention and enter the required weave as text.");
  }
  const labelledWeave = text.match(/\b(plain|twill|satin|dobby|jacquard|seersucker|oxford|poplin)\b\s+weave\b/i);
  if (labelledWeave) line.draft.weaveType = labelledWeave[1].replace(/^./, value => value.toUpperCase());
  for (const mention of mentions) {
    line.sourceEvidence.push({ field: "weave", kind: "explicit", text: mention.matchedTerm, start: mention.start, end: mention.end,
      ...(mention.needsReview ? { reason: "Weave interpretation needs review." } : {}) });
    if (mention.needsReview) line.warnings.push(`Review weave ${mention.status === "recognized" ? "mention" : "candidate"}: “${mention.matchedTerm}”. It is not automatically confirmed as a weave.`);
  }
  const states = BUYER_FABRIC_STATES.filter(state => state === "finished"
    ? supplyStates(text).some(item => item.value === state)
    : new RegExp(`\\b${state}\\b`, "i").test(text));
  if (states.length === 1) line.draft.fabricState = states[0];
  else if (states.length > 1) line.warnings.push("Several fabric states were mentioned; choose one.");
  inferFabricStateFromShade(line);
  const cycles = PRODUCTION_CYCLES.filter(cycle => new RegExp(cycle === "ready_stock" ? "\\bready(?: stock)?\\b" : cycle.replace(/_/g, "[ _]"), "i").test(text));
  if (cycles.length === 1) line.draft.productionCycle = cycles[0];
  const date = text.match(/\b\d{4}-\d{2}-\d{2}\b/);
  if (date) line.draft.requiredDeliveryDate = date[0];
  if (/\b(?:deliver|delivery|by)\b/i.test(text) && !date) line.warnings.push("Enter the target delivery date with its year; it was not inferred.");
  const labelledUse = text.match(/end use\s*[:=]\s*([^,;\n.]+)/i);
  if (labelledUse) line.draft.endUse = exactOption(labelledUse[1], WOVEN_END_USES);
  line.draft.customFabricName = [line.blend, line.draft.weaveType || line.weaveDetail].filter(Boolean).join(" ") || undefined;
  applyPlatformWidthDefault(line);
  const updatedWeight = recalculateGlmGsm(line);
  Object.assign(line, updatedWeight);
  line.warnings.push(TEXT_REVIEW_WARNING);
  return line;
}
export function parseGroups(groups: TextGroup[]): RfqLine[] {
  const entries = groups.flatMap(group => {
    const split = splitPlainEntries(group.source);
    return split ? split.map(entry => ({ ...entry, warnings: [...group.warnings, ...entry.warnings] })) : [group];
  });
  if (entries.length > MAX_LINES) throw new Error("Use at most 200 fabric requirements at a time.");
  return entries.map(group => {
    const line = parsePlainDescription(group.source);
    line.warnings.push(...group.warnings);
    return line;
  });
}
export function parseText(text: string): RfqLine[] {
  if (!text.trim()) throw new Error("Paste at least one fabric requirement.");
  if (text.length > MAX_TEXT) throw new Error(`Keep the requirement under ${MAX_TEXT.toLocaleString()} characters.`);
  const lines = parseGroups(splitPlainEntries(text) || deterministicGroups(text));
  const qualityMatch = text.match(/\b(\d+)\s+(?:separate\s+)?qualities\b/i);
  if (qualityMatch) {
    const expectedCount = parseInt(qualityMatch[1], 10);
    if (expectedCount > lines.length) {
      const msg = `Source mentions ${expectedCount} separate qualities, but only ${lines.length} fabric${lines.length > 1 ? "s were" : " was"} supplied. Review for missing entries.`;
      for (const line of lines) {
        if (!line.warnings.includes(msg)) {
          line.warnings.push(msg);
        }
      }
    }
  }
  return lines;
}
export function reviewMessage(line: RfqLine) {
  return assessLineReadiness(line).summary;
}
