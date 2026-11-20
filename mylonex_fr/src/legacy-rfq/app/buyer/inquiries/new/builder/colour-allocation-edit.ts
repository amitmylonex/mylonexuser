import type { RfqLine } from "./draft";

const sum = (line: RfqLine) => line.colours.length && line.colours.every(c => c.name.trim() && Number(c.metres) > 0)
  ? line.colours.reduce((n, c) => n + Number(c.metres), 0) : undefined;
export function editColourAllocations(previous: RfqLine, updated: RfqLine): RfqLine {
  const calculated = previous.metadataNotes?.some(n => /^(?:Calculated total|Colour allocation subtotal)/.test(n))
    || previous.sourceEvidence?.some(e => e.field === "quantity" && /Calculated total/.test(e.reason || ""));
  if (!calculated || (previous.draft.quantity !== undefined && previous.draft.quantity !== sum(previous))) return updated;
  const value = sum(updated);
  const quantity = value && Number.isInteger(value) && value <= 2147483647 ? value : undefined;
  const note = quantity ? `Calculated total ${quantity} m from edited colour allocations.` : "Colour allocation subtotal needs completion before calculating a total.";
  return { ...updated, metadataNotes: [...(updated.metadataNotes || []).filter(n => !/^(?:Calculated total|Colour allocation subtotal)/.test(n)), note],
    draft: { ...updated.draft, quantity, additionalSpecs: [...(updated.draft.additionalSpecs || "").split("\n").filter(n => !/^(?:Calculated total|Colour allocation subtotal)/.test(n)), note].filter(Boolean).join("\n") } };
}
export function colourAllocationIssues(line: RfqLine): string[] {
  const total = sum(line);
  return line.plainTextSource && total && line.draft.quantity && total !== line.draft.quantity
    ? [`Colour allocations total ${total} m; entered total is ${line.draft.quantity} m. Confirm the conflicting quantities.`] : [];
}
