"use client";
import { useState } from "react";
import { batchSubmissionSchema } from "../../../../../src/domains/rfq/batch/schema";
import { buildBatch, duplicateLine, newLine, type RfqLine } from "./draft";
import { useBuilder } from "./useBuilder";
import LineCard from "./LineCard";
import Summary from "./Summary";
import Destination from "./Destination";
import ImportDialog from "./ImportDialog";
import VoiceDialog from "./VoiceDialog";
import ImageTextWorkspace from "./ImageTextWorkspace";
import { hasVoiceSource } from "./voice-lines";
import { Icon } from "./Fields";
import BuilderHeader from "./BuilderHeader";
import { blendState, initializeBlend } from "./blend-state";
import styles from "./styles";

const VALIDATION_KEY = "00000000-0000-4000-8000-000000000001";
export default function Builder({ buyerId }: { buyerId: string }) {
  const [chatRequirement, setChatRequirement] = useState(() => {
    try { return sessionStorage.getItem('mylonex-chat-rfq:' + buyerId) || ''; } catch { return ''; }
  });
  const [imageMode, setImageMode] = useState(false);
  const onBuilderMode = () => setImageMode(false);
  const builder = useBuilder(buyerId);
  const [expanded, setExpanded] = useState<string | null | undefined>(undefined);
  const [importTab, setImportTab] = useState<"text" | "sheet" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const { lines, destination, locked } = builder;
  const openId = expanded === undefined ? lines[0]?.id : expanded;
  const canSubmit =
    lines.every((line) => blendState(line).state === "complete") &&
    batchSubmissionSchema.safeParse(buildBatch(lines, destination, VALIDATION_KEY)).success &&
    !uploading &&
    !builder.storageError;
  const unchangedFirst = lines.length === 1 && JSON.stringify({ ...lines[0], id: "" }) === JSON.stringify({ ...newLine(), id: "" });
  function select(id: string) {
    setExpanded(id);
    requestAnimationFrame(() => document.getElementById(`rfq-line-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }
  function addImported(imported: RfqLine[]) {
    const next = [...(unchangedFirst ? [] : lines), ...imported.map(initializeBlend)];
    builder.update({ lines: next });
    setImportTab(null);
    select(imported[0].id);
  }
  if (!builder.hydrated) return <p role="status">Loading your RFQ draft…</p>;
  return (
    <div className={styles.builder}>
      {chatRequirement && <section className="mb-4 rounded-xl border border-blue-200 bg-blue-50 p-4" aria-label="Requirement from AI chat">
        <h2 className="font-semibold">Requirement from AI chat</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm">{chatRequirement}</p>
        <p className="my-3 text-sm">Review the extracted specifications before adding them to your RFQ. Your existing draft is preserved.</p>
        <button type="button" className="btn-primary" disabled={locked} onClick={() => setImportTab('text')}>Review and import specifications</button>
        <button type="button" className="btn-ghost ml-2" onClick={() => {
          setChatRequirement('');
          try { sessionStorage.removeItem('mylonex-chat-rfq:' + buyerId); } catch { /* Optional handoff storage. */ }
        }}>Dismiss</button>
      </section>}
      <BuilderHeader
        onVoice={() => { onBuilderMode(); setVoiceOpen(true); }}
        disabled={locked || uploading}
        imageMode={imageMode}
        onImage={() => setImageMode(true)}
        onPaste={() => {
          onBuilderMode();
          setImportTab("text");
        }}
        onSheet={() => {
          onBuilderMode();
          setImportTab("sheet");
        }}
      />
      <div hidden={imageMode} style={imageMode ? { display: "none" } : undefined}>
        {(builder.error || builder.storageError) && (
          <div role="alert" className={styles.error}>
            {builder.error || builder.storageError}
            {builder.storageError && !builder.pending && (
              <button className={styles.secondary} type="button" onClick={builder.reset}>
                Clear saved draft and start again
              </button>
            )}
          </div>
        )}
        <div className={styles.workspace}>
          <div className={styles.mainColumn}>
            <ol className={styles.process}>
              <li>
                <b>1</b>Quotes in 48 h
              </li>
              <li>
                <b>2</b>Sample from stock or developed
              </li>
              <li>
                <b>3</b>Approve, then PO
              </li>
            </ol>
            <fieldset disabled={locked || uploading} className={styles.editorFieldset}>
              <div className={styles.lineList}>
                {lines.map((line, index) => (
                  <LineCard
                    key={line.id}
                    line={line}
                    index={index}
                    open={openId === line.id}
                    onToggle={() => setExpanded(openId === line.id ? null : line.id)}
                    onChange={(updated) => builder.update({ lines: lines.map((item) => (item.id === line.id ? updated : item)) })}
                    onCopy={() => {
                      if (lines.length >= 200) return;
                      const copy = duplicateLine(line);
                      builder.update({ lines: [...lines.slice(0, index + 1), copy, ...lines.slice(index + 1)] });
                      setExpanded(copy.id);
                    }}
                    onDelete={() => {
                      builder.update({ lines: lines.filter((item) => item.id !== line.id) });
                      if (openId === line.id) setExpanded(undefined);
                    }}
                    onUseCycle={() =>
                      builder.update({
                        lines: lines.map((item) => ({ ...item, draft: { ...item.draft, productionCycle: line.draft.productionCycle } })),
                      })
                    }
                    onBusy={setUploading}
                  />
                ))}
              </div>
              <button
                type="button"
                className={styles.addLine}
                disabled={lines.length >= 200}
                onClick={() => {
                  const line = newLine();
                  builder.update({ lines: [...lines, line] });
                  setExpanded(line.id);
                }}
              >
                <Icon name="plus" /> Add fabric line <span>{lines.length} / 200</span>
              </button>
              {!lines.length && <p className={styles.hint}>Add a fabric line or import a list to start your RFQ.</p>}
              <Destination value={destination} onChange={builder.updateDestination} />
            </fieldset>
            <p className={styles.draftNotice}>
              {uploading
                ? "Uploading reference photos. Wait for completion before submitting."
                : builder.pending
                  ? "Original submission retained for a safe retry."
                  : builder.result
                    ? "Submitted. Your inquiry numbers are listed in Your RFQ."
                    : "Draft saved in this browser for your account. Review every line before sending."}
            </p>
          </div>
          <Summary
            lines={lines}
            destination={destination}
            canSubmit={canSubmit}
            busy={builder.busy}
            pending={!!builder.pending}
            result={builder.result}
            onSubmit={() => void builder.submit()}
            onSelect={select}
            onReset={() => {
              builder.reset();
              setExpanded(undefined);
            }}
          />
        </div>
      </div>
      {imageMode && <ImageTextWorkspace disabled={locked || uploading || !!builder.storageError}
        capacity={200 - (unchangedFirst ? 0 : lines.length)} onBack={onBuilderMode}
        onAdd={line => {
          if (locked || uploading || builder.storageError || (!unchangedFirst && lines.length >= 200)) return;
          addImported([line]);
          setImageMode(false);
        }} />}
      {importTab && (
        <ImportDialog
          initialText={chatRequirement}
          tab={importTab}
          capacity={200 - (unchangedFirst ? 0 : lines.length)}
          onClose={() => setImportTab(null)}
          onAdd={addImported}
        />
      )}
      <VoiceDialog open={voiceOpen} capacity={200 - (unchangedFirst ? 0 : lines.length)}
        alreadyAdded={id => hasVoiceSource(lines, id)} onClose={() => setVoiceOpen(false)}
        onAdd={imported => {
          if (locked || !imported.length || (imported[0].voiceSourceId && hasVoiceSource(lines, imported[0].voiceSourceId))) return;
          addImported(imported);
        }} />
    </div>
  );
}
