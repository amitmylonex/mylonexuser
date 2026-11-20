"use client";
import { useEffect, useRef, useState } from "react";
import { lineTitle, type RfqLine } from "./draft";
import { parsePlainDescription as parseDescription, reviewMessage } from "./parse-text";
import styles from "./styles";
import { readRequirements } from "./read-requirements";
import TextCandidateReview from "./TextCandidateReview";

export default function ImportReview({ lines, onChange, editable, useAI = false }: { lines: RfqLine[]; onChange: (_lines: RfqLine[]) => void; editable: boolean; useAI?: boolean }) {
  const latest = useRef(lines); latest.current = lines;
  return <ol className={styles.importReview}>{lines.map((line, index) => {
    const updateLine = (updated: RfqLine) => onChange(lines.map(item => item.id === line.id ? updated : item));

    return <li key={line.id}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "8px", flexWrap: "wrap" }}>
        <strong>{String(index + 1).padStart(2, "0")} · {lineTitle(line)}</strong>
        <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "#a33d25" }}>{reviewMessage(line)}</span>
      </div>

      {editable && <p className={styles.hint}>Count: {line.count || "Not extracted"} · Construction: {line.construction || "Not extracted"}</p>}
      {line.gsmMin && line.gsmMax && line.gsmMin !== line.gsmMax && (
        <small style={{ color: "#2563eb", fontWeight: 500 }}>
          GSM: Range {line.gsmMin}–{line.gsmMax} g/m² detected
        </small>
      )}
      {line.gsmBound && !line.draft.gsm && (
        <small style={{ color: "#2563eb", fontWeight: 500 }}>
          GSM: {line.gsmBound.label} {line.gsmBound.value} g/m² detected
        </small>
      )}
      {line.gsmQualifier && !line.gsmMin && !line.gsmBound && !line.draft.gsm && (
        <small style={{ color: "#2563eb", fontWeight: 500 }}>
          GSM: {line.gsmQualifier} detected
        </small>
      )}
      {line.quantityBound && (
        <small style={{ color: "#2563eb", fontWeight: 500 }}>
          Quantity: {line.quantityBound.label} {line.quantityBound.value.toLocaleString()} m detected
        </small>
      )}
      {line.warnings
        .filter(w =>
          !w.startsWith("OPTION alternatives") &&
          !w.startsWith("Width stated as") &&
          !w.includes("needs review; ranges, tolerances and conflicting values were retained in notes") &&
          !w.includes("is a bound, not an exact order quantity")
        )
        .map((warning, i) => <small key={i}>{warning}</small>)}
      {editable && <TextCandidateReview line={line} onChange={updateLine} />}
      {editable && <>
        <SourceEditor line={line} useAI={useAI} onApply={replacements => {
          const current = latest.current, position = current.findIndex(item => item.id === line.id);
          if (position >= 0) onChange([...current.slice(0, position), ...replacements, ...current.slice(position + 1)]);
        }} />
        {line.textExtractionMode !== "ai-assisted" && index < lines.length - 1 && <button type="button" className={styles.textButton} onClick={() => onChange([
          ...lines.slice(0, index), parseDescription(`${line.original}\n${lines[index + 1].original}`), ...lines.slice(index + 2),
        ])}>Merge draft {index + 1} with next</button>}
      </>}
    </li>;
  })}</ol>;
}
function SourceEditor({ line, onApply, useAI }: { line: RfqLine; onApply: (_lines: RfqLine[]) => void; useAI: boolean }) {
  const [source, setSource] = useState(line.original);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);
  const parts = source.split(/^\s*---\s*$/m).filter(value => value.trim());
  return <details><summary>Edit source / split this draft</summary>
    <label htmlFor={`source-${line.id}`}>Source for this draft</label>
    <textarea id={`source-${line.id}`} className={styles.pasteArea} rows={4} disabled={busy} value={source} maxLength={32000} onChange={event => setSource(event.target.value)} />
    <p className={styles.hint}>Keep one fabric together. Insert --- on its own line to split fabrics. Applying replaces only this import preview; existing builder edits are untouched.</p>
    <p className={styles.hint}>{useAI ? "AI extraction is selected; applying sends the edited source to OpenAI again." : "Applying uses local extraction."}</p>
    {error && <p role="alert">{error}</p>}
    <button type="button" className={styles.secondary} disabled={busy || !parts.length || parts.length > 200} onClick={async () => {
      const ticket = ++request.current; setBusy(true); setError("");
      try {
        const replacements = (await Promise.all(parts.map(part => readRequirements(part, useAI)))).flat();
        if (ticket === request.current) onApply(replacements);
      } catch (error) { if (ticket === request.current) setError(error instanceof Error ? error.message : "Could not re-read the edited source."); }
      finally { if (ticket === request.current) setBusy(false); }
    }}>{busy ? "Re-reading…" : "Apply source / split"}</button>
  </details>;
}
