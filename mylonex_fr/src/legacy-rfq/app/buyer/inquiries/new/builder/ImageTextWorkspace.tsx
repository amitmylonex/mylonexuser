"use client";
import { useEffect, useRef, useState } from "react";
import Image from "../../../../../adapters/SiteImage";
import { useImageExtraction } from "../../../../../src/components/rfq/image-import/useImageExtraction";
import { imageTextLine } from "./image-text-line";
import type { RfqLine } from "./draft";
import styles from "./styles";
import css from "./image-text.module.css";

export default function ImageTextWorkspace({ disabled, capacity, onAdd, onBack }: {
  disabled: boolean; capacity: number; onAdd: (_line: RfqLine) => void; onBack: () => void;
}) {
  const extraction = useImageExtraction("/api/buyer/inquiries/extract-image", true);
  const [text, setText] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const applying = useRef(false);
  useEffect(() => { setText(extraction.analysis?.rawText ?? ""); }, [extraction.analysis]);
  function useText() {
    if (disabled || extraction.busy || !capacity || applying.current) return;
    try {
      const line = imageTextLine(text);
      applying.current = true;
      onAdd(line);
    } catch {
      setError("Enter a written requirement of up to 16,000 characters before using it in your RFQ.");
    }
  }
  return <section className={css.workspace} aria-label="Review writing for RFQ">
    <header><h2>Upload a written requirement</h2><p>Choose one JPG, PNG or WebP, up to 5 MB and 16 megapixels. Only written details are read.</p></header>
    <label className={styles.field}>Requirement image
      <input type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={event => {
        setText(""); setError(""); setConsent(false);
        void extraction.select(event.target.files?.[0] ?? null); event.target.value = "";
      }} />
    </label>
    {(extraction.error || error) && <p className={styles.error} role="alert">{extraction.error || error}</p>}
    <div className={css.review}>
      {extraction.preview && <Image className={css.preview} unoptimized src={extraction.preview} width={600} height={700} alt="Written requirement for review" />}
      <div className={css.text}>
        {extraction.file && !extraction.analysis && <>
          <label className={css.consent}><input type="checkbox" checked={consent} disabled={disabled || extraction.busy} onChange={event => setConsent(event.target.checked)} />
            Send this image to OpenAI to read its writing. MyloNex does not store or attach the image.</label>
          <button className={styles.primary} type="button" disabled={!consent || disabled || extraction.busy} onClick={() => void extraction.extract()}>{extraction.busy ? "Reading image…" : "Extract details"}</button>
          <p role="status" className="min-h-6">{extraction.busy ? "Reading image…" : ""}</p>
          {extraction.busy && <button className={styles.secondary} type="button" onClick={extraction.cancel}>Cancel extraction</button>}
        </>}
        {extraction.analysis && <>
          <label className={styles.field} htmlFor="image-requirement-text">Extracted requirement text</label>
          <textarea id="image-requirement-text" className={styles.pasteArea} rows={12} maxLength={16000} value={text} disabled={disabled}
            onChange={event => { setText(event.target.value); setError(""); }} />
          <p className={styles.hint}>Check and correct the text. Mark unclear words with [unclear], or remove them.</p>
          {!!extraction.analysis.warnings.length && <p className={styles.hint} role="status">Some handwriting needs review. Check it against the image.</p>}
          {!extraction.analysis.rawText.trim() && <p role="status">No readable writing found. Type the requirement here or choose a clearer image.</p>}
          <p className={styles.hint}>Adds one new fabric line. Existing lines stay unchanged. Complete missing details in the RFQ builder before sending.</p>
          {capacity < 1 && <p role="alert" className={styles.error}>Your RFQ has 200 lines. Remove a line before adding this requirement.</p>}
          <button className={styles.primary} type="button" disabled={!text.trim() || disabled || extraction.busy || capacity < 1} onClick={useText}>Use in RFQ</button>
        </>}
      </div>
    </div>
    <button type="button" className={styles.secondary} onClick={onBack}>Back to RFQ lines</button>
  </section>;
}
