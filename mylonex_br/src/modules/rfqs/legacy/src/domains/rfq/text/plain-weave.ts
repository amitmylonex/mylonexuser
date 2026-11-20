import { detectWovenWeaves } from "../weave/detect.js";
import type { WeaveDetection } from "../weave/vocabulary.js";
import type { TextAnalysis } from "./analysis.js";
import { negatedWeaveRanges } from "../weave/negation.js";
import { clauseAt } from "../weave/context.js";

const otherRoles = new Set(["pattern", "motif", "print", "printing", "finish", "yarn", "shade", "colour", "color", "embroidery"]);
export function classifyPlainWeaves(analysis: TextAnalysis): WeaveDetection {
  // Count claims can include descriptive words. Protect their numeric tokens,
  // while leaving neighbouring weave wording visible to the shared detector.
  const remaining = analysis.text.split("").map((char, index) => {
    const span = analysis.span(index, index + 1);
    const claims = analysis.claims.filter(item => item.start < span.end && item.end > span.start);
    if (!claims.length) return char;
    const token = analysis.tokens.find(item => item.start <= index && index < item.end);
    const attachedUnit = token?.kind === "word" && /\d/.test(analysis.text[token.start - 1] || "");
    if (claims.every(item => item.field === "count" || item.field === "fabricState" || item.field === "state" || item.field === "dyeMethod") && !attachedUnit && /[\p{L}\s\p{Dash_Punctuation}/]/u.test(char)) return char;
    return char === "\n" ? char : ";";
  }).join("");
  const detection = detectWovenWeaves(remaining);
  const mentions = detection.mentions.filter(mention => {
    // "Quote the following woven quality" introduces an RFQ, not a weave.
    if (mention.status !== "recognized" && mention.cue === "woven") {
      const { start, end } = clauseAt(remaining, mention.start, mention.end);
      if (/\b(?:quote|offer|quotation)\b[^:;\n]*\bwoven\s+(?:quality|fabric|material|specification)\b/i.test(remaining.slice(start, end))) return false;
    }
    // A governing noun changes an alias's role; a distant state has its own claim.
    const next = analysis.tokens.find(token => token.start >= mention.end);
    const previous = analysis.tokens.filter(token => token.end <= mention.start).pop();
    if (previous && ["not", "no", "non", "without"].includes(previous.text)) return false;
    const clause = clauseAt(remaining, mention.start, mention.end);
    return !next || next.start >= clause.end || !otherRoles.has(next.text)
      || /^\s*[:=]/.test(analysis.text.slice(next.end)) || analysis.owned(next.start, next.end);
  }).map(mention => {
    const mapped = analysis.span(mention.start, mention.end);
    return { ...mention, ...mapped, matchedTerm: analysis.original.slice(mapped.start, mapped.end) };
  });
  for (const mention of mentions) analysis.claim({ field: "weave", kind: mention.status === "recognized" ? "explicit" : "unresolved",
    text: mention.matchedTerm, start: mention.start, end: mention.end,
    ...(mention.status !== "recognized" ? { reason: "Unknown weave wording needs buyer confirmation." } : {}) });
  const weaveRanges = negatedWeaveRanges(remaining).filter(range => {
    const textInRange = analysis.text.slice(range.start, range.end);
    return (detection.excludedMentions?.some(m => m.start >= range.start && m.end <= range.end) ?? false) ||
      /\b(?:twill|plain|satin|sateen|dobby|jacquard|oxford|chambray|poplin|drill|canvas|gabardine|ripstop|herringbone|matty|corduroy|denim|taffeta|georgette|chiffon)\b/i.test(textInRange);
  });
  for (const range of weaveRanges) analysis.claim(analysis.evidence({ ...range, field: "exclusion", text: "", kind: "explicit" }));
  return { originalText: analysis.original, mentions, excludedMentions: detection.excludedMentions };
}
