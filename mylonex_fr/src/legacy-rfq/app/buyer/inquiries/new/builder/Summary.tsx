import Link from "../../../../../adapters/SiteLink";
import type { RfqLine, Destination } from "./draft";
import { lineTitle, missingRequired, lineDetailIssues } from "./draft";
import styles from "./styles";

export default function Summary({
  lines,
  destination,
  canSubmit,
  busy,
  pending,
  result,
  onSubmit,
  onSelect,
  onReset,
}: {
  lines: RfqLine[];
  destination: Destination;
  canSubmit: boolean;
  busy: boolean;
  pending: boolean;
  result: {
    lines: { lineId: string; inquiryId: string; rfqNumber: string }[];
    dispatch: { claimed: number; completed: number; failed: number };
  } | null;
  onSubmit: () => void;
  onSelect: (_id: string) => void;
  onReset: () => void;
}) {
  const readiness = lines.map((line) => missingRequired(line).length === 0 && lineDetailIssues(line).length === 0);
  const ready = readiness.filter(Boolean).length;
  const photos = lines.reduce((sum, line) => sum + (line.draft.referenceImageUrls?.length || 0), 0);
  const samples = lines.filter((line) => line.draft.sendCounterSample).length;
  return (
    <aside className={styles.summary} aria-labelledby="your-rfq">
      <header>
        <h2 id="your-rfq">Your RFQ</h2>
        <span aria-live="polite">
          {ready} of {lines.length} ready
        </span>
      </header>
      <progress max={Math.max(lines.length, 1)} value={ready} aria-label="Ready fabric lines" />
      <dl className={styles.stats}>
        <div>
          <dt>Lines</dt>
          <dd>{lines.length}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{lines.reduce((sum, line) => sum + (line.draft.quantity || 0), 0).toLocaleString("en-IN")} m</dd>
        </div>
        <div>
          <dt>Deliver to</dt>
          <dd>
            {[destination.deliveryAddress, destination.deliveryCity, destination.deliveryState, destination.deliveryCountry]
              .filter(Boolean)
              .join(", ") || "Add destination"}
          </dd>
        </div>
        <div>
          <dt>References</dt>
          <dd>
            {photos} photos · {samples} counter {samples === 1 ? "sample" : "samples"}
          </dd>
        </div>
      </dl>
      <div className={styles.summaryLines}>
        <p className={styles.fieldLabel}>Required fields by line</p>
        <ol>
          {lines.map((line, index) => {
            const missing = missingRequired(line);
            return (
              <li key={line.id}>
                <button type="button" onClick={() => onSelect(line.id)}>
                  <span className={readiness[index] ? styles.greenDot : styles.redDot} />
                  <span className={styles.lineNumber}>{String(index + 1).padStart(2, "0")}</span>
                  <strong>{lineTitle(line)}</strong>
                  <small className={readiness[index] ? styles.added : styles.errorText}>
                    {readiness[index] ? "Ready" : missing.length ? `Add ${missing.join(", ")}` : "Review details"}
                  </small>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      <div className={styles.summaryFooter}>
        {result ? (
          <div role="status">
            <strong className={styles.added}>
              {result.lines.length} {result.lines.length === 1 ? "inquiry" : "inquiries"} created
            </strong>
            <p className={styles.hint}>All lines were saved together. Your inquiry numbers:</p>
            <ul className={styles.receipts}>
              {result.lines.map((line) => (
                <li key={line.lineId}>
                  <Link href={`/buyer/inquiries/${line.inquiryId}`}>{line.rfqNumber} ↗</Link>
                </li>
              ))}
            </ul>
            {(result.dispatch.completed < result.lines.length || result.dispatch.failed > 0) && (
              <p className={styles.errorText}>
                Some matching/notification attempts are pending, uncertain or failed. Your inquiries are saved. Repeated sends are
                suppressed; contact your sourcing team for follow-up.
              </p>
            )}
            <button type="button" className={styles.secondary} onClick={onReset}>
              Start another RFQ
            </button>
          </div>
        ) : (
          <>
            <button type="button" className={styles.primary} disabled={busy || (!pending && !canSubmit)} onClick={onSubmit}>
              {busy
                ? "Submitting RFQ…"
                : pending
                  ? "Retry safely / check result"
                  : `Send ${lines.length} ${lines.length === 1 ? "inquiry" : "inquiries"}`}
            </button>
            <p role="status" className={styles.hint}>{busy ? "Submitting RFQ…" : pending ? "Status is unconfirmed. Your original lines and key are retained. Retry to retrieve the same inquiries; editing stays locked."
                : ready < lines.length
                  ? `${lines.length - ready} ${lines.length - ready === 1 ? "line still needs" : "lines still need"} details. Select a line above to fix it.`
                  : !canSubmit
                    ? "Complete delivery details and review any validation issues before sending."
                    : "All lines will be submitted together. Reference photos are included; reading drafts never submits."}
            </p>
          </>
        )}
      </div>
    </aside>
  );
}
