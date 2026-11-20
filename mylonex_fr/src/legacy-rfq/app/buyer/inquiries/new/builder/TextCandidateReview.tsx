"use client";
import { useState } from "react";
import type { TextCandidate } from "../../../../../src/domains/rfq/text/proposals";
import { equivalentCandidate } from "./text-candidates";
import { initializeBlend } from "./blend-state";
import { SOURCE_FIELDS } from "./source-review";
import type { RfqLine } from "./draft";
import { BUYER_FABRIC_STATES } from "../../../../../src/domains/rfq/constants";
import styles from "./styles";
import css from "./source-review.module.css";

const label = (field: TextCandidate["field"]) => field in SOURCE_FIELDS ? SOURCE_FIELDS[field as keyof typeof SOURCE_FIELDS] : field === "colour" ? "Colour" : "Per-colour quantity";
function currentValue(line: RfqLine, candidate: TextCandidate) {
  return candidate.field in line ? line[candidate.field as "blend" | "count" | "construction" | "finish"] : line.draft[candidate.field as keyof typeof line.draft];
}
export function confirmTextCandidate(line: RfqLine, candidate: TextCandidate): RfqLine {
  if (candidate.status === "unsupported" || candidate.field === "colour" || candidate.field === "perColourQuantity" || candidate.field === "quantity" && candidate.qualifier || candidate.sourcePhrases.some(phrase => !line.original.includes(phrase))) return line;
  if (candidate.field === "fabricState" && !BUYER_FABRIC_STATES.some(state => state === candidate.value)) return line;
  const next = { ...line, draft: { ...line.draft } };
  if (candidate.field === "fabricState") next.fabricStateInferred = false;
  if (["blend", "count", "construction", "finish"].includes(candidate.field)) Object.assign(next, { [candidate.field]: candidate.value });
  else Object.assign(next.draft, { [candidate.field]: ["quantity", "gsm", "targetPriceMax"].includes(candidate.field) ? Number(candidate.value.replace(/ m$/, "")) : candidate.value });
  next.textCandidates = line.textCandidates?.map(item => item.field === candidate.field && equivalentCandidate(item.field, item.value) === equivalentCandidate(candidate.field, candidate.value) ? { ...item, confirmed: true, status: "accepted" } : item);
  const note = `Buyer confirmed ${label(candidate.field)} proposal: ${candidate.value}${candidate.qualifier ? ` (${candidate.qualifier})` : ""}.`;
  next.draft.additionalSpecs = [next.draft.additionalSpecs, note].filter(Boolean).join("\n");
  if (candidate.field === "fabricState" && candidate.kind === "inferred") return next;
  const field = candidate.field === "weaveType" ? "weave" : candidate.field;
  next.sourceEvidence = [...(line.sourceEvidence || []).filter(item => !(item.field === field && candidate.sourcePhrases.includes(item.text))), ...candidate.sourcePhrases.map(text => ({ field, text,
    start: line.original.indexOf(text), end: line.original.indexOf(text) + text.length, kind: "explicit" as const, unit: candidate.unit, applied: true, reason: note }))];
  return initializeBlend(next);
}
export default function TextCandidateReview({ line, onChange }: { line: RfqLine; onChange?: (_line: RfqLine) => void }) {
  const [pending, setPending] = useState<{ candidate: TextCandidate; previous: string; source: string } | null>(null);
  const candidates = line.textCandidates || [];
  if (!candidates.length) return null;
  const groups = new Map<string, TextCandidate[]>();
  for (const candidate of candidates) {
    const key = `${candidate.field}:${equivalentCandidate(candidate.field, candidate.value)}:${candidate.qualifier || ""}`;
    groups.set(key, [...(groups.get(key) || []), candidate]);
  }
  const stale = pending && (pending.source !== line.original || pending.previous !== JSON.stringify(currentValue(line, pending.candidate) ?? ""));
  return <details className={css.candidates}><summary>Extraction candidates and sources</summary>
    <p>Local and AI results describe the same fabric. Agreement supports a proposal; source wording and field rules still govern it.</p>
    <ul className={css.candidateList}>{[...groups.entries()].map(([key, items]) => {
      const candidate = items[0], review = items.find(item => item.status === "review");
      return <li key={key}>
        <strong>{label(candidate.field)}: {candidate.value}{candidate.qualifier ? ` · ${candidate.qualifier}` : ""}</strong>
        <p>{[...new Set(items.map(item => item.origin === "ai" ? "AI" : "Local"))].join(" + ")} · {[...new Set(items.map(item => item.kind))].join(" / ")} · {items.some(item => item.confirmed) ? "Buyer confirmed" : items.some(item => item.status === "accepted") ? "Reconciled proposal" : review ? "Needs confirmation" : "Unsupported"}</p>
        {items.filter(item => item.reportedKind && item.reportedKind !== item.kind).map((item, index) => <p key={index}>AI reported {item.reportedKind}; source validation classified this as {item.kind}.</p>)}
        {candidate.reason && <p>{candidate.reason}</p>}
        {[...new Set(items.flatMap(item => item.sourcePhrases))].map(phrase => <p key={phrase} className={css.source}>Source: {phrase}</p>)}
        {onChange && review && !(candidate.field === "quantity" && candidate.qualifier) && !items.some(item => item.confirmed) && !["colour", "perColourQuantity"].includes(candidate.field) && <button type="button" className={styles.secondary} onClick={() => setPending({ candidate: review, previous: JSON.stringify(currentValue(line, review) ?? ""), source: line.original })}>{candidate.field === "width" && candidate.qualifier ? "Review as cuttable width" : `Review ${label(candidate.field)} proposal`}</button>}
      </li>;
    })}</ul>
    {pending && <section aria-label="Confirm extraction proposal" className={css.proposals}>
      <p>Current {label(pending.candidate.field)}: {String(currentValue(line, pending.candidate) || "Not entered")}</p>
      <p>Proposed: {pending.candidate.value}{pending.candidate.qualifier ? ` (${pending.candidate.qualifier})` : ""}</p>
      {pending.candidate.qualifier && <p>Confirm that this stated greige width can be used as the required finished/cuttable width.</p>}
      {stale && <p role="alert">This field changed during review. Cancel and review the proposal again to replace it.</p>}
      <button type="button" className={styles.primary} disabled={!!stale} onClick={() => { onChange?.(confirmTextCandidate(line, pending.candidate)); setPending(null); }}>Confirm field change</button>
      <button type="button" className={styles.textButton} onClick={() => setPending(null)}>Keep current field</button>
    </section>}
  </details>;
}
