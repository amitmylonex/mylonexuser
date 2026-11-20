import { builderFetch } from '../../../../../adapters/http'
"use client";
import { useEffect, useRef, useState } from "react";
import { imageExtractionSchema } from "../../../../../src/domains/rfq/image/schema";
import { transcriptSchema } from "../../../../../src/domains/rfq/voice/schema";
import { type RfqLine, lineTitle } from "./draft";
import { reviewMessage } from "./parse-text";
import { voiceLines } from "./voice-lines";
import { useVoiceRecorder } from "./useVoiceRecorder";
import styles from "./styles";

export default function VoiceDialog({ open, capacity, alreadyAdded, onClose, onAdd }: {
  open: boolean; capacity: number; alreadyAdded: (_id: string) => boolean;
  onClose: () => void; onAdd: (_lines: RfqLine[]) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [transcript, setTranscript] = useState("");
  const [sourceId, setSourceId] = useState(() => crypto.randomUUID());
  const [consent, setConsent] = useState(false);
  const [review, setReview] = useState<RfqLine[]>([]);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const active = useRef<AbortController | null>(null);
  const added = useRef(new Set<string>());
  const audio = useVoiceRecorder(() => { setSourceId(crypto.randomUUID()); setTranscript(""); setReview([]); setError(""); setStatus(""); });
  function close() { active.current?.abort(); active.current = null; audio.cancel(); setBusy(false); onClose(); }
  useEffect(() => {
    if (open) dialog.current?.showModal();
    else dialog.current?.close();
  }, [open]);
  useEffect(() => () => { active.current?.abort(); }, []);
  async function process(kind: "audio" | "text") {
    if (active.current || !consent) return;
    const controller = new AbortController();
    active.current = controller;
    const timer = setTimeout(() => controller.abort(), 60_000);
    setBusy(true); setError(""); setReview([]); setStatus(kind === "audio" ? "Transcribing audio…" : "Extracting draft lines…");
    try {
      let body: FormData | string;
      if (kind === "audio") {
        if (!audio.audio) throw new Error("Record a requirement first, or type it below.");
        body = new FormData();
        body.append("audio", audio.audio, audio.audio.type.startsWith("audio/webm") ? "requirement.webm" : "requirement.mp4");
        body.append("consent", "openai-voice-extraction");
      } else body = JSON.stringify({ transcript, consent: "openai-voice-extraction" });
      const response = await builderFetch("/api/buyer/inquiries/voice", {
        method: "POST", body, signal: controller.signal,
        ...(kind === "text" ? { headers: { "Content-Type": "application/json" } } : {}),
      });
      const json = await response.json();
      if (active.current !== controller) return;
      if (!response.ok || !json.ok) throw new Error(json.error?.message || "Processing failed. Retry or type below.");
      if (kind === "audio") {
        setTranscript(transcriptSchema.parse(json.data.transcript));
        setStatus("Transcript ready. Check and edit it, then extract draft lines.");
      } else {
        const data = imageExtractionSchema.parse(json.data);
        const lines = voiceLines(data, transcript, sourceId);
        if (!lines.length) throw new Error(data.warnings.join(" ") || "No clear fabric requirements found. Edit the transcript with explicit fabric details and units.");
        if (lines.length > capacity) throw new Error(`Only ${capacity} more lines fit. Split the requirement or remove existing lines.`);
        setReview(lines); setStatus("Drafts ready for review. Nothing has been submitted.");
      }
    } catch (caught) {
      if (active.current === controller) {
        setError(controller.signal.aborted ? "Processing timed out. Retry; your transcript is retained." : caught instanceof Error ? caught.message : "Processing failed. Retry or type below.");
        setStatus("");
      }
    } finally {
      clearTimeout(timer);
      if (active.current === controller) { active.current = null; setBusy(false); }
    }
  }
  const duplicate = alreadyAdded(sourceId) || added.current.has(sourceId);
  return (
    <dialog ref={dialog} className={styles.dialog} aria-labelledby="voice-title" onCancel={event => { event.preventDefault(); close(); }}>
      <div className={styles.dialogHeader}>
        <div><h2 id="voice-title">Speak requirement</h2><p>Speak clearly and include units where possible. Review the draft before sending.</p></div>
        <button className={styles.secondary} type="button" onClick={close} aria-label="Close voice input">Close</button>
      </div>
      <div className={styles.dialogBody}>
        <p className={styles.hint}>English, Hindi, or mixed English/Hindi. Up to 2 minutes / 10 MB. Check textile terms and numbers carefully.</p>
        <label><input type="checkbox" checked={consent} disabled={busy || audio.recording || audio.starting} onChange={event => setConsent(event.target.checked)} /> Allow sending this recording and transcript to OpenAI for processing.</label>
        <div className={styles.topActions} style={{ justifyContent: "start", marginBlock: 12 }}>
          <button className={styles.secondary} type="button" disabled={!consent || busy || audio.starting || !audio.supported} onClick={() => audio.recording ? audio.stop() : void audio.start()}>
            {audio.starting ? "Opening microphone…" : audio.recording ? "Stop recording" : "Start recording"}
          </button>
          <button className={styles.secondary} type="button" disabled={!consent || busy || audio.recording || audio.starting || !audio.audio || duplicate} onClick={() => void process("audio")}>Transcribe recording</button>
        </div>
        {!audio.supported && <p className={styles.hint}>Recording is unavailable in this browser. Type your requirement below or use Paste lines.</p>}
        <p role="status" className="min-h-10">{audio.recording ? "Recording… Stop when finished (automatically stops at 2 minutes)." : status || (audio.audio ? "Recording ready. Choose Transcribe recording." : "")}</p>
        {(error || audio.error) && <p role="alert" className={styles.error}>{error || audio.error}</p>}
        <label className={styles.fieldLabel} htmlFor="voice-transcript">Transcript / typed requirement</label>
        <textarea id="voice-transcript" className={styles.pasteArea} rows={6} maxLength={16000} value={transcript} disabled={busy || audio.recording || audio.starting || duplicate}
          onChange={event => { setTranscript(event.target.value); setReview([]); setError(""); audio.clearError(); setStatus(""); }} />
        <p className={styles.hint}>Correct unclear words or numbers here. Unknown specifications stay blank. The transcript is retained with added drafts in this browser.</p>
        <button className={styles.secondary} type="button" disabled={!consent || busy || audio.recording || audio.starting || !transcript.trim() || duplicate} onClick={() => void process("text")}>Extract draft lines</button>
        {duplicate && <p role="status">This recording has already been added. Edit its lines in the builder, or start a new recording.</p>}
        {duplicate && <button className={styles.secondary} type="button" onClick={() => {
          audio.clear(); setSourceId(crypto.randomUUID()); setTranscript(""); setReview([]); setStatus(""); setError("");
        }}>New requirement</button>}
        {!!review.length && <ol className={styles.importReview} aria-label="Voice draft review">{review.map(line => <li key={line.id}>
          <strong>{lineTitle(line)}</strong><span>{reviewMessage(line)}</span>{line.warnings.map((warning, index) => <small key={index}>{warning}</small>)}
        </li>)}</ol>}
      </div>
      <footer className={styles.dialogFooter}>
        <p>Review, edit or remove each line in the RFQ builder. Nothing is sent automatically.</p>
        <button className={styles.primary} type="button" disabled={busy || !review.length || duplicate || review.length > capacity} onClick={() => {
          if (added.current.has(sourceId) || alreadyAdded(sourceId)) return;
          added.current.add(sourceId); onAdd(review); setReview([]); close();
        }}>Add {review.length || ""} draft lines</button>
      </footer>
    </dialog>
  );
}
