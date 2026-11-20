import { useRef, useState } from "react";
import { downloadTemplate, REQUIRED_COLUMNS, OPTIONAL_COLUMNS } from "./parse-sheet";
import { Icon } from "./Fields";
import styles from "./styles";

export default function SheetImport({
  file,
  chooseFile,
  onError,
}: {
  file: File | null;
  chooseFile: (_file?: File) => void;
  onError: (_message: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  return (
    <div className={styles.sheetGrid}>
      <section className={styles.template}>
        <p className={styles.fieldLabel}>Step 1</p>
        <div className={styles.inlineActions}>
          <h3>Download the template</h3>
          <button
            type="button"
            className={styles.secondary}
            onClick={() => {
              try {
                downloadTemplate();
              } catch {
                onError("The template could not be downloaded. Please try again.");
              }
            }}
          >
            ↓ RFQ template.xlsx
          </button>
        </div>
        <p className={styles.columnHeading}>Required columns</p>
        <div className={styles.columnTags}>
          {REQUIRED_COLUMNS.map((column) => (
            <span key={column}>{column}</span>
          ))}
        </div>
        <p className={styles.columnHeading}>Optional columns</p>
        <div className={`${styles.columnTags} ${styles.optionalTags}`}>
          {OPTIONAL_COLUMNS.map((column) => (
            <span key={column}>{column}</span>
          ))}
        </div>
        <p className={styles.hint}>
          Fabric state: Greige, RFD, Dyed, Printed, Finished. Cycle: Ready stock, Running production, Made to order. Use the existing weave
          categories. Dates: YYYY-MM-DD. Separate colours with semicolons.
        </p>
      </section>
      <section className={styles.template}>
        <p className={styles.fieldLabel}>Step 2</p>
        <h3>Upload your filled sheet</h3>
        <div
          className={`${styles.dropzone} ${dragging ? styles.dragging : ""}`}
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            if (event.dataTransfer.files.length > 1) onError("Choose one sheet at a time.");
            else chooseFile(event.dataTransfer.files[0]);
          }}
        >
          <Icon name="sheet" />
          <strong>{file ? file.name : "Drop the sheet here"}</strong>
          <span>.xlsx or .csv, one fabric per row, up to 200 rows · 10 MB</span>
          <button type="button" className={styles.secondary} onClick={() => fileInput.current?.click()}>
            Browse files
          </button>
          <input
            ref={fileInput}
            className={styles.fileInput}
            aria-label="RFQ spreadsheet"
            type="file"
            accept=".xlsx,.csv"
            onChange={(event) => {
              chooseFile(event.target.files?.[0]);
              event.target.value = "";
            }}
          />
        </div>
        <p className={styles.hint}>Use one worksheet. Missing and invalid values are flagged for review.</p>
      </section>
    </div>
  );
}
