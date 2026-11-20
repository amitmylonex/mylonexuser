/** Clause-local intent checks. Never rewrite the buyer's source or its offsets. */
export function inactiveMention(text: string, start: number, end: number): boolean {
  const before = text.slice(0, start).split(/[;,\n!?]|\.(?=\s|$)/).pop()!;
  const after = text.slice(end).split(/[;,\n!?]|\.(?=\s|$)/)[0];
  const temporalAfter = after.split(/\b(?:for\s+(?:dyeing|printing)|to\s+be\s+(?:dyed|printed|washed|coated))\b/i)[0];
  if (/\bdo not (?:remove|omit|skip|drop|delete)\b/i.test(before)) return false;
  return /\b(?:no|not|without|never|neither|avoid|excluding|exclude|non[- ]?)\b[^;,.\n]*$/i.test(before)
    || /\b(?:later|future|after\s+(?:approval|delivery|purchase)|optional|optionally)\b/i.test(before + " " + temporalAfter)
    || /\b(?:for\s+(?:dyeing|printing)|to\s+be\s+(?:dyed|printed|washed|coated)|will\s+(?:dye|print|wash|coat))\b/i.test(before)
    || /^\s*(?:[- ]free|not\s+(?:required|wanted))\b/i.test(after);
}

/** RS adjacent to a yarn count/label is ring spun; quote-width + RS retains
 * MyloNex's established ready-stock shorthand. */
export function ringSpunCode(text: string, start: number, end: number): boolean {
  return /\b(?:yarn|spinning)\s*[:=]?\s*$|\b\d+(?:['’]?s|ne)?\s*$/i.test(text.slice(Math.max(0, start - 30), start))
    || /^\s*(?:yarn|spun)\b/i.test(text.slice(end));
}
