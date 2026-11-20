import type { RfqDraft } from "../components/types";
import { isFieldDisabled } from "../../../../../src/config/field-visibility";
import type { RfqLine } from "./draft";
import { blendState } from "./blend-state";
import { parsePlainDescription, TEXT_REVIEW_WARNING } from "./parse-text";
import { MAX_TEXT } from "../../../../../src/domains/rfq/text/grouping";

const DRAFT_FIELDS = {
  gsm: "GSM", width: "Width", quantity: "Quantity (m)", weaveType: "Weave", fabricState: "Fabric state",
  productionCycle: "Production cycle", customFabricName: "Fabric name", yarnType: "Yarn type", endUse: "End use",
  dyeMethod: "Dye method", dyeColorType: "Dye type", printMethod: "Print method", printBaseType: "Print base", requiredDeliveryDate: "Target delivery",
  targetPriceMax: "Target price (₹/m)", additionalSpecs: "Source notes",
} satisfies Partial<Record<keyof RfqDraft, string>>;
const LINE_FIELDS = { count: "Count", construction: "Construction", finish: "Finish", weaveDetail: "Weave detail" };
export const SOURCE_FIELDS = { blend: "Blend", ...DRAFT_FIELDS, ...LINE_FIELDS, colours: "Colours and metre splits" };
export type SourceField = keyof typeof SOURCE_FIELDS;
export type SourceChange = { key: SourceField; label: string; current: string; proposed: string };
const hasKey = <T extends object>(value: T, key: PropertyKey): key is keyof T => Object.prototype.hasOwnProperty.call(value, key);

export function canEditTextSource(line: RfqLine) {
  // Old pasted drafts predate the explicit marker. Their exact parser warning is
  // retained; image and sheet mappers replace it and voice has its own source ID.
  return !!line.original && !line.voiceSourceId && (line.plainTextSource === true ||
    (line.plainTextSource === undefined && line.warnings.includes(TEXT_REVIEW_WARNING)));
}
export function rereadSource(source: string): RfqLine {
  if (!source.trim()) throw new Error("Enter source text before re-reading this line.");
  if (source.length > MAX_TEXT) throw new Error(`Keep source text under ${MAX_TEXT.toLocaleString()} characters.`);
  return parsePlainDescription(source); // Deliberately one draft, with no network or grouping.
}
function value(line: RfqLine, key: SourceField): unknown {
  if (key === "blend") {
    const blend = blendState(line);
    return { rows: blend.rows.map(({ fibre, percentage }) => ({ fibre, percentage })), legacyText: blend.legacyText || "" };
  }
  if (key === "colours") return line.colours.map(({ name, metres }) => ({ name, metres }));
  if (hasKey(DRAFT_FIELDS, key)) return line.draft[key] ?? "";
  return line[key];
}
export function sourceSignature(line: RfqLine, key: SourceField): string {
  return JSON.stringify(value(line, key));
}
export function sourceSelectionSignature(line: RfqLine, key: SourceField): string {
  // Swatches do not create extracted-value differences, but attaching one during
  // review must invalidate an earlier selection to replace the colour list.
  return key === "colours" ? JSON.stringify(line.colours) : sourceSignature(line, key);
}
function display(line: RfqLine, key: SourceField): string {
  if (key === "blend") {
    const blend = blendState(line);
    return blend.legacyText || blend.rows.map(row => [row.percentage && `${row.percentage}%`, row.fibre].filter(Boolean).join(" ")).filter(Boolean).join(" / ") || "Not extracted";
  }
  if (key === "colours") return line.colours.map(colour => `${colour.name || "Unnamed colour"}${colour.metres ? `: ${colour.metres} m` : ""}${colour.swatchUrl ? " (swatch attached)" : ""}`).join(", ") || "Not extracted";
  const labels: Record<string, string> = { ready_stock: "Ready", running_production: "Running production", made_to_order: "Made to order", rfd: "RFD" };
  const raw = String(value(line, key));
  return labels[raw] || raw.replace(/_/g, " ") || "Not extracted";
}
export function sourceChanges(current: RfqLine, proposal: RfqLine): SourceChange[] {
  return (Object.keys(SOURCE_FIELDS) as SourceField[])
    .filter(key => !isFieldDisabled(key))
    .filter(key => sourceSignature(current, key) !== sourceSignature(proposal, key))
    .map(key => ({ key, label: SOURCE_FIELDS[key], current: display(current, key), proposed: display(proposal, key) }));
}
export function applySourceChanges(current: RfqLine, proposal: RfqLine, selected: readonly SourceField[]): RfqLine {
  const next = { ...current, draft: { ...current.draft }, original: proposal.original, plainTextSource: true, textExtractionMode: proposal.textExtractionMode, textCandidates: proposal.textCandidates };
  for (const key of selected) {
    if (key === "blend") {
      next.blend = proposal.blend;
      next.blendRows = structuredClone(proposal.blendRows);
      next.blendLegacyText = proposal.blendLegacyText;
      next.compositionUncertain = proposal.compositionUncertain;
      next.fibreQualifiers = proposal.fibreQualifiers;
    } else if (key === "colours") {
      // Keep matching swatches and their reference URLs when accepting new shades.
      next.colours = proposal.colours.map(colour => {
        const previous = current.colours.find(item => item.name.trim().toLowerCase() === colour.name.trim().toLowerCase());
        return { ...colour, ...(previous ? { id: previous.id, swatchUrl: previous.swatchUrl } : {}) };
      });
    } else if (hasKey(DRAFT_FIELDS, key)) {
      Object.assign(next.draft, { [key]: proposal.draft[key] });
      if (key === "fabricState") next.fabricStateInferred = proposal.fabricStateInferred;
      if (key === "gsm") {
        next.weightInput = proposal.weightInput;
        next.gsmProvenance = proposal.gsmProvenance;
        next.gsmDerivedReason = proposal.gsmDerivedReason;
        next.gsmDefaultWidthUsed = proposal.gsmDefaultWidthUsed;
        next.gsmWidthUsed = proposal.gsmWidthUsed;
        next.gsmMin = proposal.gsmMin;
        next.gsmMax = proposal.gsmMax;
        next.gsmQualifier = proposal.gsmQualifier;
        next.gsmTolerance = proposal.gsmTolerance;
        next.gsmAlternatives = proposal.gsmAlternatives;
        next.gsmBound = proposal.gsmBound;
      }
    }
    else if (hasKey(LINE_FIELDS, key)) next[key] = proposal[key];
  }
  const evidenceKey = (field: string): SourceField | undefined => {
    if (field === "colour" || field === "per-colour quantity") return "colours";
    if (field === "weave") return "weaveType";
    return hasKey(SOURCE_FIELDS, field) ? field : undefined;
  };
  next.sourceEvidence = proposal.sourceEvidence?.map(item => {
    const key = evidenceKey(item.field);
    return { ...item, applied: item.kind === "explicit" && !!key && sourceSignature(next, key) === sourceSignature(proposal, key) };
  });
  if (current.widthProvenance === "default" && proposal.widthProvenance === "extracted" && proposal.draft.width) {
    next.draft.width = proposal.draft.width;
    next.widthProvenance = "extracted";
    delete next.widthDefaultNote;
  }
  next.weaveDetection = proposal.weaveDetection;
  const kept = sourceChanges(next, proposal).map(change => change.label);
  next.warnings = [...proposal.warnings, ...(kept.length ? [`Current values kept after source review: ${kept.join(", ")}. The updated source may differ from these fields.`] : [])];
  return next;
}
