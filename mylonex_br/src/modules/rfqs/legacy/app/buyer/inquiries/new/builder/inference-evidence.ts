import type { RfqLine } from "./draft.js";

export function submissionEvidence(line: RfqLine) {
  return line.sourceEvidence?.map(item => ({ ...item,
    ...(item.kind === "inferred" && (item.field === "gsm" || item.field === "quantity")
      ? { applied: line.draft[item.field] === item.value } : {}),
  }));
}
export function inferenceNotes(line: RfqLine) {
  const status = (field: string, applied?: boolean) => {
    if (applied !== false) return "";
    return (field === "gsm" || field === "quantity") && line.draft[field] === undefined
      ? " (awaiting buyer confirmation)" : " (buyer edited the value)";
  };
  return (submissionEvidence(line) ?? []).filter(item => item.kind === "inferred" || item.kind === "unresolved").map(item =>
    `${item.kind === "inferred" ? `Originally inferred ${item.field}${status(item.field, item.applied)}` : `Unresolved ${item.field} candidate`}: ${item.text}${item.unit ? ` [${item.unit}]` : ""}. ${item.reason || "Review the source."}`);
}
export function gsmInferenceHint(line: RfqLine) {
  const item = line.sourceEvidence?.find(value => value.field === "gsm" && value.kind === "inferred");
  if (!item) return "Mills price by weight.";
  if (line.draft.gsm === undefined) return `Proposed ${item.value} GSM from context. Confirm by entering a value.`;
  return line.draft.gsm === item.value ? `Inferred ${item.value} GSM from context. Review or edit.` : `Initially inferred ${item.value} GSM; the current value was edited.`;
}
