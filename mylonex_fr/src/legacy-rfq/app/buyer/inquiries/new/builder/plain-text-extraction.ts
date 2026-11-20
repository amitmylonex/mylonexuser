import { TextAnalysis } from "../../../../../src/domains/rfq/text/analysis";
import { collectPlainFields } from "../../../../../src/domains/rfq/text/plain-fields";
import { technicalPhrases } from "../../../../../src/domains/rfq/text/technical-phrases";
import { extractPlainTechnical, reserveTechnical } from "../../../../../src/domains/rfq/text/plain-technical";
import { applyWeaveSelection } from "./weave-selection";
import { classifyPlainWeaves } from "../../../../../src/domains/rfq/text/plain-weave";
import { inferNumbers } from "../../../../../src/domains/rfq/text/infer-numbers";
import { newLine, type RfqLine } from "./draft";
import { applyPlainMetadata } from "./plain-text-metadata";
import { WOVEN_END_USES } from "../../../../../src/domains/rfq/constants";
import { wovenSpecsStepSchema } from "../../../../../src/domains/rfq/schema";
import { reserveAlternatives, detectSourcingAlternatives, analyzeAlternativesComposition } from "../../../../../src/domains/rfq/text/alternatives";
import { entryLabel } from "../../../../../src/domains/rfq/text/plain-grouping";
import { applyPlainYarns } from "./plain-text-yarns";
import { reservePlainContext } from "../../../../../src/domains/rfq/text/plain-context";
import { initializeBlend } from "./blend-state";
import { widthPhrases } from "../../../../../src/domains/rfq/text/width-phrases";
import { applyPlatformWidthDefault } from "./platform-width";
import { inferFabricStateFromShade } from "./shade-inference";
import { recalculateGlmGsm } from "../../../../../src/domains/rfq/text/weight-conversion";
import { parseWidthBounds } from "../../../../../src/domains/rfq/text/width-bounds";
import { inferFabricStateFromWidth } from "./width-state-inference";

/** One staged plain-text extraction. No calls to grouping, AI, storage or submit. */
export function extractPlainLine(original: string): RfqLine {
  // 1–2. Grouping already established the fabric boundary; normalize a mapped copy.
  const analysis = new TextAnalysis(original);
  const label = entryLabel(original);
  if (label) analysis.claim({ field: "entry", text: label[0], start: 0, end: label[0].length, kind: "explicit" });
  const alternatives = reserveAlternatives(analysis);
  reservePlainContext(analysis);
  // Metadata uses original offsets too, with only unselected choices hidden.
  const commonSource = original.split("").map((char, index) => analysis.claims.some(item => item.start <= index && index < item.end)
    ? char === "\n" || char === ";" || char === "." ? char : " " : char).join("");
  const fields = collectPlainFields(analysis);
  const line = newLine();
  line.original = original; line.plainTextSource = true;
  line.blend = fields.blend; line.fibreQualifiers = fields.fibreQualifiers; line.finish = fields.finish;
  line.finishQualifiers = fields.finishQualifiers;
  line.finishExclusions = fields.finishExclusions;
  line.finishAlternatives = fields.finishAlternatives;
  line.finishConfirmed = fields.finishConfirmed;
  line.compositionUncertain = !!fields.blend && !/%|\d+\s*\/\s*\d+/.test(fields.blend);
  line.colours = fields.colours.map(colour => ({ id: crypto.randomUUID(), ...colour }));
  line.colourExclusions = fields.colourExclusions;
  line.colourAlternatives = fields.colourAlternatives;
  line.colourReferences = fields.colourReferences;
  line.unsureColours = fields.colourReferences?.some(note => /exact colours to be confirmed/i.test(note)) ?? false;
  line.coloursConfirmed = fields.coloursConfirmed;
  line.warnings = fields.warnings;
  if (fields.notes) line.metadataNotes = fields.notes.split("\n").filter(Boolean);
  line.gsmMin = fields.gsmMin;
  line.gsmMax = fields.gsmMax;
  line.gsmQualifier = fields.gsmQualifier;
  line.gsmTolerance = fields.gsmTolerance;
  line.gsmAlternatives = fields.gsmAlternatives;
  line.gsmBound = fields.gsmBound;
  line.quantityBound = fields.quantityBound;
  line.quantityQualifier = fields.quantityQualifier;
  line.weightInput = fields.weightInput;
  line.gsmProvenance = fields.gsmProvenance ?? (fields.gsm !== undefined ? "extracted" : undefined);
  line.gsmDerivedReason = fields.gsmDerivedReason;
  line.gsmDefaultWidthUsed = fields.gsmDefaultWidthUsed;
  line.gsmWidthUsed = fields.gsmWidthUsed;
  const initialQuantity = fields.quantity ?? (fields.quantityBound && (fields.quantityBound.operator === ">=" || fields.quantityBound.operator === "<=") ? fields.quantityBound.value : undefined);
  if (fields.width) {
    line.widthProvenance = "extracted";
    const bounds = parseWidthBounds(fields.width);
    if (bounds?.isRange) {
      line.widthMin = bounds.minInches;
      line.widthMax = bounds.maxInches;
    }
  }
  line.draft = { ...line.draft, gsm: fields.gsm, width: fields.width, quantity: initialQuantity,
    endUse: WOVEN_END_USES.find(option => option === fields.endUse) };
  // 3. Labelled/unit-bearing phrases and metadata establish primary roles first.
  line.sourceEvidence = fields.evidence.map(item => {
    const mapped = analysis.evidence(item);
    if (mapped.field === "gsm" && mapped.kind === "inferred" && mapped.reason?.includes("GSM inferred from")) {
      const note = `${mapped.value} GSM inferred from ‘${mapped.text}’; please confirm.`;
      mapped.reason = note;
      line.warnings = line.warnings.map(w => w.includes("GSM inferred from") ? note : w);
    }
    return mapped;
  });
  applyPlainMetadata(commonSource, line);
  if (alternatives) {
    line.sourcingAlternatives = detectSourcingAlternatives(original);
    const altAnalysis = analyzeAlternativesComposition(line.sourcingAlternatives);
    if (!line.blend) {
      line.blend = "";
      line.blendRows = [{ id: "fibre-0", fibre: "", percentage: "" }];
      if (altAnalysis.conflict) {
        line.warnings.push("Multiple sourcing alternatives with different fibre compositions detected. Confirm blend; sourcing alternatives are retained in Notes.");
      } else {
        line.warnings.push("OPTION alternatives were retained in source details. Alternatives are displayed in Blend for confirmation; no option was selected automatically.");
      }
    } else {
      const initialized = initializeBlend(line);
      line.blendRows = initialized.blendRows;
      line.blendLegacyText = initialized.blendLegacyText;
    }
  } else if (line.blend) {
    const initialized = initializeBlend(line);
    line.blendRows = initialized.blendRows;
    line.blendLegacyText = initialized.blendLegacyText;
  }
  if (fields.compositionReview) line.blendLegacyText = fields.compositionReview;
  for (const item of line.sourceEvidence) {
    // 'Piece dyed' explicitly describes both state and method; 'reactive dyed'
    // describes state and dye type. These are explicit multi-role phrases.
    const related = item.field === "dyeMethod" ? ["fabricState"] : item.field === "dyeColorType" ? ["fabricState", "dyeMethod"] : [];
    analysis.claim(item, related);
  }
  const phrases = technicalPhrases(analysis);
  phrases.candidates = reserveTechnical(analysis, phrases.candidates);
  for (const item of phrases.incomplete) {
    const reason = item.reason ?? `Only one directional ${item.field} was supplied; confirm the other in the source.`;
    analysis.claim(analysis.evidence({ field: item.field, start: item.start, end: item.end, text: "", kind: "unresolved", reason }));
    line.warnings.push(reason);
  }
  // 4. Weave owns its ratio before unlabelled pairs can become count/density.
  line.weaveDetection = classifyPlainWeaves(analysis);
  const mentions = line.weaveDetection.mentions;
  applyWeaveSelection(line);
  // 5. Established pair order and, last, genuinely unassigned numbers.
  extractPlainTechnical(analysis, fields, phrases, !!fields.blend || mentions.some(item => item.status === "recognized"));
  line.count = fields.count; line.construction = fields.construction;
  // Remove colour entries whose source text falls entirely within a claimed
  // typed-count span. Colour names like "White" inside a yarn description
  // (e.g. "80D/72/2 Poly HIM Roto FD White") are yarn descriptors, not fabric
  // colours. After count is claimed, the colour claim overlaps it; compare
  // original positions to detect and remove these descriptor colours.
  const countClaim = analysis.claims.find(item => item.field === "count");
  if (countClaim) {
    line.colours = line.colours.filter(colour => {
      const ev = line.sourceEvidence?.find(item => item.field === "colour" && item.text.toLowerCase() === colour.name.toLowerCase());
      if (!ev) return true;
      // Keep if the colour evidence is entirely outside the count claim span.
      return !(ev.start >= countClaim.start && ev.end <= countClaim.end);
    });
    // Mirror in sourceEvidence: mark colour evidence inside count as unresolved yarn descriptors.
    if (line.sourceEvidence) {
      for (const item of line.sourceEvidence) {
        if (item.field === "colour" && item.start >= countClaim.start && item.end <= countClaim.end) {
          item.kind = "unresolved";
          item.reason = "Colour name inside a yarn description is a yarn descriptor, not a fabric colour.";
        }
      }
    }
  }
  // When both warp and weft yarns are present but their fibre types differ (even
  // without explicit percentages), the overall composition cannot be inferred by
  // summing or averaging. Clear the blend and preserve each yarn description.
  const yarnPairs = phrases.pairs.filter(p => p.yarns && p.yarns.length === 2);
  if (yarnPairs.length > 0 && !line.blend.includes("%")) {
    const warpSource = yarnPairs[0].yarns ? analysis.phrase(yarnPairs[0].yarns[0].start, yarnPairs[0].yarns[0].end) : "";
    const weftSource = yarnPairs[0].yarns ? analysis.phrase(yarnPairs[0].yarns[1].start, yarnPairs[0].yarns[1].end) : "";
    // Check if warp and weft have different fibre tokens
    if (warpSource && weftSource) {
      const fibreWords = /\b(?:poly(?:ester)?|cotton|viscose|nylon|linen|bamboo|silk|modal|tencel|lyocell|lyocel|elastane|spandex|acrylic|wool|rayon)\b/gi;
      const warpFibres = new Set([...warpSource.matchAll(fibreWords)].map(m => m[0].toLowerCase().slice(0, 4)));
      const weftFibres = new Set([...weftSource.matchAll(fibreWords)].map(m => m[0].toLowerCase().slice(0, 4)));
      const differ = [...warpFibres].some(f => !weftFibres.has(f)) || [...weftFibres].some(f => !warpFibres.has(f));
      if (differ && warpFibres.size > 0 && weftFibres.size > 0) {
        line.blend = "";
        line.warnings = line.warnings.filter(w => !/fibre percentages|named fibres/i.test(w));
        line.warnings.push("Warp/weft compositions differ or need confirmation. Overall composition was not averaged or added.");
      }
    }
  }
  const yarnNotes = applyPlainYarns(analysis, phrases.pairs, line);
  if (line.blend && (!line.blendRows || line.blendRows.length === 0 || !line.blendRows[0].fibre)) {
    const initialized = initializeBlend(line);
    line.blendRows = initialized.blendRows;
    line.blendLegacyText = initialized.blendLegacyText;
  }
  fields.blend = line.blend;
  fields.evidence = analysis.claims.map(item => analysis.normalized(item));
  const assigned = fields.evidence.length;
  inferNumbers(analysis.text, fields);
  for (const item of fields.evidence.slice(assigned)) analysis.claim(analysis.evidence(item));
  // 6. Contextual proposals cannot satisfy a required field until confirmed.
  for (const item of analysis.claims.filter(item => item.kind === "inferred")) {
    if (item.field === "gsm" && (item.reason?.includes("GSM inferred from") || item.reason?.includes("Assumed oz/yd² basis"))) {
      continue;
    }
    if (item.field === "quantity" && (item.reason?.includes("Calculated total") || item.reason?.includes("calculated total") || item.reason?.includes("from colour breakdown") || item.reason?.includes("from colour quantities"))) {
      continue;
    }
    if (item.field === "gsm" || item.field === "quantity") {
      delete line.draft[item.field];
      line.warnings.push(`Proposed ${item.field}: ${item.value}${item.unit ? ` ${item.unit}` : ""}. Enter it after confirmation; the required field stays blank.`);
    }
    if (item.field === "blend" && line.blend) {
      line.warnings.push(`Proposed blend: ${line.blend}. Confirm the percentages before entering them.`); line.blend = "";
    }
  }
  for (const key of ["gsm", "width", "weaveType", "yarnType", "customFabricName"] as const) {
    const value = line.draft[key];
    if (value !== undefined && !wovenSpecsStepSchema.shape[key].safeParse(value).success) {
      delete line.draft[key]; line.warnings.push(`The extracted ${key} does not fit the existing RFQ field. Confirm it in the source.`);
    }
  }
  line.sourceEvidence = analysis.claims.sort((a, b) => a.start - b.start || a.end - b.end);
  const captured = new Array(original.length).fill(false);
  for (const item of analysis.claims.filter(item => item.kind === "explicit" || (item.kind === "inferred" && item.field === "gsm" && line.draft.gsm === item.value))) for (let index = item.start; index < item.end; index++) captured[index] = true;
  line.draft.additionalSpecs = original.split("").map((char, index) => captured[index] ? " " : char).join("")
    .replace(/[ \t]+/g, " ").replace(/^[\s,;.]+|[\s,;.]+$/g, "").trim() || undefined;
  if (yarnNotes.length) line.draft.additionalSpecs = [line.draft.additionalSpecs, ...yarnNotes].filter(Boolean).join("\n");
  if (line.targetPriceQualifier && !line.draft.additionalSpecs?.includes(line.targetPriceQualifier)) {
    line.draft.additionalSpecs = [line.draft.additionalSpecs, line.targetPriceQualifier].filter(Boolean).join("\n");
  }
  if (line.metadataNotes) {
    for (const note of line.metadataNotes) {
      if (!line.draft.additionalSpecs?.includes(note)) {
        line.draft.additionalSpecs = [line.draft.additionalSpecs, note].filter(Boolean).join("\n");
      }
    }
  }
  if (line.fibreQualifiers) {
    for (const note of line.fibreQualifiers) {
      if (!line.draft.additionalSpecs?.includes(note)) {
        line.draft.additionalSpecs = [line.draft.additionalSpecs, note].filter(Boolean).join("\n");
      }
    }
  }
  if (line.weaveExclusions?.length) {
    const exclNote = `Weave exclusion: No ${line.weaveExclusions.join(", ")}.`;
    if (!line.draft.additionalSpecs?.includes(exclNote)) {
      line.draft.additionalSpecs = [line.draft.additionalSpecs, exclNote].filter(Boolean).join("\n");
    }
  }
  if (line.weaveNotes?.length) {
    for (const note of line.weaveNotes) {
      if (!line.draft.additionalSpecs?.includes(note)) {
        line.draft.additionalSpecs = [line.draft.additionalSpecs, note].filter(Boolean).join("\n");
      }
    }
  }
  // Greige/grey width is captured as an unresolved candidate. Preserve it visibly in
  // additional specs so the buyer can see the stated dimension and its basis,
  // and confirm a finished/cuttable width. Do not present it as "missing" width.
  const widthFacts = widthPhrases(original);
  const finishedWidthFact = widthFacts.find(f => f.basis === "finished");
  const greigeWidthFact = widthFacts.find(f => f.basis === "greige");
  if (finishedWidthFact) {
    line.widthBasis = "finished";
    line.widthQualifier = finishedWidthFact.qualifier;
    if (greigeWidthFact) {
      const greigeNote = `Stated width: ${greigeWidthFact.value} inches · Greige width`;
      if (!line.draft.additionalSpecs?.includes(greigeNote))
        line.draft.additionalSpecs = [line.draft.additionalSpecs, greigeNote].filter(Boolean).join("\n");
    }
  } else if (greigeWidthFact) {
    line.widthBasis = "greige";
    line.widthQualifier = greigeWidthFact.qualifier;
    const basisLabel = "Greige width";
    const widthNote = `Stated width: ${greigeWidthFact.value} inches · ${basisLabel}`;
    if (!line.draft.additionalSpecs?.includes(widthNote))
      line.draft.additionalSpecs = [line.draft.additionalSpecs, widthNote].filter(Boolean).join("\n");
  }
  line.warnings = line.warnings.filter(w => !w.startsWith("Stated greige width is a qualified") && !w.startsWith("Width stated as"));
  if (line.gsmQualifier && !line.draft.additionalSpecs?.includes(line.gsmQualifier)) {
    line.draft.additionalSpecs = [line.draft.additionalSpecs, `GSM: ${line.gsmQualifier}`].filter(Boolean).join("\n");
  }
  if (line.quantityBound && !line.draft.additionalSpecs?.includes(line.quantityBound.label)) {
    line.draft.additionalSpecs = [line.draft.additionalSpecs, `Quantity: ${line.quantityBound.label} ${line.quantityBound.value.toLocaleString()} m`].filter(Boolean).join("\n");
  }
  const context = analysis.claims.filter(item => ["exclusion", "colourCount", "quotationRequest"].includes(item.field));
  if (context.length) line.draft.additionalSpecs = [line.draft.additionalSpecs, ...context.map(item => item.text)].filter(Boolean).join("\n");
  for (const item of context.filter(item => item.field === "colourCount")) line.warnings.push(`Colour count stated: ${item.text}. Names and individual quantities remain unspecified.`);
  if (!alternatives) {
    const organicMatch = original.match(/\b(?:100%\s+)?(?:gots\s+)?(?:nop-certified\s+)?organic\s+cotton\b/i);
    if (organicMatch && !line.draft.additionalSpecs?.includes("Organic requirement:")) {
      const note = `Organic requirement: ${organicMatch[0]}`;
      line.draft.additionalSpecs = [line.draft.additionalSpecs, note].filter(Boolean).join("\n");
    }
  }
  const qualityMatch = original.match(/\b(\d+)\s+(?:separate\s+)?qualities\b/i);
  if (qualityMatch && parseInt(qualityMatch[1], 10) > 1) {
    line.warnings.push(`Source mentions ${qualityMatch[1]} separate qualities, but only 1 fabric was supplied. Review for missing entries.`);
  }
  inferFabricStateFromShade(line);
  inferFabricStateFromWidth(line, widthFacts);
  applyPlatformWidthDefault(line);
  const updatedWeight = recalculateGlmGsm(line);
  Object.assign(line, updatedWeight);
  line.warnings = [...new Set(line.warnings)];
  return line;
}
