import type { RfqDraft } from "../components/types";
import { referenceReviewIssues } from "./reference-review";
import { isFieldDisabled } from "../../../../../src/config/field-visibility";
import { isValidWidth } from "../../../../../src/domains/rfq/text/width-bounds";
import { PURE_FIBERS } from "../../../../../src/domains/rfq/constants";
import { batchInquirySchema } from "../../../../../src/domains/rfq/batch/schema";
import { blendState } from "./blend-state";
import { fibreKey, serializeBlend, type FibreRow } from "../../../../../src/domains/rfq/blend/rows";
import type { WeaveDetection } from "../../../../../src/domains/rfq/weave/vocabulary";
import type { Evidence } from "../../../../../src/domains/rfq/text/types";
import { inferenceNotes, submissionEvidence } from "./inference-evidence";
import type { TextCandidate } from "../../../../../src/domains/rfq/text/proposals";
import { type SourcingAlternative, validateAlternatives, analyzeAlternativesComposition } from "../../../../../src/domains/rfq/text/alternatives";

export type Colour = { id: string; name: string; metres: string; swatchUrl?: string; sourceText?: string };
export type RfqLine = {
  textExtractionMode?: "ai-assisted" | "deterministic";
  textCandidates?: TextCandidate[];
  plainTextSource?: boolean;
  sourceEvidence?: Evidence[];
  compositionUncertain?: boolean;
  weaveDetection?: WeaveDetection;
  voiceSourceId?: string;
  id: string;
  blend: string;
  blendRows?: FibreRow[];
  blendLegacyText?: string;
  draft: RfqDraft;
  fabricStateInferred?: boolean;
  colours: Colour[];
  unsureColours: boolean;
  count: string;
  construction: string;
  finish: string;
  finishQualifiers?: string[];
  finishExclusions?: string[];
  finishAlternatives?: string[];
  finishConfirmed?: boolean;
  colourExclusions?: string[];
  colourAlternatives?: string[];
  colourReferences?: string[];
  coloursConfirmed?: boolean;
  fibreQualifiers?: string[];
  weaveDetail: string;
  weaveAlternatives?: string[];
  weaveExclusions?: string[];
  weaveNotes?: string[];
  warnings: string[];
  original: string;
  counterSamplePreference?: "exact" | "closest";
  counterSampleCourier?: string;
  sourcingAlternatives?: SourcingAlternative[];
  selectedAlternativeId?: string;
  widthBasis?: "greige" | "finished" | "cuttable" | "unqualified";
  widthQualifier?: string;
  widthProvenance?: "extracted" | "manual" | "default" | "cleared";
  widthDefaultNote?: string;
  widthMin?: number;
  widthMax?: number;
  targetPriceAmount?: number;
  targetPriceCurrency?: string;
  targetPriceCurrencySymbol?: string;
  targetPriceCurrencyUnresolved?: boolean;
  targetPriceBasis?: "per_metre" | "per_yard" | "per_kg" | "per_piece" | "per_roll" | "unspecified";
  targetPriceQualifier?: string;
  targetPriceIndicative?: boolean;
  targetPriceOperator?: ">" | ">=" | "<" | "<=";
  targetPriceStatus?: "exact" | "range" | "approximate" | "indicative" | "tolerance" | "alternatives" | "bound";
  targetPriceMin?: number;
  targetPriceMax?: number;
  targetPriceTolerance?: number;
  targetPriceCommercialQualifiers?: string[];
  targetPriceConfirmed?: boolean;
  metadataNotes?: string[];
  gsmMin?: number;
  gsmMax?: number;
  gsmQualifier?: string;
  gsmTolerance?: number;
  gsmAlternatives?: number[];
  gsmBound?: { value: number; operator: ">" | ">=" | "<" | "<="; label: string };
  gsmProvenance?: "extracted" | "derived" | "manual" | "cleared";
  gsmDerivedReason?: string;
  gsmDefaultWidthUsed?: boolean;
  gsmWidthUsed?: string;
  weightInput?: {
    value: number;
    unit: "glm" | "oz/yd2" | "oz/m2" | "bare_oz" | "gsm";
    rawText: string;
    rawUnit: string;
    min?: number;
    max?: number;
    tolerance?: number;
    basis?: string;
  };
  quantityBound?: { value: number; operator: ">" | ">=" | "<" | "<="; label: string };
  quantityQualifier?: string;
};
export type Destination = Pick<
  RfqDraft,
  "deliveryAddress" | "deliveryCountry" | "deliveryState" | "deliveryCity" | "deliveryPincode" | "contactPhone" | "certifications"
>;
export const EMPTY_DESTINATION: Destination = { deliveryCountry: "India" };
export function newLine(): RfqLine {
  return {
    id: crypto.randomUUID(),
    blend: "",
    blendRows: [{ id: "fibre-0", fibre: "", percentage: "" }],
    draft: { fabricStructure: "woven", selectedPath: "production" },
    colours: [],
    unsureColours: false,
    count: "",
    construction: "",
    finish: "",
    weaveDetail: "",
    warnings: [],
    original: "",
  };
}
export function duplicateLine(line: RfqLine): RfqLine {
  return {
    ...structuredClone(line),
    id: crypto.randomUUID(),
    colours: line.colours.map((colour) => ({ ...colour, id: crypto.randomUUID() })),
  };
}
export function lineTitle(line: RfqLine) {
  return (
    line.draft.customFabricName || [(!isFieldDisabled("weaveDetail") && line.weaveDetail) || line.draft.weaveType, line.blend].filter(Boolean).join(" · ") || "New fabric line"
  );
}

export function lineDraft(line: RfqLine, destination: Destination = {}): RfqDraft {
  const composition = blendState(line);
  let blend = serializeBlend(composition.rows, true);
  let pure = PURE_FIBERS.find((fibre) =>
    composition.state === "complete" && composition.rows.length === 1 &&
    Number(composition.rows[0].percentage) === 100 && fibreKey(composition.rows[0].fibre) === fibre
  );
  if (line.sourcingAlternatives?.length) {
    const val = validateAlternatives(line.sourcingAlternatives);
    if (val.state === "complete") {
      const analysis = analyzeAlternativesComposition(line.sourcingAlternatives);
      if (analysis.commonFibre && (PURE_FIBERS as readonly string[]).includes(analysis.commonFibre)) {
        pure = analysis.commonFibre as (typeof PURE_FIBERS)[number];
        blend = `100% ${analysis.commonFibre}`;
      }
    }
  }
  const details = [
    line.draft.additionalSpecs,
    composition.legacyText && `Unclear original blend: ${composition.legacyText}`,
    line.blendRows && serializeBlend(composition.rows) !== blend && `Buyer composition wording: ${serializeBlend(composition.rows)}`,
    ...inferenceNotes(line),
    !isFieldDisabled("weaveDetail") && line.weaveDetail && `Weave detail: ${line.weaveDetail}`,
    ...(line.weaveAlternatives?.length ? [`Weave alternatives: ${line.weaveAlternatives.join(" or ")}`] : []),
    ...(line.weaveExclusions || []).map(ex => `Weave exclusion: No ${ex}`),
    ...(line.weaveNotes || []),
    line.finish && `Finish: ${line.finish}`,
    ...(line.finishExclusions || []).map(ex => `Finish exclusion: ${ex}`),
    ...(line.finishQualifiers || []).map(q => `Finish qualifier: ${q}`),
    ...(line.finishAlternatives?.length ? [`Finish alternatives: ${line.finishAlternatives.join(" or ")}`] : []),
    ...(line.weaveDetection?.mentions ?? []).map(mention =>
      `Weave ${mention.status === "recognized" ? "mention" : "candidate (needs review)"}: ${mention.matchedTerm}`),
    line.unsureColours && "Exact colours to be confirmed",
    ...(line.colourExclusions || []).map(ex => `Colour exclusion: ${ex}`),
    ...(line.colourAlternatives?.length ? [`Colour alternatives: ${line.colourAlternatives.join(" or ")}`] : []),
    ...(line.colourReferences || []).map(ref => `Colour reference: ${ref}`),
    line.gsmQualifier && `GSM specification: ${line.gsmQualifier}`,
    line.quantityBound && `Quantity specification: ${line.quantityBound.label} ${line.quantityBound.value} m`,
    line.targetPriceQualifier && !line.draft.targetPriceMax && `Target price: ${line.targetPriceAmount ?? ""} (${line.targetPriceQualifier})`,
    line.draft.sendCounterSample &&
      line.counterSamplePreference &&
      `Counter sample — mills should: ${line.counterSamplePreference === "exact" ? "Match it exactly" : "Closest available"}`,
    line.draft.sendCounterSample &&
      line.counterSampleCourier?.trim() &&
      `Counter sample — courier and AWB: ${line.counterSampleCourier.trim()}`,
    ...line.colours.filter((colour) => colour.metres).map((colour) => `Colour quantity: ${colour.name || "unnamed"}: ${colour.metres} m`),
    ...line.colours
      .filter((colour) => colour.swatchUrl)
      .map((colour) => `Swatch for ${colour.name || "unnamed colour"}: ${colour.swatchUrl}`),
    !line.voiceSourceId && line.original && `Original description: ${line.original}`,
  ].filter(Boolean);
  const specs = [...(line.draft.templateSpecs ?? [])];
  const count = line.count.split(/\s*[×x*]\s*/i);
  if (line.count && count.length === 2 && count.every(Boolean)) {
    specs.push({ specKey: "warp_count_ply", valueText: count[0] }, { specKey: "weft_count_ply", valueText: count[1] });
  } else if (line.count) details.push(`Count: ${line.count}`);
  const density = line.construction.match(/^\s*(\d+)\s*[×x*/]\s*(\d+)\s*$/i);
  if (density) specs.push({ specKey: "epi", valueNum: Number(density[1]) }, { specKey: "ppi", valueNum: Number(density[2]) });
  else if (line.construction) details.push(`Construction: ${line.construction}`);
  const colourNames = line.colours.map((colour) => colour.name.trim()).filter(Boolean);
  return {
    ...line.draft,
    ...destination,
    fabricStructure: "woven",
    selectedPath: "production",
    materialType: pure ? "pure" : "blend",
    pureFiber: pure,
    blendComposition: pure ? undefined : blend.trim() || undefined,
    colorInfo: colourNames[0],
    colorInfoList: colourNames,
    templateSpecs: specs,
    ...(line.sourceEvidence?.length ? { extractionEvidence: submissionEvidence(line) } : {}),
    additionalSpecs: details.join("\n") || undefined,
  };
}

export function missingRequired(line: RfqLine): string[] {
  const d = line.draft;
  let blendComplete = blendState(line).state === "complete";
  if (line.sourcingAlternatives?.length) {
    const val = validateAlternatives(line.sourcingAlternatives);
    blendComplete = val.state === "complete";
  }
  return [
    !blendComplete && "blend",
    !(d.gsm && d.gsm > 0) && "GSM",
    !d.weaveType && "weave",
    !(d.width && isValidWidth(d.width)) && "width",
    !d.fabricState && "fabric state",
    !(d.quantity && Number.isInteger(d.quantity) && d.quantity > 0 && d.quantity <= 2_147_483_647) && "quantity",
    !d.productionCycle && "production cycle",
  ].filter((value): value is string => !!value);
}
export function lineIssues(line: RfqLine, destination: Destination): string[] {
  const parsed = batchInquirySchema.safeParse(lineDraft(line, destination));
  const labels: Record<string, string> = {
    endUse: "End use",
    dyeMethod: "Dye method",
    dyeColorType: "Dye type",
    printMethod: "Print method",
    printBaseType: "Print base",
    colorInfo: "Colours",
    deliveryCity: "Delivery city",
    deliveryState: "Delivery state",
    deliveryPincode: "Pincode",
    contactPhone: "Contact phone",
  };
  type Issue = { code: string; path: PropertyKey[]; message: string; errors?: Issue[][] };
  function messages(issue: Issue): string[] {
    if (issue.code === "invalid_union") return (issue.errors?.[0] ?? []).flatMap(messages);
    const field = String(issue.path[0] || "Details");
    return [`${labels[field] || field}: ${issue.message}`];
  }
  const composition = blendState(line);
  let blendError = composition.error || (composition.state !== "complete" ? "Complete every fibre row and reach 100% before sending." : null);
  if (line.sourcingAlternatives?.length) {
    const val = validateAlternatives(line.sourcingAlternatives);
    if (val.state === "error") {
      blendError = val.error || "Alternatives percentage error.";
    } else if (val.state !== "complete") {
      blendError = "Confirm percentage for each alternative separately before sending.";
    } else {
      blendError = null;
    }
  }
  return [...referenceReviewIssues(line), ...(blendError ? [blendError] : []), ...(parsed.success ? [] : [...new Set(parsed.error.issues.flatMap(messages))])];
}
export function lineDetailIssues(line: RfqLine) {
  return lineIssues(line, {
    deliveryCountry: "India",
    deliveryState: "Review",
    deliveryCity: "Review",
    deliveryPincode: "000",
    contactPhone: "0000000000",
  });
}
export function buildBatch(lines: RfqLine[], destination: Destination, idempotencyKey: string) {
  return { idempotencyKey, lines: lines.map((line) => ({ lineId: line.id, inquiry: lineDraft(line, destination) })) };
}
