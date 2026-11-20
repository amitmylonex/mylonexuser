import { Icon } from "./Fields";
import styles from "./styles";

export default function BuilderHeader({
  disabled,
  imageMode,
  onPaste,
  onSheet,
  onImage,
  onVoice,
}: {
  disabled: boolean;
  imageMode: boolean;
  onPaste: () => void;
  onSheet: () => void;
  onImage: () => void;
  onVoice: () => void;
}) {
  return (
    <div className={styles.headerSection}>
      <header className={styles.pageHeader}>
        <div>
          <p className={styles.eyebrow}>Buyer portal</p>
          <h1>New RFQ</h1>
          <p>
            Type each fabric as a line, paste them in one go, upload a sheet, or start from a written requirement. Seven details are
            required. The rest sharpen the match.
          </p>
        </div>
        <div className={styles.topActions} aria-label="Ways to start an RFQ">
          <button type="button" className={styles.secondary} disabled={disabled} onClick={onPaste}>
            <Icon name="paste" /> Paste lines
          </button>
          <button type="button" className={styles.secondary} disabled={disabled} onClick={onSheet}>
            <Icon name="sheet" /> Upload Excel sheet
          </button>
          <button type="button" className={styles.secondary} disabled={disabled} aria-pressed={imageMode} onClick={onImage}>
            <Icon name="image" /> Upload written requirement
          </button>
          <button type="button" className={styles.secondary} disabled={disabled} onClick={onVoice}>
            <Icon name="microphone" /> Speak requirement
          </button>
        </div>
      </header>
      <p className={styles.guidance} role="note" aria-label="For best results">
        <strong>For best results</strong>{" "}
        <span>
          For the best supplier matches, enter clear details for each fabric line. Include units and blend percentages where known, and
          review any pasted, uploaded, or extracted details before sending. Missing or unclear information may require follow-up.
        </span>
      </p>
    </div>
  );
}
