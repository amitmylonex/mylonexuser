"use client";
import { useId, useRef } from "react";
import { type FibreRow } from "../../../../../src/domains/rfq/blend/rows";
import { validateBlendRows } from "../../../../../src/domains/rfq/blend/validation";
import { Icon } from "./Fields";
import FibreCombobox from "./FibreCombobox";
import styles from "./styles";
import { type SourcingAlternative, validateAlternatives } from "../../../../../src/domains/rfq/text/alternatives";

export default function BlendField({
  value,
  onChange,
  alternatives = [],
  onAlternativesChange,
  hint,
}: {
  value: { rows: FibreRow[]; legacyText?: string };
  onChange: (_rows: FibreRow[], _legacyText?: string) => void;
  alternatives?: SourcingAlternative[];
  onAlternativesChange?: (_alternatives: SourcingAlternative[]) => void;
  hint?: string;
}) {
  const id = useId();
  const inputs = useRef(new Map<string, HTMLInputElement>());
  const percentage = validateBlendRows(value.rows, value.legacyText);
  const change = (rowId: string, patch: Partial<FibreRow>) => onChange(value.rows.map(row => row.id === rowId ? { ...row, ...patch } : row), value.legacyText);

  const hasAlternatives = alternatives.length > 0;
  const altValidation = hasAlternatives ? validateAlternatives(alternatives) : null;
  const isComplete = hasAlternatives
    ? altValidation?.state === "complete"
    : percentage.state === "complete";

  const handleAltDescChange = (index: number, desc: string) => {
    if (!onAlternativesChange) return;
    const next = alternatives.map((alt, i) => (i === index ? { ...alt, description: desc } : alt));
    onAlternativesChange(next);
  };

  const handleAltPctChange = (index: number, pct: string) => {
    if (!onAlternativesChange) return;
    const next = alternatives.map((alt, i) => (i === index ? { ...alt, percentage: pct } : alt));
    onAlternativesChange(next);
  };

  const handleAltRowDescChange = (altIndex: number, rowIdx: number, desc: string) => {
    if (!onAlternativesChange) return;
    const next = alternatives.map((alt, i) => {
      if (i !== altIndex) return alt;
      const rows = alt.rows ? [...alt.rows] : [{ id: `${alt.id}-1`, description: alt.description, percentage: alt.percentage ?? "" }];
      rows[rowIdx] = { ...rows[rowIdx], description: desc };
      return {
        ...alt,
        rows,
        description: rows.map(r => r.description).join(" / "),
      };
    });
    onAlternativesChange(next);
  };

  const handleAltRowPctChange = (altIndex: number, rowIdx: number, pct: string) => {
    if (!onAlternativesChange) return;
    const next = alternatives.map((alt, i) => {
      if (i !== altIndex) return alt;
      const rows = alt.rows ? [...alt.rows] : [{ id: `${alt.id}-1`, description: alt.description, percentage: alt.percentage ?? "" }];
      rows[rowIdx] = { ...rows[rowIdx], percentage: pct };
      return {
        ...alt,
        rows,
        description: rows.map(r => `${r.percentage ? `${r.percentage}% ` : ""}${r.description}`).join(" / "),
      };
    });
    onAlternativesChange(next);
  };

  return <fieldset className={`${styles.field} ${styles.blendField}`} aria-describedby={`${id}-total ${id}-hint`}>
    <legend className={styles.fieldLabel}>
      Blend <span aria-hidden="true">*</span>
      <span className={isComplete ? styles.added : styles.missing}>{isComplete ? "Added" : "Required"}</span>
    </legend>

    {hasAlternatives ? (
      <div className={styles.alternativesSection}>
        <div className={styles.alternativesHeading}>
          <span className={styles.alternativesTag}>Alternatives — not a combined blend</span>
        </div>

        <div className={styles.alternativeRows}>
          {alternatives.map((alt, index) => {
            const rows = alt.rows && alt.rows.length > 0 ? alt.rows : [{
              id: `${alt.id}-1`,
              description: alt.description,
              percentage: alt.percentage ?? "",
            }];
            const isMultiRow = rows.length > 1;

            if (isMultiRow) {
              return (
                <div className={styles.alternativeMultiCard} key={alt.id || `alt-${index}`}>
                  <div className={styles.alternativeMultiHeader}>
                    <strong>Alternative {index + 1}</strong>
                    <span className={styles.subtleBadge}>({rows.length} fibres)</span>
                  </div>
                  {rows.map((row, rIdx) => (
                    <div className={styles.alternativeRow} key={row.id || `row-${rIdx}`}>
                      <label className={styles.alternativeName}>
                        <span>Fibre {rIdx + 1} / description</span>
                        <input
                          type="text"
                          value={row.description}
                          aria-label={`Alternative ${index + 1} fibre ${rIdx + 1} description`}
                          onChange={(e) => handleAltRowDescChange(index, rIdx, e.target.value)}
                        />
                      </label>
                      <label className={styles.alternativePercentage}>
                        <span>Percentage</span>
                        <span className={styles.unitInput}>
                          <input
                            type="number"
                            inputMode="decimal"
                            min="0"
                            max="100"
                            step="any"
                            placeholder="Not stated"
                            value={row.percentage}
                            aria-label={`Alternative ${index + 1} fibre ${rIdx + 1} percentage`}
                            onChange={(e) => handleAltRowPctChange(index, rIdx, e.target.value)}
                          />
                          <span aria-hidden="true">%</span>
                        </span>
                      </label>
                    </div>
                  ))}
                </div>
              );
            }

            return (
              <div className={styles.alternativeRow} key={alt.id || `alt-${index}`}>
                <label className={styles.alternativeName}>
                  <span>Alternative {index + 1} fibre / description</span>
                  <input
                    type="text"
                    value={alt.description}
                    aria-label={`Alternative ${index + 1} description`}
                    onChange={(e) => handleAltDescChange(index, e.target.value)}
                  />
                </label>
                <label className={styles.alternativePercentage}>
                  <span>Percentage</span>
                  <span className={styles.unitInput}>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      max="100"
                      step="any"
                      placeholder="Not stated"
                      value={alt.percentage ?? ""}
                      aria-label={`Alternative ${index + 1} percentage`}
                      aria-invalid={altValidation?.state === "error" ? true : undefined}
                      onChange={(e) => handleAltPctChange(index, e.target.value)}
                    />
                    <span aria-hidden="true">%</span>
                  </span>
                </label>
              </div>
            );
          })}
        </div>

        <div className={styles.alternativesStatus} id={`${id}-total`} role="status" aria-live="polite">
          {altValidation?.state === "error" ? (
            <span role="alert" className={styles.errorText}>{altValidation.error}</span>
          ) : altValidation?.state === "complete" ? (
            <span className={styles.alternativesComplete}>{altValidation.summary}</span>
          ) : (
            <span className={styles.alternativesPrompt}>
              {altValidation?.summary || "Confirm percentage for each alternative separately."}
            </span>
          )}
        </div>
      </div>
    ) : (
      <>
        <div className={styles.fibreRows}>
          {value.rows.map((row, index) => <div className={styles.fibreRow} key={row.id}>
            <label className={styles.fibreName}><span>Fibre {index + 1}</span>
              <FibreCombobox id={`${id}-fibre-${row.id}`} label={`Fibre ${index + 1}`} value={row.fibre} invalid={!!percentage.error}
                inputRef={element => { if (element) inputs.current.set(row.id, element); else inputs.current.delete(row.id); }}
                onChange={fibre => change(row.id, { fibre })} />
            </label>
            <label className={styles.fibrePercentage}><span>Percentage {index + 1}</span>
              <span className={styles.unitInput}><input type="number" inputMode="decimal" min="0" max="100" step="any" value={row.percentage}
                aria-label={`Percentage ${index + 1}`}
                aria-invalid={percentage.error ? true : undefined} onChange={event => change(row.id, { percentage: event.target.value })} /><span aria-hidden="true">%</span></span>
            </label>
            {value.rows.length > 1 && (
              <button type="button" className={styles.iconButton} aria-label={`Remove fibre ${index + 1}`} onClick={() => {
                const rows = value.rows.filter(item => item.id !== row.id);
                onChange(rows, value.legacyText);
                requestAnimationFrame(() => inputs.current.get(rows[Math.min(index, rows.length - 1)]?.id)?.focus());
              }}><Icon name="delete" /></button>
            )}
          </div>)}
        </div>
        <button type="button" className={styles.textButton} onClick={() => {
          const next = { id: crypto.randomUUID(), fibre: "", percentage: "" };
          onChange([...value.rows, next], value.legacyText);
          requestAnimationFrame(() => inputs.current.get(next.id)?.focus());
        }}>＋ Add fibre</button>
        <span id={`${id}-total`} role="status" aria-live="polite" className={styles.blendSummary} data-state={percentage.state}>{percentage.summary}</span>
        {percentage.error && <span role="alert" className={styles.errorText}>{percentage.error}</span>}
      </>
    )}

    {value.legacyText && <div className={styles.legacyBlend}>
      <p><strong>Unclear saved blend text:</strong> {value.legacyText}</p>
      <p>Enter the confirmed fibres and percentages above. The original wording stays in your line notes.</p>
      <button type="button" className={styles.secondary} disabled={validateBlendRows(value.rows).state !== "complete"} onClick={() => onChange(value.rows, undefined)}>Use corrected rows</button>
    </div>}
    <span id={`${id}-hint`} className={styles.hint}>
      {hasAlternatives
        ? "Sourcing alternatives are retained in Notes. Confirm percentage for each alternative separately."
        : (hint || "Enter each fibre and its stated percentage. Nothing is filled or distributed automatically.")}
    </span>
  </fieldset>;
}
