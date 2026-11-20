import { BLEND_CODES, BLEND_CODE_PATTERN, FIBRE_PATTERN } from "./fibres.js";
import { FIBRE_MODIFIERS_PATTERN, resolveFibreCandidate } from "./composition-attributes.js";
import { compositionNumberScope } from "./composition-number-scope.js";
import { compositionAmounts } from "./composition-amounts.js";

export type CompositionComponent = ReturnType<typeof resolveFibreCandidate> & { percentage: string };
type FibreList = { start: number; end: number; components: ReturnType<typeof resolveFibreCandidate>[] };
export type OrderedComposition = { start: number; end: number; components: CompositionComponent[]; review?: string; percentSigns: boolean };
const separators = /^(?:[\s/,:+\-()[\]]|\band\b)*$/i;
const connector = /^(?:[\s/,:=+\-()[\]]|\b(?:composition|content|blend|ratio|fibres|fibers)\b)*$/i;
const number = "[+-]?\\d+(?:\\.\\d+)?";
const numericList = new RegExp(`(?<![\\p{L}\\p{N}_./])${number}\\s*%?(?:(?:\\s*[/,:+\\-]\\s*|[ \\t\\n]+)${number}\\s*%?)+(?![\\p{L}\\p{N}_%]|\\.\\d)(?!\\s*[/,:+\\-]\\s*[+-]?\\d)`, "giu");
const otherRole = /\b(?:count|yarn|construction|density|weave|twill|drill|width|gsm|weight|quantity|qty|price|target|article|reference|date)\s*[:=]?\s*$/i;
const otherUnit = /^\s*(?:gsm\b|g\/m\b|inch(?:es)?\b|cm\b|mtrs?\b|metres?\b|meters?\b|['’]?s\b|d\b|x\b|×)/i;

/** A rule within the shared composition grammar: lists must be directly linked
 * by composition syntax. No searching across fields, paragraphs or yarn x. */
export function orderedCompositions(text: string): OrderedComposition[] {
  // Serialized row strings and ordinary percent/fibre pairs have no adjacent
  // numeric list. Avoid rebuilding the list grammar for every editor render.
  if (!/\d(?:\.\d+)?\s*%?(?:\s*[/,:+\-]\s*|[ \t\n]+)[+-]?\d/.test(text)) return [];
  const lists: FibreList[] = [];
  for (const match of text.matchAll(new RegExp(`(?<![\\p{L}\\p{N}_])(${FIBRE_MODIFIERS_PATTERN})(${FIBRE_PATTERN})(?![\\p{L}_])`, "giu"))) {
    const item = resolveFibreCandidate(match[2], match[1]);
    const previous = lists.at(-1), start = match.index!, end = start + match[0].length;
    const gap = previous ? text.slice(previous.end, start) : "";
    if (previous && separators.test(gap) && !/\n\s*\n/.test(gap)) { previous.end = end; previous.components.push(item); }
    else lists.push({ start, end, components: [item] });
  }
  for (const match of text.matchAll(new RegExp(`\\b(?:${BLEND_CODE_PATTERN})\\b`, "gi"))) {
    const key = match[0].replace(/[\s/]/g, "").toLowerCase();
    if (BLEND_CODES[key]) lists.push({ start: match.index!, end: match.index! + match[0].length, components: BLEND_CODES[key].map(name => resolveFibreCandidate(name)) });
  }
  if (!lists.some(list => list.components.length >= 2)) return [];
  const ratios = [...compositionNumberScope(text).matchAll(numericList)].filter(match => {
    if (/\n\s*\n/.test(match[0])) return false;
    const prefix = text.slice(0, match.index!).split(/[;\n]|[.!?](?=\s)/).pop()!;
    const tail = text.slice(match.index! + match[0].length);
    const values = match[0].match(/\d+(?:\.\d+)?/g)!;
    const weave = values.every(value => Number(value) <= 8) && /^\s*(?:twill|drill|matty|matt)\b/i.test(tail);
    return !weave && !otherRole.test(prefix) && !otherUnit.test(tail);
  });
  const found: OrderedComposition[] = [];
  for (const list of lists.filter(list => list.components.length >= 2)) {
    for (const ratio of ratios) {
      const ratioStart = ratio.index!, ratioEnd = ratioStart + ratio[0].trimEnd().length;
      if (ratioStart < list.end && list.start < ratioEnd) continue;
      const gap = ratioEnd <= list.start ? text.slice(ratioEnd, list.start) : text.slice(list.end, ratioStart);
      if (!connector.test(gap) || /\n\s*\n/.test(gap)) continue;
      const start = Math.min(list.start, ratioStart);
      let end = Math.max(list.end, ratioEnd);
      const interpretation = compositionAmounts(ratio[0], list.components.length);
      const amounts = interpretation.amounts;
      const percentSigns = /%/.test(ratio[0]);
      const tail = text.slice(end).split(/[;\n]|[.!?](?=\s)/)[0];
      const prefix = text.slice(0, start);
      const alternative = /^\s*[)\]]?\s*or\b/i.test(tail) || /\bor\s*[(\[]?\s*$/i.test(prefix);
      if (alternative) end += tail.match(/^\s*or\s*[\d\s/,:+()%.-]+/)?.[0].trimEnd().length || 0;
      const unknown = /^\s*[/+-]\s*[\p{L}]/u.test(text.slice(list.end)) && ratioStart < list.start;
      const leadingUnknown = /[\p{L}][\p{L}-]*\s*\/\s*$/u.test(text.slice(0, list.start));
      const percentageLike = percentSigns || amounts.some(value => Number(value) > 8) || amounts.reduce((sum, value) => sum + Number(value), 0) === 100;
      const review = alternative ? "Alternative composition ratios need buyer selection."
        : interpretation.review ? interpretation.review
        : amounts.length !== list.components.length || unknown || leadingUnknown ? "Fibre and percentage lists do not establish a complete one-to-one association."
        : !percentageLike ? "A non-percentage ratio was retained for review; percentages were not calculated."
        : amounts.some(value => !/^\d+(?:\.\d+)?$/.test(value) || Number(value) > 100) ? "Invalid individual composition percentages need review." : undefined;
      found.push({ start, end, percentSigns, review, components: list.components.map((component, index) => ({ ...component, percentage: amounts[index] || "" })) });
    }
  }
  return found.sort((a, b) => a.start - b.start);
}
