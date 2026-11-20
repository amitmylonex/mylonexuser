import { TextAnalysis } from "./analysis";
import { technicalPhrases } from "./technical-phrases";
import { detectWovenWeaves } from "../weave/detect";
import { FIBRE_PATTERN } from "./fibres";
import { isShared, isRevisionPassage, type TextGroup } from "./grouping";

const ENTRY_LABEL = /^[ \t]*(?:(?:[a-z]|\d+)[.)](?=[ \t\r\n]|$)|(?:also[ \t]+(?:need|require)[ \t]+)?fabric[ \t]+\d+(?:[ \t]+\(req[ \t]*#[ \t]*\d+\))?(?:[.):]|[ \t]*[-–—])?(?=[ \t\r\n]|$))[ \t]*/i;
const OPTION_LABEL = /^[ \t]*option[ \t]+\d+\b/i;
const PREFIXED_ENTRY_LABEL = /^[ \t]*also[ \t]+(?:need|require)[ \t]+(?:(?:a[ \t]+)?separate[ \t]+)?[a-z][.)](?=[ \t\r\n]|$)[ \t]*/i;
const NAMED_ENTRY_LABEL = /^[ \t]*(?:(?:first|second|third|fourth|next|another|one more)\s+(?:fabric|quality)|(?:fabric|quality)\s+[a-z])\s*[:=–—-][ \t]*/i;
export function entryLabel(text: string) {
  return text.match(ENTRY_LABEL) ?? text.match(PREFIXED_ENTRY_LABEL) ?? text.match(NAMED_ENTRY_LABEL);
}

function hasFabricBefore(text: string) {
  if (/\boption\s+1\s*:.*\boption\s+2\s*:/i.test(text)) return true;
  const fibre = new RegExp(`\\b(?:${FIBRE_PATTERN})\\b`, "i");
  return fibre.test(text) && detectWovenWeaves(text).mentions.some(mention => mention.status === "recognized");
}

/** Recognize a whole specification block, not isolated continuation fields. */
function startsSpecification(block: string) {
  if (isRevisionPassage(block)) return undefined;
  const firstLine = block.split(/\r?\n/)[0].trim();
  if (!firstLine || OPTION_LABEL.test(firstLine)) return undefined;
  const analysis = new TextAnalysis(block);
  const phrases = technicalPhrases(analysis);
  const first = analysis.tokens[0]?.start;
  if (phrases.groups.some(group => group.count.start === first)) return "technical";
  const richCount = phrases.candidates.find(item => item.field === "count" && item.priority === "pattern" && item.start === first);
  if (richCount && (phrases.pairs.some(pair => pair.start >= richCount.end) || phrases.candidates.some(item => item.field === "construction"))) return "technical";
  const fibreStart = new RegExp(`^(?:(?:need|require)\\s+)?(?:\\d+(?:\\.\\d+)?%\\s*)?(?:${FIBRE_PATTERN})\\b`, "i");
  return fibreStart.test(firstLine) && detectWovenWeaves(firstLine, ["matty"]).mentions.length > 0 ? "named" : undefined;
}

/** Hard entry boundaries are established BEFORE field extraction or OPTION scope.
 * Undefined delegates messages without structural boundaries to existing grouping.
 * Source is retained in contiguous slices; only explicitly shared lines may be copied. */
export function splitPlainEntries(text: string, copyShared = true): TextGroup[] | undefined {
  const rows = text.match(/[^\n]*(?:\n|$)/g)?.filter(Boolean) || [];
  const boundaries = [0];
  const shared: { start: number; end: number; source: string }[] = [];
  let offset = 0, blankBefore = false, activeFabric = false, structural = false;
  for (const row of rows) {
    if (!row.trim()) { blankBefore = true; offset += row.length; continue; }
    const label = entryLabel(row);
    const option = OPTION_LABEL.test(row);
    if (!option && isShared(row)) shared.push({ start: offset, end: offset + row.length, source: row });
    const specification = !option && (offset === 0 || blankBefore) ? startsSpecification(text.slice(offset).split(/\r?\n[\t ]*\r?\n/)[0]) : undefined;
    // A new explicit header always ends the previous OPTION section. An OPTION
    // header never starts a fabric, even after a blank line or a full spec inside it.
    if (option) structural = true;
    else if (label || specification) {
      if (offset > boundaries[boundaries.length - 1]
        && (activeFabric || (label && hasFabricBefore(text.slice(0, offset))))) {
        boundaries.push(offset);
        structural = true;
      }
      activeFabric = true;
      if (label || specification === "technical") structural = true;
    }
    blankBefore = false;
    offset += row.length;
  }
  if (!structural) return undefined;
  if (boundaries.length > 1 && boundaries.length !== 2 && shared.some(item => /\bboth\b/i.test(item.source)))
    throw new Error("“Both fabrics” needs exactly two identified fabrics. Clarify the shared scope in your source before reading it again.");
  return boundaries.map((start, index) => {
    const end = boundaries[index + 1] ?? text.length;
    const additions = copyShared && boundaries.length > 1 ? shared.filter(item => item.start < start || item.end > end).map(item => item.source) : [];
    const warnings: string[] = [];
    if (boundaries.length > 1 && index === boundaries.length - 1) {
      const slice = text.slice(start, end);
      const paragraphs = slice.split(/\n[\t ]*\n+/).filter(Boolean);
      const lastP = paragraphs[paragraphs.length - 1];
      if (paragraphs.length > 1 && isRevisionPassage(lastP) && !/\b(?:for\s+[a-z0-9]|fabric\s+[a-z0-9]|[a-z0-9]\s*[:=-])\b/i.test(lastP)) {
        warnings.push("Ambiguous revision target across multiple fabrics; clarify which fabric the update applies to.");
      }
    }
    return { source: text.slice(start, end) + (additions.length ? `\n${additions.join("")}` : ""), warnings };
  });
}
