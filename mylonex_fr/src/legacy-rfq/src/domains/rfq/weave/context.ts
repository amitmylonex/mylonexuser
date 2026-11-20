import { normalizeTerm, termExpression, weaveVocabulary } from "./vocabulary";

const excludedLabels = /^(?:pattern|motif|print|embroidery|blend|composition|fib(?:er|re)|count|yarn(?: count)?|epi|ppi|gsm|weight|width|colou?r|shade|finish|treatment|state|fabric state|production cycle|end use|target|price|rate|budget|order|qty|quantity|correction|revision|update)\s*[:=]/i;
export function clauseAt(text: string, start: number, end: number) {
  const separators = [...text.matchAll(/[,;|\n]|[.!?](?=\s|$)|(?=\b(?:weave(?:\s+(?:type|detail|architecture|structure|pattern))?|pattern|motif|print|blend|composition|count|yarn|construction|gsm|weight|width|colou?r|shade|finish|treatment|fabric state|production cycle|end use|target(?: price)?|delivery|order qty|quantity|qty)\s*[:=])/gi)]
    .filter(match => match[0] || !/\bweave\s+$/i.test(text.slice(0, match.index)))
    .map(match => ({ index: match.index!, next: match.index! + match[0].length }));
  const before = separators.filter(item => item.index < start).pop();
  const after = separators.find(item => item.index >= end);
  return { start: before?.next ?? 0, end: after?.index ?? text.length };
}
export function excludedContext(clause: string) {
  const normalized = normalizeTerm(clause);
  return excludedLabels.test(normalized) || weaveVocabulary.avoidFalsePositives.excludedNonWovenCues
    .some(cue => termExpression(cue).test(normalized));
}
/** Short trade codes have meaning only in a stated weave field or noun phrase. */
export function explicitWeaveContext(text: string, start: number, end: number) {
  const bounds = clauseAt(text, start, end);
  const clause = text.slice(bounds.start, bounds.end).normalize("NFKC");
  const beforeInClause = text.slice(bounds.start, start);
  const beforeRecent = text.slice(Math.max(0, start - 40), start);
  const afterRecent = text.slice(end, Math.min(text.length, end + 30));

  const precededByWeave =
    /(?:^|[\s\p{Dash_Punctuation};,])(?:weave(?:\s+(?:type|detail|architecture|structure|pattern))?|structure)\s*(?:[:=\p{Dash_Punctuation}]|\s)\s*$/iu.test(beforeInClause) ||
    /(?:^|[\s\p{Dash_Punctuation};,])(?:weave(?:\s+(?:type|detail|architecture|structure|pattern))?|structure)\s*(?:[:=\p{Dash_Punctuation}]|\s)\s*$/iu.test(beforeRecent);

  const precededByProcessing =
    /(?:^|[\s\p{Dash_Punctuation};,])(?:yarn[-\s]dyed|piece[-\s]dyed|p[/]d|y[/]d|solid[-\s]dyed|top[-\s]dyed|greige|grey|rfd|printed)\s*$/iu.test(beforeInClause) ||
    /(?:^|[\s\p{Dash_Punctuation};,])(?:yarn[-\s]dyed|piece[-\s]dyed|p[/]d|y[/]d|solid[-\s]dyed|top[-\s]dyed|greige|grey|rfd|printed)\s*$/iu.test(beforeRecent);

  const followedByWeave = /^\s*(?:[:=\p{Dash_Punctuation}]\s*)?weave\b/iu.test(afterRecent);

  return precededByWeave || precededByProcessing || followedByWeave ||
    /^\s*(?:weave(?:\s+(?:type|detail|architecture|structure|pattern))?|structure)\s*[:=\p{Dash_Punctuation}\s]/iu.test(clause) ||
    /^\s+weave\b/i.test(text.slice(end));
}
export function nonWeaveUse(clause: string, start?: number, end?: number) {
  if (start !== undefined && end !== undefined) {
    const before = normalizeTerm(clause.slice(0, start)), after = normalizeTerm(clause.slice(end));
    if (/\b(?:printed?|printing|embroidered?|embroidery)\s*$/.test(before) || /^(?:finish(?:ed|ing)?|coating|print(?:ed|ing)?|motif|pattern|embroidery)\b/.test(after)) return true;
    return /^plain$/i.test(clause.slice(start, end)) && /^(?:colou?r|shade|blue|red|black|white|green|navy|grey|gray|pink|yellow|orange|purple|brown|beige|cream|khaki|olive|charcoal)\b/.test(after);
  }
  const text = normalizeTerm(clause);
  if (/\b(?:woven|weave)\b/.test(text)) return false;
  // A pattern that is explicitly printed or embroidered is not a woven weave structure.
  if (/\b(?:print(?:ed|ing)?|embroider(?:y|ed)?)\s+[a-z0-9/x-]+/i.test(text)) return true;
  if (/[a-z0-9/x-]+\s+(?:finish(?:ed)?|print(?:ed|ing)?|motif|embroidery)\b/i.test(text)) return true;
  // Explicit finish or colour label scopes
  if (/^(?:finish|treatment|colou?r|shade)\s*[:=]/i.test(text)) return true;
  // 'Plain' used as solid colour descriptor (e.g. 'plain blue', 'plain red')
  if (/\bplain\s+(?:colou?r|shade|blue|red|black|white|green|navy|grey|gray|pink|yellow|orange|purple|brown|beige|cream|khaki|olive|charcoal)\b/i.test(text)) return true;
  return false;
}

// These are field boundaries/noise, not an alternative weave vocabulary.
const otherSpec = /\b(?:cotton|polyester|poly|viscose|linen|nylon|silk|wool|modal|tencel|lycra|spandex|hemp|blend|composition|gsm|g\/m|width|inches|inch|metres?|meters?|count|construction|const|epi|ppi|denier|greige|rfd|dyed|printed|ready|stock|production|finish|silicone|blue|red|black|white|green|navy|beige|grey|gray|pink|yellow|orange|purple|brown|peach|soft|urgent|shirting|fabric|required|delivery|target|price|rate|budget|order|qty|quantity|correction|revised|revision|update|unchanged|replacing|replace|instead|ignore|earlier)\b/i;
export function meaningfulCandidate(text: string) {
  return !!text && text.length <= 100 && /\p{L}/u.test(text) &&
    !otherSpec.test(normalizeTerm(text)) && !/%|\b\d+\s*(?:gsm|cm|mm|m|in|s|den)\b|^[\d\s/x×.-]+$/i.test(text) &&
    !/^(?:hi|hello|dear|sir|madam|thanks|regards|fabric|type|pattern|construction|structure|woven|weave|unknown|unspecified|none|not known|required|width|unchanged|correction|revised|revision|update)\s*[:=]?$/i.test(text);
}
