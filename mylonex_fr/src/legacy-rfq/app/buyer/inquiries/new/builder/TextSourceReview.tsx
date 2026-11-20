"use client";
import { useEffect, useRef, useState } from "react";
import type { RfqLine } from "./draft";
import { applySourceChanges, sourceChanges, sourceSelectionSignature, type SourceField } from "./source-review";
import { readRequirements } from "./read-requirements";
import styles from "./styles";
import css from "./source-review.module.css";
import TextCandidateReview from "./TextCandidateReview";

export default function TextSourceReview({ line, onChange }: { line: RfqLine; onChange: (_line: RfqLine) => void }) {
  const [editing, setEditing] = useState(false);
  const [source, setSource] = useState(line.original);
  const [proposal, setProposal] = useState<RfqLine | null>(null);
  const [selected, setSelected] = useState<Partial<Record<SourceField, string>>>({});
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [useAI, setUseAI] = useState(line.textExtractionMode === "ai-assisted");
  const [aiDeclined, setAiDeclined] = useState(line.textExtractionMode === "deterministic");
  const [busy, setBusy] = useState(false);
  const requestId = useRef(0);
  useEffect(() => () => { requestId.current++; }, []);
  const changes = proposal ? sourceChanges(line, proposal) : [];
  // Any field edited after selection is kept until explicitly selected again.
  const accepted = changes.filter(change => selected[change.key] === sourceSelectionSignature(line, change.key)).map(change => change.key);
  function close() { requestId.current++; setBusy(false); setEditing(false); setProposal(null); setSelected({}); setError(""); }
  async function read(withAI: boolean) {
    if (withAI && aiDeclined && !useAI) return;
    setUseAI(withAI); setAiDeclined(!withAI);
    const ticket = ++requestId.current; setBusy(true); setError(""); setProposal(null);
    try {
      const lines = await readRequirements(source, withAI);
      if (ticket !== requestId.current) return;
      if (lines.length !== 1) throw new Error("This source describes several fabrics. Import them as separate lines instead of replacing this draft.");
      setProposal(lines[0]); setSelected({});
    } catch (error) { if (ticket === requestId.current) setError(error instanceof Error ? error.message : "Could not re-read this line."); }
    finally { if (ticket === requestId.current) setBusy(false); }
  }
  return <section className={css.sourceReview} aria-label="Pasted source text">
    <div className={css.heading}>
      <strong>{editing ? "Current source text" : "Source text"}</strong>
      {!editing && <button type="button" className={styles.textButton} onClick={() => {
        setSource(line.original); setConfirmed(false); setEditing(true);
      }}>Edit source text</button>}
    </div>
    <p className={css.source}>{line.original}</p>
    {confirmed && <p role="status">Source updated. Only the changes you selected were applied.</p>}
    {editing && <>
      <label className={css.editorLabel} htmlFor={`edit-source-${line.id}`}>Updated source text</label>
      <textarea id={`edit-source-${line.id}`} rows={5} maxLength={32000} disabled={busy} value={source} onChange={event => {
        setSource(event.target.value); setProposal(null); setSelected({}); setError("");
      }} />
      <p className={css.help}>Re-read this fabric only, then choose which changes to apply. Your current fields are kept until you confirm.</p>
      <p className={css.help}>“Re-read this line with AI” sends the updated source to OpenAI and reconciles its complete extraction with local parsing. “Re-read this line” uses local parsing only.</p>
      <label><input type="checkbox" checked={useAI} disabled={busy} onChange={event => {
        setUseAI(event.target.checked); setAiDeclined(!event.target.checked);
      }} /> Use AI for this re-extraction alongside local parsing. Selecting the AI action also selects this consent; uncheck to decline.</label>
      {aiDeclined && <p role="status" className={css.help}>Local extraction is selected. Select the AI checkbox to enable AI re-reading.</p>}
      {error && <p role="alert" className={styles.errorText}>{error}</p>}
      <div className={css.actions}>
        <button type="button" className={styles.primary} disabled={busy || !source.trim() || aiDeclined && !useAI} onClick={() => void read(true)}>Re-read this line with AI</button>
        <button type="button" className={styles.secondary} disabled={busy || !source.trim()} onClick={() => void read(false)}>{busy ? "Re-reading…" : "Re-read this line"}</button>
        <button type="button" className={styles.textButton} onClick={close}>Cancel source changes</button>
      </div>
      {proposal && <section className={css.proposals} aria-label="Proposed source changes">
        <h4>Review proposed changes</h4>
        <p role="status">{proposal.warnings[0] || (proposal.textExtractionMode === "ai-assisted" ? "AI extraction used." : "Local extraction used.")}</p>
        <TextCandidateReview line={proposal} />
        <p className={css.help}>Select a change to replace its current value. Unselected values, including your edits, are kept. Fields edited during this review need selecting again.</p>
        {changes.length ? <div className={css.tableWrap}><table>
          <thead><tr><th scope="col">Apply</th><th scope="col">Field</th><th scope="col">Current</th><th scope="col">Proposed</th></tr></thead>
          <tbody>{changes.map(change => <tr key={change.key}>
            <td><input type="checkbox" aria-label={`Apply ${change.label}`} checked={accepted.includes(change.key)} onChange={event => {
              setSelected(previous => ({ ...previous, [change.key]: event.target.checked ? sourceSelectionSignature(line, change.key) : undefined }));
            }} /></td>
            <th scope="row">{change.label}</th><td>{change.current}</td><td>{change.proposed}</td>
          </tr>)}</tbody>
        </table></div> : <p>No field changes found. You can still confirm the updated source text.</p>}
        {!!proposal.warnings.length && <details><summary>Review notes from re-reading</summary><ul>{proposal.warnings.map((warning, index) => <li key={index}>{warning}</li>)}</ul></details>}
        <button type="button" className={styles.primary} onClick={() => {
          onChange(applySourceChanges(line, proposal, accepted)); close(); setConfirmed(true);
        }}>Confirm updated draft</button>
      </section>}
    </>}
  </section>;
}
