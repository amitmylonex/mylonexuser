import { detectWovenWeaves } from "../weave/detect.js";

/** Protect explicit neighbouring numeric roles before scanning composition lists.
 * Delimit rather than delete, so original offsets and comma-separated blends survive. */
export function compositionNumberScope(text: string): string {
  const ranges = detectWovenWeaves(text).mentions
    .filter(mention => mention.status === "recognized" && /\d/.test(mention.matchedTerm))
    .map(({ start, end }) => ({ start, end }));
  for (const match of text.matchAll(/\b(?:count|yarn(?: count)?|construction|density)\s*[:=]?\s*\d+(?:\.\d+)?(?:\s*[/x×]\s*\d+(?:\.\d+)?)?/gi))
    ranges.push({ start: match.index!, end: match.index! + match[0].length });
  for (const match of text.matchAll(/\b\d+(?:\.\d+)?\s*(?:['’]?s\b|oe\b|d\b|gsm\b|g\/m|inches?\b|cm\b|mtrs?\b|metres?\b|meters?\b|["″])(?:\s*[x×]\s*\d+(?:\.\d+)?\s*(?:['’]?s\b|oe\b|d\b)?)?|\b\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?\b/gi)) {
    ranges.push({ start: match.index!, end: match.index! + match[0].length });
  }
  const protectedRanges = ranges.filter(({ start }) => !start || /[\s,;([=:]/.test(text[start - 1]));
  return text.split("").map((char, index) => protectedRanges.some(range => range.start <= index && index < range.end)
    ? char === "\n" ? char : ";" : char).join("");
}
