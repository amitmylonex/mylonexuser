"use client";
import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { FIBRE_SUGGESTIONS } from "../../../../../src/domains/rfq/blend/rows";
import styles from "./styles";

const normalise = (value: string) => value.normalize("NFKC").toLocaleLowerCase().trim();

export default function FibreCombobox({
  id, label, value, invalid, onChange, inputRef,
}: {
  id: string;
  label: string;
  value: string;
  invalid?: boolean;
  onChange: (_value: string) => void;
  inputRef: (_element: HTMLInputElement | null) => void;
}) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const suggestions = useMemo(() => {
    const query = normalise(value);
    return query ? FIBRE_SUGGESTIONS.filter((item) => normalise(item).includes(query)) : [];
  }, [value]);
  const showSuggestions = open && suggestions.length > 0;
  const choose = (suggestion: string) => { onChange(suggestion); setOpen(false); setActive(-1); };
  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") { setOpen(false); setActive(-1); return; }
    if (!suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault(); setOpen(true); setActive((current) => (current + 1) % suggestions.length); return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault(); setOpen(true); setActive((current) => (current <= 0 ? suggestions.length - 1 : current - 1)); return;
    }
    if (event.key === "Enter" && showSuggestions && active >= 0) {
      event.preventDefault(); choose(suggestions[active]);
    }
  }
  return <div className={styles.fibreCombobox}>
    <input id={id} ref={inputRef} value={value} placeholder="Choose or type a fibre" autoComplete="off" aria-invalid={invalid || undefined}
      role="combobox" aria-autocomplete="list" aria-expanded={showSuggestions} aria-controls={showSuggestions ? listId : undefined}
      aria-activedescendant={showSuggestions && active >= 0 ? `${listId}-${active}` : undefined}
      onFocus={() => { if (suggestions.length) setOpen(true); }}
      onBlur={() => { setOpen(false); setActive(-1); }}
      onChange={(event) => { onChange(event.target.value); setOpen(true); setActive(-1); }} onKeyDown={onKeyDown} />
    {showSuggestions && <ul id={listId} role="listbox" aria-label={`${label} suggestions`} className={styles.fibreSuggestions}>
      {suggestions.map((suggestion, optionIndex) => <li id={`${listId}-${optionIndex}`} key={suggestion} role="option"
        aria-selected={optionIndex === active} className={optionIndex === active ? styles.fibreSuggestionActive : undefined}
        onMouseDown={(event) => event.preventDefault()} onClick={() => choose(suggestion)}>{suggestion}</li>)}
    </ul>}
  </div>;
}
