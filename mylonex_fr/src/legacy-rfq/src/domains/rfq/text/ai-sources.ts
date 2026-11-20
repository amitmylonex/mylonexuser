import { aiExtractionSchema } from "./ai-schema";
import { sourceSpan, normalize } from "./ai-grounding";
import { splitPlainEntries } from "./plain-grouping";

export class TextGroupingConflict extends Error {
  constructor() { super("AI and local fabric boundaries disagree. Local extraction used; review grouping. Fields from different entries were not combined."); }
}
/** Locate by literal source spans, never by the position of an AI array item. */
export function groundAiSources(input: string, raw: unknown) {
  const parsed = aiExtractionSchema.parse(raw);
  const used: { start: number; end: number }[] = [];
  const positioned = parsed.fabrics.map(fabric => {
    let start = input.indexOf(fabric.source);
    while (start >= 0 && used.some(span => span.start < start + fabric.source.length && start < span.end)) start = input.indexOf(fabric.source, start + 1);
    if (start < 0) throw new Error("AI omitted or rewrote source text.");
    const end = start + fabric.source.length; used.push({ start, end });
    return { fabric, start, end };
  }).sort((a, b) => a.start - b.start);
  let cursor = 0;
  for (const item of positioned) {
    if (input.slice(cursor, item.start).trim()) throw new Error("AI omitted source text.");
    item.fabric.source = input.slice(cursor, item.end); cursor = item.end;
  }
  if (input.slice(cursor).trim()) throw new Error("AI omitted source text.");
  positioned[positioned.length - 1].fabric.source += input.slice(cursor);
  const fabrics = positioned.map(item => item.fabric);
  const hard = splitPlainEntries(input, false);
  if (hard && (hard.length !== fabrics.length || hard.some((entry, index) => normalize(entry.source) !== normalize(fabrics[index].source)))) throw new TextGroupingConflict();
  for (const fabric of fabrics) {
    for (const field of fabric.fields) for (const phrase of field.sourcePhrases) sourceSpan(fabric.source, phrase);
    for (const alternative of fabric.alternatives) sourceSpan(fabric.source, alternative);
    for (const yarn of fabric.yarns) sourceSpan(fabric.source, yarn.source);
    for (const issue of fabric.issues) sourceSpan(fabric.source, issue.source);
  }
  return { fabrics };
}
