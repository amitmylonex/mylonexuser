import { z } from "zod";
import { FIBRE_PATTERN } from "./fibres";
import { detectWovenWeaves } from "../weave/detect";
export const MAX_TEXT = 32000;
export const textInputSchema = z.object({ text: z.string().min(1).max(MAX_TEXT).refine(value => !!value.trim()), useAI: z.boolean().default(false) }).strict();
export type Segment = { id: number; text: string; start: number; end: number };
export type TextGroup = { source: string; warnings: string[] };

export function segmentText(text: string): Segment[] {
  // Sentence/newline boundaries are source segments, NOT fabric boundaries.
  const values: Segment[] = [];
  const breaks = /[.!?](?=\s|$)|\n|(?=\b(?:also need|another fabric|additionally need|next fabric)\b)|(?=^\s*(?:[1-9]|1\d|20)[.)]\s+)/gim;
  let start = 0;
  for (const match of text.matchAll(breaks)) {
    const end = match.index! + (match[0] ? match[0].length : 0);
    if (end <= start) continue;
    // Do not split on abbreviation periods like G.S.M. or e.g.
    if (match[0] && /[.!?]/.test(match[0])) {
      const beforeMatch = text.slice(0, end);
      if (/\b(?:[a-zA-Z]\.){2,}$/i.test(beforeMatch)) continue;
    }
    const value = text.slice(start, end);
    if (value.trim()) values.push({ id: values.length, text: value, start, end });
    else if (values.length) { values[values.length - 1].text += value; values[values.length - 1].end = end; }
    start = end;
  }
  if (text.slice(start).trim()) values.push({ id: values.length, text: text.slice(start), start, end: text.length });
  else if (values.length) { values[values.length - 1].text += text.slice(start); values[values.length - 1].end = text.length; }
  return values;
}
export const isShared = (text: string) =>
  (/^\s*(?:both\s+(?:fabrics?|qualities)|all(?: (?:these|the))? (?:fabrics|qualities)|each (?:fabric|quality))\b|\b(?:both|all|each)\s+(?:fabrics?|qualities)\b|\bfor\s+both(?:\s+(?:fabrics?|qualities))?\b/i.test(text))
  && !/\bboth\s+(?:yarns?|warp|weft|sides?|faces?|colours?|colors?)\b/i.test(text);
const usesBoth = (text: string) => /\bboth\s+fabrics?\b|\bfor\s+both(?:\s+fabrics?)?\b/i.test(text);

export function isRevisionPassage(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  if (/^\s*(?:(?:fabric\s+)?(?:[a-z]|\d+)[.)]|(?:another|next|second|third|new)\s+fabric|separate\s+quality)\b/i.test(trimmed)) {
    return false;
  }
  if (/^\s*(?:correction|update|revision|amendment|changes?|revised(?:\s+specs?|\s+specifications?|\s+details?)?)\s*[:=-]/i.test(trimmed)) {
    return true;
  }
  return /\b(?:should be\s+[^,\n]+,\s*(?:not|instead of)|replac(?:ing|e)\s+\d+|ignore(?: the)? earlier|final\s+(?:order\s+)?quantity|revised\s+(?:target|price|gsm|qty|quantity|width)|(?:width|construction|specs?|specifications?|details?)\s+unchanged|other specifications unchanged|no change in|change\s+(?:gsm|quantity|width|count|construction)\s+to)\b/i.test(trimmed);
}

function fabricStart(text: string) {
  if (isRevisionPassage(text)) return false;
  const completeSpecs = /\bgsm\b/i.test(text) && /\d\s*(?:inches|inch|cm|["″”])/i.test(text);
  return new RegExp(`\\b(?:${FIBRE_PATTERN})\\b`, "i").test(text) &&
    (completeSpecs || (!/^\s*(?:width|quantity|gsm|count|colour|color|finish|composition|blend)\b/i.test(text) &&
      (detectWovenWeaves(text).mentions.length > 0 || /\bfabric\b/i.test(text))));
}
export function deterministicGroups(text: string): TextGroup[] {
  const paragraphs = text.split(/\n[\t ]*\n+/).filter(part => part.trim());
  const technical = (part: string) => (/\b(?:blend|composition|construction|const(?:ruction)?|gsm|weave|width|order\s*qty|quantity)\b/i.test(part)
    || /\bcontent\s*[-:=]/i.test(part)
    || /\b\d+(?:['’]?s|pc(?:s)?|[dD]|denier|Nm)\b[^\n]*[xX×]/i.test(part)
    || /^\s*\d+\s*[xX×]\s*\d+\s*$/m.test(part)) && !isRevisionPassage(part);
  const anchored = paragraphs.map(technical);
  if (paragraphs.length > 1 && anchored.filter(Boolean).length > 1) {
    const result: TextGroup[] = []; let prefix = "";
    for (let index = 0; index < paragraphs.length; index++) {
      if (!anchored[index] && !result.length) { prefix += `${paragraphs[index]}\n\n`; continue; }
      if (anchored[index]) result.push({ source: `${prefix}${paragraphs[index]}`, warnings: [] });
      else if (result.length) {
        const rev = paragraphs[index];
        const forB = /\b(?:for\s+b\s+only|for\s+second\s+fabric|fabric\s+b\b|b\s*[:=-])/i.test(rev);
        const forA = /\b(?:for\s+a\s+only|for\s+first\s+fabric|fabric\s+a\b|a\s*[:=-])/i.test(rev);
        if (forA && result.length >= 1) {
          result[0].source += `\n\n${rev}`;
        } else if (forB && result.length >= 2) {
          result[1].source += `\n\n${rev}`;
        } else if (result.length > 1 && isRevisionPassage(rev) && !forA && !forB) {
          result[result.length - 1].warnings.push("Ambiguous revision target across multiple fabrics; clarify which fabric the update applies to.");
          result[result.length - 1].source += `\n\n${rev}`;
        } else {
          result[result.length - 1].source += `\n\n${rev}`;
        }
      }
      prefix = "";
    }
    if (result.length > 1) return result;
  }
  const groups: TextGroup[] = [];
  const shared: string[] = [];
  for (const segment of segmentText(text)) {
    if (isShared(segment.text)) { shared.push(segment.text); continue; }
    const explicit = /^\s*(?:(?:[1-9]|1\d|20)[.)](?=\s|$)\s*|(?:also need|another fabric|additionally need|next fabric)\b)/i.test(segment.text);
    const newDescription = fabricStart(segment.text) && (groups.length === 0 ||
      (fabricStart(groups[groups.length - 1].source) && !/^\s*(?:it|this|the same|composition|blend|made of)\b/i.test(segment.text)));
    if (!groups.length || explicit || newDescription) groups.push({ source: segment.text, warnings: [] });
    else groups[groups.length - 1].source += segment.text;
  }
  if (!groups.length && shared.length) groups.push({ source: shared.join(""), warnings: ["Shared wording has no identified fabric. Review grouping."] });
  else if (shared.some(usesBoth) && groups.length !== 2)
    throw new Error("“Both fabrics” needs exactly two identified fabrics. Clarify the shared scope in your source before reading it again.");
  else for (const group of groups) if (shared.length) group.source += `\n${shared.join("\n")}`;
  return groups;
}

export const groupingResultSchema = z.object({ groups: z.array(z.object({ segmentIds: z.array(z.number().int().nonnegative()).min(1).max(400), uncertain: z.boolean() }).strict()).min(1).max(200), sharedIds: z.array(z.number().int().nonnegative()).max(400) }).strict();

export function reconcileGroups(text: string, raw: unknown): TextGroup[] {
  const parsed = groupingResultSchema.parse(raw);
  const segments = segmentText(text);
  const ids = parsed.groups.flatMap(group => group.segmentIds);
  const all = [...ids, ...parsed.sharedIds];
  if (new Set(all).size !== all.length || all.length !== segments.length || all.some(id => !segments[id])) throw new Error("Grouping omitted or repeated source passages.");
  if (parsed.sharedIds.some(id => !isShared(segments[id].text))) throw new Error("Shared scope is not explicit in source.");
  if (parsed.sharedIds.some(id => usesBoth(segments[id].text)) && parsed.groups.length !== 2) throw new Error("Both-fabric scope is ambiguous.");
  const shared = parsed.sharedIds.map(id => segments[id].text).join("\n");
  return parsed.groups.map(group => ({
    source: [...group.segmentIds].sort((a, b) => a - b).map(id => segments[id].text).join("") + (shared ? `\n${shared}` : ""),
    warnings: group.uncertain ? ["AI grouping is uncertain. Review source passages; merge or split before adding drafts."] : [],
  }));
}
