"use client";
import { useEffect, useRef, useState } from "react";
import type { RfqLine } from "./draft";
import ImportReview from "./ImportReview";
import { readRequirements } from "./read-requirements";
import { parseSheet, validateSheetFile } from "./parse-sheet";
import { Icon } from "./Fields";
import SheetImport from "./SheetImport";
import styles from "./styles";

export default function ImportDialog({
  tab: initialTab,
  capacity,
  onClose,
  onAdd,
}: {
  tab: "text" | "sheet";
  capacity: number;
  onClose: () => void;
  onAdd: (_lines: RfqLine[]) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [tab, setTab] = useState(initialTab);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [review, setReview] = useState<RfqLine[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const reading = useRef(false);
  const progress = tab === "text" ? "Reading pasted requirements…" : "Reading spreadsheet…";
  const [useAI, setUseAI] = useState(false);
  const [aiDeclined, setAiDeclined] = useState(false);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  function chooseFile(next?: File) {
    setReview(null);
    setFile(null);
    setError("");
    if (!next) return;
    try {
      validateSheetFile(next);
      setFile(next);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Choose a valid sheet.");
    }
  }
  async function read(withAI: boolean) {
    if (tab === "text" && withAI && aiDeclined && !useAI) return;
    if (tab === "text") { setUseAI(withAI); setAiDeclined(!withAI); }
    if (reading.current) return;
    reading.current = true;
    setBusy(true);
    setError("");
    try {
      const lines = tab === "text" ? await readRequirements(text, withAI) : file ? parseSheet(await file.arrayBuffer(), file.name) : [];
      if (!lines.length) throw new Error("Choose a filled sheet before reading it.");
      if (lines.length > capacity) throw new Error(`You can add ${capacity} more lines. A draft can contain at most 200 fabrics.`);
      setReview(lines);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not read the lines. Please check your input.");
    } finally {
      reading.current = false;
      setBusy(false);
    }
  }
  return (
    <dialog
      ref={dialog}
      className={styles.dialog}
      aria-labelledby="rfq-import-title"
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose();
      }}
    >
      <div className={styles.dialogHeader}>
        <div>
          <h2 id="rfq-import-title">Add many lines at once</h2>
          <p>Paste your fabric list, or upload the Mylonex Excel template.</p>
        </div>
        <button type="button" className={styles.iconButton} aria-label="Close import dialog" disabled={busy} onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <div role="tablist" aria-label="Import method" className={styles.tabs}>
        {(["text", "sheet"] as const).map((value) => (
          <button
            key={value}
            id={`import-tab-${value}`}
            role="tab"
            aria-selected={tab === value}
            aria-controls="import-panel"
            tabIndex={tab === value ? 0 : -1}
            disabled={busy}
            type="button"
            onClick={() => {
              setTab(value);
              setReview(null);
              setError("");
            }}
            onKeyDown={(event) => {
              if (["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) {
                event.preventDefault();
                const next = event.key === "Home" ? "text" : event.key === "End" ? "sheet" : tab === "text" ? "sheet" : "text";
                setTab(next);
                setReview(null);
                setError("");
                document.getElementById(`import-tab-${next}`)?.focus();
              }
            }}
          >
            {value === "text" ? "Paste text" : "Excel sheet"}
          </button>
        ))}
      </div>
      <div className={styles.dialogBody} id="import-panel" role="tabpanel" aria-labelledby={`import-tab-${tab}`}>
        {error && (
          <p role="alert" className={styles.error}>
            {error}
          </p>
        )}
        {review ? (
          <section aria-label="Review imported lines">
            <h3>
              Review {review.length} draft {review.length === 1 ? "line" : "lines"}
            </h3>
            <p className={styles.hint}>
              These are editable drafts. Check missing fields and correct them in the builder before submitting.
            </p>
            <ImportReview lines={review} editable={tab === "text"} useAI={useAI} onChange={setReview} />
            {review.length > capacity && <p role="alert" className={styles.error}>Only {capacity} more draft lines fit. Merge or return to source.</p>}
            <button className={styles.secondary} type="button" onClick={() => setReview(null)}>
              Back to source
            </button>
          </section>
        ) : tab === "text" ? (
          <>
            <label className={styles.fieldLabel} htmlFor="fabric-list">
              Your fabric list
            </label>
            <textarea
              id="fabric-list"
              className={styles.pasteArea}
              rows={8}
              maxLength={32000}
              value={text}
              disabled={busy}
              onChange={(event) => setText(event.target.value)}
              placeholder={
                "100% Cotton, 2/1 twill, 120 gsm, 58 inches, RFD, 3000 m, ready stock\nBlend: 55/45 linen-cotton; plain, 140 gsm, 58 inches, RFD, 1500 m, made to order"
              }
            />
            <p className={styles.hint}>
              Describe fabrics naturally, across sentences or lines. Use “also need”, “another fabric”, or numbering for a new fabric.
              Include units where possible. Unknown values, ranges and grouping need review. Original text and source phrases are retained.
            </p>
            <p id="rfq-ai-disclosure" className={styles.hint}>Selecting “Read requirements with AI” sends the original text to OpenAI for complete field extraction and fabric grouping, then reconciles it with local textile parsing. “Read lines” uses local parsing only. AI failures are clearly labelled.</p>
            <label><input type="checkbox" checked={useAI} disabled={busy} onChange={event => {
              setUseAI(event.target.checked); setAiDeclined(!event.target.checked);
            }} /> Use AI to extract complete fabric requirements alongside local parsing. Selecting the AI read action also selects this consent; uncheck to decline.</label>
            {aiDeclined && <p role="status" className={styles.hint}>AI consent is declined. Select the AI checkbox to enable the AI action, or use local extraction.</p>}
          </>
        ) : (
          <SheetImport file={file} chooseFile={chooseFile} onError={setError} />
        )}
      </div>
      <footer className={styles.dialogFooter}>
        <p role="status" className="min-h-10">{busy ? progress : "Nothing is submitted while reading or adding drafts."}</p>
        <div style={{ flexWrap: "wrap" }}>
          <button type="button" className={styles.secondary} disabled={busy} onClick={onClose}>
            Cancel
          </button>
          {!review && tab === "text" && <button type="button" className={styles.secondary} disabled={busy || !text.trim()} onClick={() => void read(false)}>Read lines</button>}
          <button
            type="button"
            className={styles.primary}
            disabled={busy || (review ? review.length > capacity || !review.length : tab === "text" ? !text.trim() || aiDeclined && !useAI : !file)}
            aria-describedby={!review && tab === "text" ? "rfq-ai-disclosure" : undefined}
            onClick={() => (review ? onAdd(review) : void read(tab === "text"))}
          >
            {busy ? progress : review ? `Add ${review.length} draft lines` : tab === "text" ? "Read requirements with AI" : "Read sheet"}
          </button>
        </div>
      </footer>
    </dialog>
  );
}
