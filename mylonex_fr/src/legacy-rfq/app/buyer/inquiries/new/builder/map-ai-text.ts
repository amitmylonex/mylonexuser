import type { AiFabric } from "../../../../../src/domains/rfq/text/ai-schema";
import { sourceSpan, metres, emptyFields } from "../../../../../src/domains/rfq/text/ai-grounding";
import { extractPlainColours } from "../../../../../src/domains/rfq/text/plain-colours";
import { extractPlainQuantities } from "../../../../../src/domains/rfq/text/plain-quantities";
import { newLine, type RfqLine } from "./draft";
import { initializeBlend } from "./blend-state";

/** Map validated proposals directly, without a local whole-requirement pass. */
export function mapAiFabric(fabric: AiFabric): RfqLine {
  const line = newLine();
  line.original = fabric.source; line.plainTextSource = true; line.textExtractionMode = "ai-assisted";
  line.sourceEvidence = [];
  const invalidSplits = new Set<string>();
  const detail = [
    ...fabric.alternatives.map(alternative => `Sourcing alternative (not selected): ${alternative}`),
    ...fabric.yarns.map(yarn => `${yarn.direction === "warp" ? "Warp" : "Weft"} yarn source: ${yarn.source}`),
    ...fabric.issues.map(item => `Review ${item.field || "requirement"}: ${item.source}. ${item.message}`),
  ];
  for (const item of fabric.fields) {
    if (item.field === "blend") line.blend = item.value;
    else if (item.field === "count" || item.field === "construction" || item.field === "finish") line[item.field] = item.value;
    else if (item.field === "gsm" || item.field === "targetPriceMax") line.draft[item.field] = Number(item.value);
    else if (item.field === "quantity") line.draft.quantity = metres(item.value);
    else if (item.field === "perColourQuantity") detail.push(`Per-colour quantity: ${item.value}`);
    else if (item.field === "colour") {
      const found = emptyFields(); extractPlainColours(item.sourcePhrases.join("\n"), found);
      extractPlainQuantities(item.sourcePhrases.join("\n"), found);
      const invalid = found.warnings.some(warning => /whole metres|conflicting|tolerances/i.test(warning));
      if (invalid) invalidSplits.add(item.value);
      const amount = invalid ? "" : found.colours.find(colour => colour.name.toLowerCase() === item.value.toLowerCase())?.metres || "";
      detail.push(...found.warnings);
      line.colours.push({ id: crypto.randomUUID(), name: item.value, metres: amount });
    } else Object.assign(line.draft, { [item.field]: item.value });
    for (const phrase of item.sourcePhrases) line.sourceEvidence.push({ field: item.field === "weaveType" ? "weave" : item.field === "perColourQuantity" ? "per-colour quantity" : item.field,
      text: phrase, ...sourceSpan(fabric.source, phrase), kind: "explicit", applied: true });
  }
  const perColour = fabric.fields.find(item => item.field === "perColourQuantity");
  if (perColour) for (const colour of line.colours) {
    const common = metres(perColour.value);
    if (!colour.metres && !invalidSplits.has(colour.name)) colour.metres = String(common || "");
    else if (colour.metres && Number(colour.metres) !== common) detail.push(`Conflicting per-colour amount for ${colour.name}: explicit ${colour.metres} m versus common ${common} m. Confirm both source values.`);
  }
  if (line.draft.quantity && line.colours.length && line.colours.every(colour => colour.metres)) {
    const total = line.colours.reduce((sum, colour) => sum + Number(colour.metres), 0);
    if (total !== line.draft.quantity) detail.push(`Quantity mismatch: colour quantities total ${total} m; explicit total ${line.draft.quantity} m was preserved.`);
  }
  line.warnings = ["AI extraction used. Review the extracted fields and source phrases before sending.", ...fabric.issues.map(item => item.message), ...detail.filter(item => /mismatch|whole metres|conflicting|tolerances/i.test(item))];
  line.draft.additionalSpecs = detail.join("\n") || undefined;
  return initializeBlend(line);
}
