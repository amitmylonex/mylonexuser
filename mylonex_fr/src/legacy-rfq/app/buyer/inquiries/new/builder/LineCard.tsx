import type { RfqLine } from "./draft";
import { lineTitle, missingRequired, lineDetailIssues } from "./draft";
import { Icon } from "./Fields";
import RequiredFields, { CYCLE_LABELS } from "./RequiredFields";
import LineExtras from "./LineExtras";
import styles from "./styles";
import TextSourceReview from "./TextSourceReview";
import { canEditTextSource } from "./source-review";
import TextCandidateReview from "./TextCandidateReview";

export default function LineCard({
  line,
  index,
  open,
  onToggle,
  onChange,
  onCopy,
  onDelete,
  onUseCycle,
  onBusy,
}: {
  line: RfqLine;
  index: number;
  open: boolean;
  onToggle: () => void;
  onChange: (_line: RfqLine) => void;
  onCopy: () => void;
  onDelete: () => void;
  onUseCycle: () => void;
  onBusy: (_busy: boolean) => void;
}) {
  const missing = missingRequired(line);
  const issues = lineDetailIssues(line);
  const ready = missing.length === 0 && issues.length === 0;
  const d = line.draft;
  const summary = [
    d.gsm ? `${d.gsm} GSM` : "GSM —",
    d.width ? d.width : "width —",
    d.fabricState || "state —",
    d.quantity ? `${d.quantity.toLocaleString("en-IN")} m` : "quantity —",
    d.productionCycle ? CYCLE_LABELS[d.productionCycle] : "cycle —",
  ].join(" · ");
  return (
    <article
      id={`rfq-line-${line.id}`}
      className={`${styles.lineCard} ${open ? styles.openLine : ""} ${!ready ? styles.incompleteLine : ""}`}
      aria-label={`Fabric line ${index + 1}`}
    >
      <header className={styles.lineHeader}>
        <span className={styles.lineNumber}>{String(index + 1).padStart(2, "0")}</span>
        <button type="button" className={styles.lineTitle} aria-expanded={open} aria-controls={`line-editor-${line.id}`} onClick={onToggle}>
          <strong>{lineTitle(line)}</strong>
          <small>{summary}</small>
        </button>
        <span className={ready ? styles.readyBadge : styles.needsBadge}>
          {ready ? "Ready" : missing.length ? `${missing.length} required missing` : "Review details"}
        </span>
        <div className={styles.lineActions}>
          <button
            type="button"
            className={open ? styles.primary : styles.secondary}
            onClick={onToggle}
            aria-label={`${open ? "Done editing" : "Edit"} line ${index + 1}`}
          >
            {open ? "Done" : "Edit"}
          </button>
          <button type="button" className={styles.iconButton} aria-label={`Duplicate line ${index + 1}`} onClick={onCopy}>
            <Icon name="copy" />
          </button>
          <button type="button" className={styles.iconButton} aria-label={`Delete line ${index + 1}`} onClick={onDelete}>
            <Icon name="delete" />
          </button>
        </div>
      </header>
      {open && (
        <div id={`line-editor-${line.id}`} className={styles.lineEditor}>
          {(!!line.warnings.length || canEditTextSource(line)) && (
            <details className={styles.importWarnings}>
              <summary>Imported line · review notes ({line.warnings.length})</summary>
              {canEditTextSource(line) && <TextSourceReview line={line} onChange={onChange} />}
              {canEditTextSource(line) && <TextCandidateReview line={line} onChange={onChange} />}
              {line.warnings.map((warning, index) => (
                <p key={index}>{warning}</p>
              ))}
            </details>
          )}
          <div className={styles.sectionHeading}>
            <h3>Required</h3>
            <span>{7 - missing.length} of 7 done</span>
          </div>
          <RequiredFields line={line} onChange={onChange} onUseCycle={onUseCycle} />
          {!!missing.length && <p className={styles.errorText}>Add {missing.join(", ")}.</p>}
          <LineExtras line={line} lineNumber={index + 1} onChange={onChange} onBusy={onBusy} />
          {!!issues.length && (
            <details className={styles.validation}>
              <summary>
                {issues.length} validation {issues.length === 1 ? "issue" : "issues"} to resolve
              </summary>
              <ul>
                {issues.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </details>
          )}
          <button type="button" className={styles.secondary} onClick={onToggle}>
            Done editing this line
          </button>
        </div>
      )}
    </article>
  );
}
