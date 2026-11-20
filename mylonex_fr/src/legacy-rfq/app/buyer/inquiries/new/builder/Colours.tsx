import type { RfqLine } from "./draft";
import { PhotoUpload } from "./Photos";
import styles from "./styles";
import { editColourAllocations } from "./colour-allocation-edit";

export default function Colours({
  line,
  onChange: commit,
  onBusy,
}: {
  line: RfqLine;
  onChange: (_line: RfqLine) => void;
  onBusy: (_busy: boolean) => void;
}) {
  const onChange = (updated: RfqLine) => commit(editColourAllocations(line, updated));
  const total = line.colours.reduce((sum, colour) => sum + (Number(colour.metres) || 0), 0);
  return (
    <section className={styles.colours} aria-label="Colours">
      <h3 className={styles.fieldLabel}>
        Colours <span className={styles.hint}>· optional, subject to fabric state</span>
      </h3>
      <label className={styles.checkbox}>
        <input
          type="checkbox"
          checked={line.unsureColours}
          onChange={(event) => onChange({ ...line, unsureColours: event.target.checked, coloursConfirmed: true })}
        />{" "}
        Not sure of exact colours at the moment
      </label>
      {line.unsureColours && (
        <p className={styles.hint}>
          We’ll retain this note. The existing dyed/printed inquiry workflow still needs a colour description before submission.
        </p>
      )}
      {line.colours.map((colour, index) => (
        <div key={colour.id} className={styles.colourRow}>
          <label>
            <span className={styles.fieldLabel}>Colour</span>
            <input
              aria-label={`Colour ${index + 1}`}
              placeholder="e.g. Navy / Pantone reference"
              value={colour.name}
              onChange={(event) =>
                onChange({
                  ...line,
                  coloursConfirmed: true,
                  colours: line.colours.map((item) => (item.id === colour.id ? { ...item, name: event.target.value } : item)),
                })
              }
            />
          </label>
          <label>
            <span className={styles.fieldLabel}>Metres · optional</span>
            <input
              aria-label={`Metres for colour ${index + 1}`}
              type="number"
              min="0"
              value={colour.metres}
              onChange={(event) =>
                onChange({
                  ...line,
                  coloursConfirmed: true,
                  colours: line.colours.map((item) => (item.id === colour.id ? { ...item, metres: event.target.value } : item)),
                })
              }
            />
          </label>
          <div>
            <span className={styles.fieldLabel}>Swatch · optional</span>
            {colour.swatchUrl ? (
              <span className={styles.added}>Photo added ✓</span>
            ) : (
              <PhotoUpload
                swatch
                urls={line.draft.referenceImageUrls ?? []}
                onBusy={onBusy}
                onChange={() => {
                  /* URLs and association are applied together by onSwatch below. */
                }}
                onSwatch={(url) =>
                  onChange({
                    ...line,
                    coloursConfirmed: true,
                    draft: { ...line.draft, referenceImageUrls: [...(line.draft.referenceImageUrls ?? []), url] },
                    colours: line.colours.map((item) => (item.id === colour.id ? { ...item, swatchUrl: url } : item)),
                  })
                }
              />
            )}
          </div>
          <button
            type="button"
            className={styles.iconButton}
            aria-label={`Remove colour ${index + 1}`}
            onClick={() => onChange({ ...line, coloursConfirmed: true, colours: line.colours.filter((item) => item.id !== colour.id) })}
          >
            ×
          </button>
        </div>
      ))}
      <div className={styles.inlineActions}>
        <button
          className={styles.dashedButton}
          type="button"
          onClick={() => onChange({ ...line, coloursConfirmed: true, colours: [...line.colours, { id: crypto.randomUUID(), name: "", metres: "" }] })}
        >
          + Add colour
        </button>
        {total > 0 && (
          <span className={total === line.draft.quantity ? styles.added : styles.errorText}>
            Split {total.toLocaleString("en-IN")} of {(line.draft.quantity || 0).toLocaleString("en-IN")} m
          </span>
        )}
      </div>
      <p className={styles.hint}>
        Colour splits and swatch associations are sent as additional specifications; photos count toward the five references per line.
      </p>
    </section>
  );
}
