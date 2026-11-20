import { TextAnalysis } from "./analysis.js";

export const YARN_UNITS = new Set(["s", "d", "denier", "nm", "ne", "pc"]);
export function canonicalCountNotation(value: string) {
  const analysis = new TextAnalysis(value);
  const quotes = analysis.tokens.filter((token, index, tokens) => token.text === "'" && tokens[index - 1]?.kind === "number" && YARN_UNITS.has(tokens[index + 1]?.text));
  const spans = quotes.map(token => analysis.span(token.start, token.end));
  return [...value].filter((_char, index) => !spans.some(span => span.start <= index && index < span.end)).join("");
}
const boundaries = new Set(["x", "by", "count", "construction", "const", "density", "weave", "width", "gsm", "quantity", "order", "qty", "warp", "weft", "epi", "ppi", "option", "finish", "colour", "color", "price", "delivery", "target"]);
/** One yarn atom, followed by descriptors and balanced specification groups.
 * A slash between words belongs to a yarn system; a slash before numbers ends it.
 * Composition is retained as source, separately from the canonical count atom. */
export function readYarn(analysis: TextAnalysis, index: number, ply: boolean, descriptors = false) {
  const tokens = analysis.tokens, token = (i: number) => tokens[i]?.text;
  if (tokens[index]?.kind !== "number") return undefined;
  let end = index + 1, units = false;
  if (ply && token(end) === "/" && tokens[end + 1]?.kind === "number") end += 2;
  if (token(end) === "'") end++;
  if (YARN_UNITS.has(token(end))) { units = true; end++; }
  // A filament atom can continue after its yarn unit: 80D/72/2. Stop
  // before a new typed yarn or an EPI/PPI pair, rather than at every slash.
  const typedAt = (start: number) => {
    if (tokens[start]?.kind !== "number") return false;
    let cursor = start + 1;
    if (token(cursor) === "/" && tokens[cursor + 1]?.kind === "number") cursor += 2;
    if (token(cursor) === "'") cursor++;
    return YARN_UNITS.has(token(cursor));
  };
  if (units) while (token(end) === "/" && tokens[end + 1]?.kind === "number") {
    const densityFollows = ["x", "by"].includes(token(end + 2)) && tokens[end + 3]?.kind === "number" && !typedAt(end + 3);
    if (typedAt(end + 1) || densityFollows) break;
    end += 2;
  }
  const atomEnd = end;
  let compositionStart: number | undefined;
  if (descriptors) {
    while (end < tokens.length) {
      const gap = analysis.text.slice(tokens[end - 1].end, tokens[end].start);
      if (/\n/.test(gap) && /^(?:non|dyed|greige|rfd|printed|ready|need|require)$/.test(token(end))) break;
      if (tokens[end].kind === "word" && !boundaries.has(token(end))) {
        if (/^[pcv]$/.test(token(end)) && token(end + 1) === "/" && /^[pcv]$/.test(token(end + 2))) compositionStart ??= end;
        end++; continue;
      }
      if (token(end) === "/" && tokens[end - 1]?.kind === "word" && tokens[end + 1]?.kind === "word" && !boundaries.has(token(end + 1))) { end += 2; continue; }
      if (token(end) === "(") {
        let cursor = end + 1, depth = 1;
        while (cursor < tokens.length && depth && token(cursor) !== "\n") {
          if (token(cursor) === "(") depth++;
          if (token(cursor) === ")") depth--;
          cursor++;
        }
        if (depth) break;
        end = cursor; continue;
      }
      break;
    }
  }
  if (token(end) === "+" && tokens[end + 1]?.kind === "number" && token(end + 2) === "d") end += 3;
  const source = analysis.phrase(tokens[index].start, tokens[end - 1].end);
  const directionalBlend = /\b[PCV]\s*\/\s*[PCV]\s*\(/i.test(source);
  const value = directionalBlend ? analysis.phrase(tokens[index].start, tokens[(compositionStart ?? atomEnd) - 1].end).replace(/[’'‘]/g, "") : source;
  return { end, units, value, source, directionalBlend, descriptors: end > atomEnd };
}
