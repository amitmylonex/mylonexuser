import { FIBRES, FIBRE_PATTERN, normalizeFibre } from "./fibres.js";
import { FIBRE_MODIFIERS_PATTERN } from "./composition-attributes.js";
import type { TextFields } from "./types.js";

function oneEdit(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length <= b.length) j++;
    if (a.length >= b.length) i++;
  }
  return edits + Number(i < a.length || j < b.length) === 1;
}

/** Suggestions never establish a fibre or percentage. Unknown source stays
 * reviewable even when the recognized subset happens to total 100. */
export function reviewUnknownComposition(text: string, result: TextFields) {
  if (!result.blend && !/\b(?:composition|blend|content)\s*[:=]|\b(?:need|quote|require)\s+\d+(?:\.\d+)?\s*%\s*\p{L}/iu.test(text)) return;
  const names = Object.keys(FIBRES);
  for (const match of text.matchAll(new RegExp(`\\d+(?:\\.\\d+)?\\s*%\\s*(${FIBRE_MODIFIERS_PATTERN})([\\p{L}][\\p{L}\\p{N}.-]*)`, "giu"))) {
    const clause = text.slice(0, match.index!).split(/[;\n]|[.!?](?=\s)/).pop()! + match[0];
    if (/\b(?:price|discount|tax|gst|budget|target)\b/i.test(clause) && !/\b(?:composition|blend|content)\s*[:=]/i.test(clause)) continue;
    const value = match[2].replace(/\.+$/, "");
    if (new RegExp(`^(?:${FIBRE_PATTERN})(?![\\p{L}])`, "iu").test(value)) continue;
    const key = normalizeFibre(value);
    const suggestions = key.length >= 5 ? names.filter(name => oneEdit(key, normalizeFibre(name))) : [];
    const message = suggestions.length === 1 ? `Possible fibre ${suggestions[0]} for “${value}”; confirm the original wording.`
      : `Unrecognized fibre wording “${value}” needs review; no fibre identity was invented.`;
    result.compositionReview = match[0];
    result.warnings.push(message);
  }
}
