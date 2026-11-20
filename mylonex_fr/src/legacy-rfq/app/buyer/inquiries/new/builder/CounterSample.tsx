import { useId } from "react";
import type { RfqLine } from "./draft";
import { Field } from "./Fields";
import styles from "./styles";

export default function CounterSample({
  line,
  lineNumber,
  onChange,
}: {
  line: RfqLine;
  lineNumber: number;
  onChange: (_line: RfqLine) => void;
}) {
  const detailsId = useId();
  const enabled = line.draft.sendCounterSample ?? false;
  return (
    <div className={styles.counterSample} data-active={enabled}>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-controls={detailsId}
        className={styles.counterToggle}
        onClick={() =>
          onChange({
            ...line,
            draft: { ...line.draft, sendCounterSample: !enabled },
            counterSamplePreference: !enabled ? (line.counterSamplePreference ?? "exact") : line.counterSamplePreference,
          })
        }
      >
        <span className={styles.counterSwitch} aria-hidden="true">
          <span />
        </span>
        <span>
          <strong>Send a counter sample</strong>
          <small>Courier your reference fabric. Your sourcing team can review it with the mills.</small>
        </span>
      </button>
      {enabled && (
        <div id={detailsId} className={styles.counterDetails}>
          <div className={styles.courierTo}>
            <h4 className={styles.fieldLabel}>Courier to</h4>
            <p>Confirm the receiving address with your sourcing team before sending.</p>
            <small>Write your company name and line {String(lineNumber).padStart(2, "0")} on the packet.</small>
          </div>
          <fieldset className={styles.counterPreference}>
            <legend className={styles.fieldLabel}>Mills should</legend>
            <div className={styles.pills}>
              <button
                type="button"
                aria-pressed={line.counterSamplePreference === "exact"}
                onClick={() => onChange({ ...line, counterSamplePreference: "exact" })}
              >
                Match it exactly
              </button>
              <button
                type="button"
                aria-pressed={line.counterSamplePreference === "closest"}
                onClick={() => onChange({ ...line, counterSamplePreference: "closest" })}
              >
                Closest available
              </button>
            </div>
          </fieldset>
          <Field label="AWB / tracking · add later">
            <input
              aria-label="Courier and AWB number"
              maxLength={200}
              value={line.counterSampleCourier || ""}
              placeholder="Courier and AWB number"
              onChange={(event) => onChange({ ...line, counterSampleCourier: event.target.value })}
            />
          </Field>
          <p className={styles.hint}>
            Courier details are optional. Your preference and any AWB details are included with the inquiry for your sourcing team.
          </p>
        </div>
      )}
    </div>
  );
}
