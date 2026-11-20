import { conflictingWeaves, findExplanatoryWeaves, findWeaveAlternatives, weaveDisplay } from "../../../../../src/domains/rfq/weave/phrases";
import type { RfqLine } from "./draft";

/** Selection never infers a ground weave from a fabric name or pattern. */
export function applyWeaveSelection(line: RfqLine) {
  const mentions = line.weaveDetection?.mentions || [];
  const excludedMentions = line.weaveDetection?.excludedMentions || [];

  if (excludedMentions.length > 0) {
    const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    const uniqueExclusions = Array.from(new Set(
      excludedMentions
        .filter(m => m.status === "recognized")
        .map(m => titleCase(m.matchedTerm.replace(/\s+weave$/i, "")))
    ));
    if (uniqueExclusions.length > 0) {
      line.weaveExclusions = uniqueExclusions;
      const exclNote = `Weave exclusion: No ${uniqueExclusions.join(", ")}.`;
      if (!line.draft.additionalSpecs?.includes(exclNote)) {
        line.draft.additionalSpecs = [line.draft.additionalSpecs, exclNote].filter(Boolean).join("\n");
      }
    }
  }

  const { explanatoryIndices, pairs } = findExplanatoryWeaves(line.original, mentions);
  if (pairs.length > 0) {
    line.weaveNotes = pairs.map(p => p.note);
    for (const pair of pairs) {
      if (!line.draft.additionalSpecs?.includes(pair.note)) {
        line.draft.additionalSpecs = [line.draft.additionalSpecs, pair.note].filter(Boolean).join("\n");
      }
    }
  }

  const activeMentions = mentions.filter((_, idx) => !explanatoryIndices.has(idx));

  const alternatives = findWeaveAlternatives(line.original, activeMentions);
  if (alternatives && alternatives.length > 1) {
    line.weaveAlternatives = alternatives;
    line.draft.weaveType = undefined;
    line.warnings.push(`Weave alternatives awaiting selection: ${alternatives.join(" or ")}.`);
    return;
  }

  // "Denim fabric" identifies the article when the same entry supplies an
  // explicit twill repeat. The article remains in the weave evidence/notes.
  const denimArticle = line.plainTextSource && activeMentions.length === 2
    && activeMentions.every(mention => mention.status === "recognized")
    && activeMentions.some(mention => /^denim$/i.test(mention.matchedTerm)
      && /^\s+fabric\b/i.test(line.original.slice(mention.end)))
    && activeMentions.some(mention => /^\d+\s*\/\s*\d+\s+(?:twill|twl)\b/i.test(mention.matchedTerm))
    && !/\b(?:or|alternatively|versus|vs)\b/i.test(line.original);
  if (!denimArticle && conflictingWeaves(line.original, mentions)) {
    line.warnings.push("Several conflicting weave mentions were detected. Confirm the intended weave; none was chosen.");
    return;
  }

  const best = activeMentions.filter(mention => !denimArticle || !/^denim$/i.test(mention.matchedTerm)).sort((a, b) => Number(b.status === "recognized") - Number(a.status === "recognized") ||
    Number(/\d\s*[/x×]\s*\d/.test(b.matchedTerm)) - Number(/\d\s*[/x×]\s*\d/.test(a.matchedTerm)) || b.matchedTerm.length - a.matchedTerm.length)[0];
  if (best?.status === "recognized") line.draft.weaveType = weaveDisplay(best.matchedTerm.replace(/\s+weave$/i, ""));
  else if (best) line.weaveDetail = best.matchedTerm;
  for (const mention of activeMentions) {
    if (mention.status !== "recognized") line.warnings.push(`Review unknown weave wording “${mention.matchedTerm}”; it is not automatically confirmed as a weave.`);
  }
}
