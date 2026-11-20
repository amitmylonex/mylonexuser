import type { RfqLine } from "./draft";
import { BUYER_FABRIC_STATES, PRODUCTION_CYCLES } from "../../../../../src/domains/rfq/constants";
import { Field } from "./Fields";
import BlendField from "./BlendField";
import styles from "./styles";
import { gsmInferenceHint } from "./inference-evidence";
import { blendState, updateBlend } from "./blend-state";
import { detectSourcingAlternatives, analyzeAlternativesComposition } from "../../../../../src/domains/rfq/text/alternatives";
import { updateLineAlternatives } from "./alternatives-actions";
import { applyPlatformWidthDefault, recomputePlatformWidth } from "./platform-width";
import { recalculateGlmGsm } from "../../../../../src/domains/rfq/text/weight-conversion";
import { isValidWidth, parseWidthBounds } from "../../../../../src/domains/rfq/text/width-bounds";

export const CYCLE_LABELS: Record<string, string> = {
  ready_stock: "Ready",
  running_production: "Running production",
  made_to_order: "Made to order",
};
const CYCLE_TIMES: Record<string, string> = { ready_stock: "5–10 days", running_production: "21–45 days", made_to_order: "45–90 days" };

function blendFieldHint(line: RfqLine): string | undefined {
  const alternatives = line.sourcingAlternatives || detectSourcingAlternatives(line.original);
  if (!alternatives.length) return undefined;
  const analysis = analyzeAlternativesComposition(alternatives);
  if (analysis.commonFibre) {
    if (analysis.commonPercentage) return undefined;
    return `${analysis.commonFibre} detected. Confirm percentage; sourcing alternatives are retained in Notes.`;
  }
  if (analysis.conflict) {
    return "Multiple sourcing alternatives with different fibre compositions detected. Confirm blend; sourcing alternatives are retained in Notes.";
  }
  return undefined;
}

function widthQualifierHint(line: RfqLine): string {
  if (line.widthProvenance === "default" && line.widthDefaultNote) return line.widthDefaultNote;
  if (line.widthBasis === "greige") return "Source specifies greige width.";
  if (line.widthBasis === "finished" || line.widthBasis === "cuttable") return "Source specifies finished width.";
  return "Cuttable width, in inches.";
}

function stripWidthUnit(value?: string): string {
  if (!value) return "";
  return value.replace(/\s*(?:inches|inch|ins|in|")\s*$/i, "").trim();
}

export default function RequiredFields({
  line,
  onChange,
  onUseCycle,
}: {
  line: RfqLine;
  onChange: (_line: RfqLine) => void;
  onUseCycle: () => void;
}) {
  const d = line.draft;
  const patch = (draft: Partial<RfqLine["draft"]>) => onChange({ ...line, draft: { ...d, ...draft } });
  return (
    <div className={styles.requiredGrid}>
      <BlendField
        value={blendState(line)}
        alternatives={line.sourcingAlternatives}
        onAlternativesChange={(updated) => onChange(updateLineAlternatives(line, updated))}
        hint={blendFieldHint(line)}
        onChange={(rows, legacyText) => {
          let updatedLine = updateBlend(line, rows, legacyText);
          if (line.widthProvenance === "default") {
            updatedLine = recomputePlatformWidth(updatedLine);
          } else if (!updatedLine.draft.width && updatedLine.widthProvenance !== "cleared" && updatedLine.widthProvenance !== "manual") {
            updatedLine = applyPlatformWidthDefault(updatedLine);
          }
          onChange(updatedLine);
        }}
      />
      <Field
        label="GSM"
        added={!!d.gsm && d.gsm > 0}
        required
        hint={
          line.gsmMin && line.gsmMax && line.gsmMin !== line.gsmMax
            ? (d.gsm ? `Range ${line.gsmMin}–${line.gsmMax} g/m² specified · booking target: ${d.gsm} g/m²` : `Range ${line.gsmMin}–${line.gsmMax} g/m² captured. Select or enter target GSM for booking.`)
            : (line.gsmBound
                ? (d.gsm ? `${line.gsmBound.label} ${line.gsmBound.value} g/m² specified · booking target: ${d.gsm} g/m²` : `${line.gsmBound.label} ${line.gsmBound.value} g/m² captured. Select or enter target GSM for booking.`)
                : (line.gsmDerivedReason
                    ? line.gsmDerivedReason
                    : (line.gsmQualifier ? `Source specifies ${line.gsmQualifier}.` : gsmInferenceHint(line))))
        }
      >
        {line.gsmMin && line.gsmMax && line.gsmMin !== line.gsmMax ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className={styles.unitInput} style={{ flex: 1 }}>
                <input
                  type="number"
                  min="1"
                  step="any"
                  aria-label="Minimum GSM"
                  value={line.gsmMin ?? ""}
                  placeholder="Min"
                  onChange={(e) => onChange({ ...line, gsmMin: e.target.value ? Number(e.target.value) : undefined })}
                />
                <span style={{ fontSize: "0.75rem" }}>min</span>
              </span>
              <span style={{ color: "#888", fontWeight: 600 }}>—</span>
              <span className={styles.unitInput} style={{ flex: 1 }}>
                <input
                  type="number"
                  min="1"
                  step="any"
                  aria-label="Maximum GSM"
                  value={line.gsmMax ?? ""}
                  placeholder="Max"
                  onChange={(e) => onChange({ ...line, gsmMax: e.target.value ? Number(e.target.value) : undefined })}
                />
                <span style={{ fontSize: "0.75rem" }}>max</span>
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", fontSize: "0.8rem", color: "#475569" }}>
              <span>Target:</span>
              <span className={styles.unitInput} style={{ maxWidth: "100px" }}>
                <input
                  type="number"
                  min="1"
                  step="any"
                  aria-label="Target GSM"
                  placeholder="Target"
                  value={d.gsm ?? ""}
                  onChange={(e) => patch({ gsm: e.target.value ? Number(e.target.value) : undefined })}
                />
                <span style={{ fontSize: "0.75rem" }}>g/m²</span>
              </span>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => patch({ gsm: line.gsmMin })}
                style={{ fontSize: "0.75rem", padding: "2px 6px" }}
              >
                Use {line.gsmMin}
              </button>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => patch({ gsm: Math.round((line.gsmMin! + line.gsmMax!) / 2) })}
                style={{ fontSize: "0.75rem", padding: "2px 6px" }}
              >
                Use {Math.round((line.gsmMin! + line.gsmMax!) / 2)} (mid)
              </button>
              <button
                type="button"
                className={styles.textButton}
                onClick={() => patch({ gsm: line.gsmMax })}
                style={{ fontSize: "0.75rem", padding: "2px 6px" }}
              >
                Use {line.gsmMax}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", width: "100%" }}>
            <span className={styles.unitInput}>
              <input
                type="number"
                min="1"
                step="any"
                value={d.gsm ?? ""}
                onChange={(event) => {
                  const val = event.target.value ? Number(event.target.value) : undefined;
                  onChange({
                    ...line,
                    draft: { ...d, gsm: val },
                    gsmProvenance: val !== undefined ? "manual" : "cleared",
                    gsmDerivedReason: val !== undefined ? undefined : line.gsmDerivedReason,
                  });
                }}
              />
              <span>g/m²</span>
            </span>
            {line.gsmBound && (
              <button
                type="button"
                className={styles.textButton}
                onClick={() => patch({ gsm: line.gsmBound!.value })}
                style={{ fontSize: "0.75rem", padding: "2px 6px" }}
              >
                Use {line.gsmBound.value} ({line.gsmBound.label.toLowerCase()})
              </button>
            )}
            {line.gsmAlternatives && line.gsmAlternatives.map((alt) => (
              <button
                key={alt}
                type="button"
                className={styles.textButton}
                onClick={() => patch({ gsm: alt })}
                style={{ fontSize: "0.75rem", padding: "2px 6px" }}
              >
                Use {alt}
              </button>
            ))}
          </div>
        )}
      </Field>
      <Field label="Weave" added={!!d.weaveType?.trim()} required hint="Enter the buyer's weave wording. Review unfamiliar terms before using them.">
        <input value={d.weaveType || ""} maxLength={200} placeholder="e.g. 2/1 twill or supplier weave name"
          onChange={(event) => patch({ weaveType: event.target.value || undefined })} />
      </Field>
      {!!line.weaveDetection?.mentions.length && <details className={styles.full}>
        <summary>Detected weave mentions ({line.weaveDetection.mentions.length}) — review candidates</summary>
        {line.weaveDetection.mentions.map((mention, index) => <p key={index}>
          <strong>{mention.matchedTerm}</strong> · {mention.status === "recognized" ? "Vocabulary match" : "Unknown candidate"}
          {mention.needsReview ? " · needs review" : ""} · {mention.confidence} confidence{" "}
          <button type="button" className={styles.textButton} onClick={() => patch({ weaveType: mention.matchedTerm })}>
            Use “{mention.matchedTerm}” after review
          </button>
        </p>)}
      </details>}
      <Field
        label="Width"
        added={!!d.width && isValidWidth(d.width)}
        required
        hint={widthQualifierHint(line)}
      >
        <span className={styles.unitInput}>
          <input
            type="text"
            inputMode="text"
            value={stripWidthUnit(d.width)}
            aria-label="Width"
            placeholder="58"
            onChange={(event) => {
              const stripped = stripWidthUnit(event.target.value);
              let updatedLine: RfqLine;
              if (stripped) {
                const bounds = parseWidthBounds(stripped);
                updatedLine = {
                  ...line,
                  widthProvenance: "manual",
                  widthDefaultNote: undefined,
                  widthMin: bounds?.minInches,
                  widthMax: bounds?.maxInches,
                  draft: { ...d, width: `${stripped} inches` },
                };
              } else {
                const nextDraft = { ...d };
                delete nextDraft.width;
                updatedLine = {
                  ...line,
                  widthProvenance: "cleared",
                  widthDefaultNote: undefined,
                  draft: nextDraft,
                };
                delete updatedLine.widthMin;
                delete updatedLine.widthMax;
              }
              const recomputed = recalculateGlmGsm(updatedLine);
              onChange(recomputed);
            }}
          />
          <span aria-hidden="true">inches</span>
        </span>
      </Field>
      <fieldset className={styles.field}>
        <legend className={styles.fieldLabel}>
          Fabric state * <span className={d.fabricState ? styles.added : styles.missing}>{d.fabricState ? "Added" : "Required"}</span>
        </legend>
        <div className={styles.pills}>
          {BUYER_FABRIC_STATES.map((state) => (
            <button
              key={state}
              type="button"
              aria-pressed={d.fabricState === state}
              onClick={() => {
                let updatedLine: RfqLine = {
                  ...line,
                  fabricStateInferred: false,
                  draft: { ...d, fabricState: state },
                };
                if (line.widthProvenance === "default") {
                  updatedLine = recomputePlatformWidth(updatedLine);
                } else if (!updatedLine.draft.width && updatedLine.widthProvenance !== "cleared" && updatedLine.widthProvenance !== "manual") {
                  updatedLine = applyPlatformWidthDefault(updatedLine);
                }
                onChange(updatedLine);
              }}
            >
              {state === "rfd" ? "RFD" : state[0].toUpperCase() + state.slice(1)}
            </button>
          ))}
        </div>
        {line.fabricStateInferred && d.fabricState === "dyed" && (
          <span className={styles.hint}>Inferred from requested shade</span>
        )}
        {line.fabricStateInferred && (d.fabricState === "greige" || d.fabricState === "finished") && (
          <span className={styles.hint}>Inferred from stated width and blend</span>
        )}
      </fieldset>
      <Field
        label="Quantity required"
        added={!!d.quantity && d.quantity > 0}
        required
        hint={
          line.quantityBound
            ? `Source specifies ${line.quantityBound.label.toLowerCase()} ${line.quantityBound.value.toLocaleString()} m. Confirm exact booking quantity before ordering.`
            : "Total for this fabric, all colours together."
        }
      >
        <span className={styles.unitInput}>
          <input
            type="number"
            step="1"
            min="1"
            max="2147483647"
            value={d.quantity ?? ""}
            onChange={(event) => patch({ quantity: event.target.value ? Number(event.target.value) : undefined })}
          />
          <span>m</span>
        </span>
        {line.quantityBound && (
          <div style={{ marginTop: "4px", fontSize: "0.75rem", color: "#2563eb", fontWeight: 500 }}>
            {line.quantityBound.label}: {line.quantityBound.value.toLocaleString()} m
          </div>
        )}
      </Field>
      <fieldset className={`${styles.field} ${styles.full}`}>
        <legend className={styles.fieldLabel}>
          Production cycle *{" "}
          <span className={d.productionCycle ? styles.added : styles.missing}>{d.productionCycle ? "Added" : "Required"}</span>
        </legend>
        <div className={styles.pills}>
          {PRODUCTION_CYCLES.map((cycle) => (
            <button key={cycle} type="button" aria-pressed={d.productionCycle === cycle} onClick={() => patch({ productionCycle: cycle })}>
              {CYCLE_LABELS[cycle]} <small>{CYCLE_TIMES[cycle]}</small>
            </button>
          ))}
        </div>
        <div className={styles.cycleHint}>
          <span>Indicative timelines, subject to availability.</span>
          <button type="button" disabled={!d.productionCycle} onClick={onUseCycle}>
            Use this for all lines
          </button>
        </div>
      </fieldset>
    </div>
  );
}
