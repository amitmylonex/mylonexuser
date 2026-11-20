import type { ReactNode } from "react";
import styles from "./styles";

export function Field({
  label,
  children,
  hint,
  added,
  required,
}: {
  label: string;
  children: ReactNode;
  hint?: ReactNode;
  added?: boolean;
  required?: boolean;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.fieldLabel}>
        {label}
        {required && <span aria-hidden="true"> *</span>}
        {added !== undefined && <span className={added ? styles.added : styles.missing}>{added ? "Added" : "Required"}</span>}
      </span>
      {children}
      {hint && <span className={styles.hint}>{hint}</span>}
    </label>
  );
}
export function Select({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: readonly string[];
  onChange: (_value: string) => void;
}) {
  return (
    <Field label={label}>
      <select aria-label={label} value={value || ""} onChange={(event) => onChange(event.target.value)}>
        <option value="">Select {label.toLowerCase()}</option>
        {options.map((value) => (
          <option value={value} key={value}>
            {value.replace(/_/g, " ")}
          </option>
        ))}
      </select>
    </Field>
  );
}
export function Icon({ name }: { name: "copy" | "delete" | "paste" | "sheet" | "plus" | "close" | "image" | "microphone" }) {
  const paths = {
    microphone: "M9 5a3 3 0 016 0v7a3 3 0 01-6 0z M5 10v2a7 7 0 0014 0v-2 M12 19v3 M8 22h8",
    copy: "M8 8h11v12H8z M5 16H3V3h12v2",
    delete: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
    paste: "M9 4H5v17h14V4h-4 M9 2h6v5H9z",
    sheet: "M3 3h18v18H3z M3 9h18 M3 15h18 M9 3v18",
    image: "M3 3h18v18H3z M3 17l5-5 4 4 4-6 5 7 M8 7h.01",
    plus: "M12 4v16 M4 12h16",
    close: "M5 5l14 14 M19 5L5 19",
  };
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={paths[name]} />
    </svg>
  );
}
