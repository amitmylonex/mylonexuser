import type { Evidence } from "./types.js";

const units: Record<string, string> = {
  metre: "m", metres: "m", meter: "m", meters: "m", mtr: "m", mtrs: "m", mts: "m",
  inch: "inches", ins: "inches", inchs: "inches", in: "inches",
  centimetre: "cm", centimetres: "cm", centimeter: "cm", centimeters: "cm", cms: "cm",
};
export type Span = { start: number; end: number };
export type Token = Span & { text: string; kind: "number" | "word" | "symbol" };

/** A normalized analysis document and a single ledger of primary phrase roles. */
export class TextAnalysis {
  readonly text: string;
  readonly starts: number[] = [];
  readonly ends: number[] = [];
  readonly tokens: Token[];
  readonly claims: Evidence[] = [];
  constructor(readonly original: string) {
    let normalized = "", offset = 0;
    for (const char of original) {
      const start = offset; offset += char.length;
      // Keep the inch symbol recognizable before NFKC expands it to two primes.
      const value = (char === "″" ? '"' : char.normalize("NFKC")).toLowerCase().replace(/[×*]/g, "x").replace(/[\p{Dash_Punctuation}−]/gu, "-")
        .replace(/[’‘]/g, "'").replace(/[^\S\n]/g, " ");
      for (const letter of value) {
        if (letter === " " && normalized.endsWith(" ")) { this.ends[this.ends.length - 1] = offset; continue; }
        normalized += letter;
        for (let index = 0; index < letter.length; index++) { this.starts.push(start); this.ends.push(offset); }
      }
    }
    // Unit spelling changes can change length; rebuild the offset map with them.
    const starts = [...this.starts], ends = [...this.ends];
    this.starts.length = 0; this.ends.length = 0;
    let cursor = 0, text = "";
    const append = (value: string, start: number, end: number, replacement = false) => {
      text += value;
      for (let i = 0; i < value.length; i++) {
        this.starts.push(starts[replacement ? start : start + i]);
        this.ends.push(ends[replacement ? end - 1 : start + i]);
      }
    };
    for (const match of normalized.matchAll(/[\p{L}]+/gu)) {
      append(normalized.slice(cursor, match.index), cursor, match.index!);
      const replacement = units[match[0]] && (match[0] !== "in" || /\d\s*$/.test(normalized.slice(0, match.index))) ? units[match[0]] : undefined;
      append(replacement || match[0], match.index!, match.index! + match[0].length, !!replacement);
      cursor = match.index! + match[0].length;
    }
    append(normalized.slice(cursor), cursor, normalized.length);
    this.text = text;
    // An attached x before a numeric yarn is an operator, including after a
    // descriptor ('20CCWx20CCW'), rather than part of the preceding word.
    this.tokens = [...text.matchAll(/\d+(?:\.\d+)?|[\p{L}]+?(?=x\d)|[\p{L}]+|[^\s]/gu)].map(match => ({ text: match[0], start: match.index!, end: match.index! + match[0].length,
      kind: /^\d/.test(match[0]) ? "number" : /\p{L}/u.test(match[0]) ? "word" : "symbol" }));
  }
  span(start: number, end: number): Span { return { start: this.starts[start], end: this.ends[end - 1] }; }
  phrase(start: number, end: number) { const span = this.span(start, end); return this.original.slice(span.start, span.end); }
  evidence(item: Evidence): Evidence {
    const span = this.span(item.start, item.end);
    return { ...item, ...span, text: this.original.slice(span.start, span.end) };
  }
  normalized(item: Evidence): Evidence {
    const start = this.ends.findIndex(offset => offset > item.start);
    const boundary = this.starts.findIndex(offset => offset >= item.end);
    const end = boundary < 0 ? this.text.length : boundary;
    return { ...item, start, end, text: this.text.slice(start, end) };
  }
  owned(start: number, end: number) {
    const span = this.span(start, end);
    return this.claims.some(item => item.start < span.end && item.end > span.start);
  }
  claim(item: Evidence, explicitRelatedRoles: readonly string[] = []) {
    const overlaps = this.claims.filter(existing => existing.start < item.end && existing.end > item.start);
    if (overlaps.some(existing => !explicitRelatedRoles.includes(existing.field))) return false;
    this.claims.push(item); return true;
  }
  /** Delimit owned phrases rather than erasing their semantic boundaries. */
  remaining(extra: Span[] = []) {
    return this.text.split("").map((char, index) => this.owned(index, index + 1) || extra.some(span => span.start <= index && index < span.end)
      ? char === "\n" ? char : ";" : char).join("");
  }
}
