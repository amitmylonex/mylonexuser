/** Interpret commas only inside one associated composition list. Equal component
 * counts establish source-order association; totals never select an interpretation. */
export function compositionAmounts(raw: string, count: number): { amounts: string[]; review?: string } {
  const normalized = raw.replace(/(\d)\s*[-+]\s*(?=\d)/g, "$1/");
  const tokens = [...normalized.matchAll(/[+-]?\d+(?:\.\d+)?(?:\s*%)?/g)];
  const value = (i: number) => tokens[i][0].replace(/\s|%/g, "");
  const original = tokens.map((_, i) => value(i));
  if (tokens.length === count) return { amounts: original };
  // Keep the search bounded for malformed or very long lists. No branch chooses
  // a customary recipe, valid total, or approximate association.
  if (tokens.length > count * 2 || count > 20) return { amounts: original };
  const interpretations: string[][] = [];
  function visit(index: number, amounts: string[]) {
    const remaining = tokens.length - index, slots = count - amounts.length;
    if (interpretations.length > 1 || slots < 0 || remaining < slots || remaining > slots * 2) return;
    if (index === tokens.length) { if (amounts.length === count) interpretations.push(amounts); return; }
    visit(index + 1, [...amounts, value(index)]);
    const left = tokens[index], right = tokens[index + 1];
    if (!right || /[%\.]/.test(left[0]) || !/^\d+$/.test(value(index + 1))) return;
    // A decimal comma has no internal whitespace and joins exactly two integer
    // pieces. Spaced commas retain their existing list-separator meaning.
    if (normalized.slice(left.index! + left[0].length, right.index) === "," && !/\s$/.test(left[0]))
      visit(index + 2, [...amounts, `${value(index)}.${value(index + 1)}`]);
  }
  visit(0, []);
  const onlyCommaSeparators = tokens.slice(1).every((token, i) => /^\s*,\s*$/.test(normalized.slice(tokens[i].index! + tokens[i][0].length, token.index)));
  if (interpretations.length === 1 && (!onlyCommaSeparators || tokens.filter(token => /%/.test(token[0])).length === count)) return { amounts: interpretations[0] };
  return { amounts: original, ...(interpretations.length ? { review: "Comma-separated amounts have ambiguous decimal or list interpretations; confirm the percentages." } : {}) };
}
