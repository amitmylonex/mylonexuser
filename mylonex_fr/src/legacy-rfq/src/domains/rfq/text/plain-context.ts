import { FIBRE_PATTERN } from "./fibres";
import { fibreKey } from "../blend/rows";
import type { TextAnalysis } from "./analysis";

export function exclusionPhrases(source: string) {
  return [
    ...source.matchAll(new RegExp(`\\b(?:non|no|not|without)\\s*[-–—]?\\s*(?:${FIBRE_PATTERN})\\b|\\b(?:${FIBRE_PATTERN})[ -]+free\\b`, "gi")),
    ...source.matchAll(/\b(?:non|no|not|without)\s+[-–—]?\s*(?:silicone|chemical|soft|peach|enzyme|water[- ]repellent|wrinkle[- ]resistant|easy[- ]care)\s+finish\b/gi)
  ];
}
export function positiveCompositionText(source: string) {
  const excluded = exclusionPhrases(source);
  return source.split("").map((char, index) => excluded.some(match => match.index! <= index && index < match.index! + match[0].length) ? " " : char).join("");
}
export function excludedFibres(source: string) {
  return exclusionPhrases(source).flatMap(match => [...match[0].matchAll(new RegExp(`\\b(${FIBRE_PATTERN})\\b`, "gi"))].map(fibre => fibreKey(fibre[1])));
}
export const finishValue = (value: string) => value.trim().replace(/\s+finish$/i, "").replace(/^./, char => char.toUpperCase());
/** These clauses are specifications, but never positive fibres, dates or prices. */
export function reservePlainContext(analysis: TextAnalysis) {
  const add = (field: string, matches: RegExpMatchArray[]) => {
    for (const match of matches) analysis.claim(analysis.evidence({ field, text: "", start: match.index!, end: match.index! + match[0].length, kind: "explicit" }));
  };
  add("exclusion", exclusionPhrases(analysis.text));
  add("colourCount", [...analysis.text.matchAll(/\b\d+\s+colou?rs\b/gi)]);
  add("quotationRequest", [...analysis.text.matchAll(/\b(?:need|please\s+(?:send|share)|send|share|quote|request)\s+(?:the\s+)?(?:price|pricing|quotation)(?:\s+(?:n|and|&)\s+delivery(?:\s+(?:information|details))?)?\b/gi)]);
}
