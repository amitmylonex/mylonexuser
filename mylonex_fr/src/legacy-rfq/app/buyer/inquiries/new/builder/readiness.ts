import type { RfqLine } from "./draft";
import { blendState } from "./blend-state";
import { validateAlternatives } from "../../../../../src/domains/rfq/text/alternatives";
import { isValidWidth } from "../../../../../src/domains/rfq/text/width-bounds";
import { referenceReviewIssues } from "./reference-review";

export type LineReadiness = {
  missing: string[];
  pendingWidth?: { statedValue: number | string; basis: string };
  conflicts: string[];
  summary: string;
};

export function assessLineReadiness(line: RfqLine): LineReadiness {
  const d = line.draft;
  const isWidthConfirmed = isValidWidth(d.width);

  let blendComplete = blendState(line).state === "complete";
  if (line.sourcingAlternatives?.length) {
    const val = validateAlternatives(line.sourcingAlternatives);
    blendComplete = val.state === "complete";
  }

  const missing: string[] = [];
  const confirmations: string[] = [];
  if (!blendComplete) {
    missing.push("blend");
  }
  const isGsmRangeCaptured = !!(line.gsmMin && line.gsmMax && line.gsmMin !== line.gsmMax);
  if (!(d.gsm && d.gsm > 0)) {
    if (isGsmRangeCaptured) {
      confirmations.push(`Confirm target GSM (range ${line.gsmMin}–${line.gsmMax} g/m² captured)`);
    } else if (line.gsmBound) {
      confirmations.push(`Confirm target GSM (${line.gsmBound.label.toLowerCase()} ${line.gsmBound.value} g/m² captured)`);
    } else if (line.gsmQualifier) {
      confirmations.push(`Confirm target GSM (${line.gsmQualifier.toLowerCase()} captured)`);
    } else {
      missing.push("GSM");
    }
  }
  if (!d.weaveType) missing.push("weave");
  if (!isWidthConfirmed) missing.push("width");
  if (!d.fabricState) missing.push("fabric state");
  if (!(d.quantity && d.quantity > 0)) {
    if (line.quantityBound) {
      confirmations.push(`Confirm exact booking quantity (${line.quantityBound.label.toLowerCase()} ${line.quantityBound.value.toLocaleString()} m captured)`);
    } else {
      missing.push("quantity");
    }
  }
  if (!d.productionCycle) missing.push("production cycle");

  const conflicts: string[] = [];
  for (const item of line.warnings) {
    if (/conflict|ambiguous/i.test(item)) conflicts.push(item);
  }

  const parts: string[] = [];
  if (missing.length) {
    parts.push(`Add ${missing.join(", ")}`);
  }
  if (confirmations.length) {
    parts.push(...confirmations);
  }
  if (referenceReviewIssues(line).length) parts.push("Confirm ambiguous colour or finish references");

  const summary = parts.length ? parts.join(" · ") : "Seven details found — review before sending";
  return { missing, pendingWidth: undefined, conflicts, summary };
}
