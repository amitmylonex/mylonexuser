import { normalizedSource, normalizeTerm, termExpression, weaveVocabulary, type WeaveDetection, type WeaveMention } from "./vocabulary";
import { clauseAt, excludedContext, explicitWeaveContext, meaningfulCandidate, nonWeaveUse } from "./context";
import { combineWeavePhrases, qualifyWeavePhrase } from "./phrases";
import { negatedWeaveRanges, negatedWeaveSpan } from "./negation";

const aliases: { family: string | undefined; term: string; expression: RegExp; contextual?: boolean }[] = weaveVocabulary.matching.aliasGroups.flatMap(group => group.terms.map(term => ({
  family: group.id, term, expression: termExpression(term),
})));
for (const [term, canonical] of Object.entries(weaveVocabulary.matching.aliasCorrections)) {
  const family = aliases.find(alias => normalizeTerm(alias.term) === normalizeTerm(canonical))?.family;
  aliases.push({ term, family, expression: termExpression(term) });
}
for (const [term, canonical] of Object.entries(weaveVocabulary.matching.contextualAliases)) {
  const family = aliases.find(alias => normalizeTerm(alias.term) === normalizeTerm(canonical))?.family;
  aliases.push({ term, family, expression: termExpression(term), contextual: true });
}
const cues = [...weaveVocabulary.extractionPolicy.unknownTermWithCue.cues].sort((a, b) => b.length - a.length);
const cueExpressions = cues.map(cue => new RegExp(termExpression(cue).source, "u"));

export function detectWovenWeaves(originalText: string, extraTerms: readonly string[] = []): WeaveDetection {
  const normalized = normalizedSource(originalText);
  const found: WeaveMention[] = [];
  const excluded: { start: number; end: number }[] = [];
  const excludedMentions: WeaveMention[] = [];
  const negations = negatedWeaveRanges(originalText);
  const vocabulary = extraTerms.length ? [...aliases, ...extraTerms.map(term => ({ term, family: undefined, expression: termExpression(term) }))] : aliases;
  for (const alias of vocabulary) {
    for (const match of normalized.value.matchAll(alias.expression)) {
      const start = normalized.starts[match.index!], end = normalized.ends[match.index! + match[0].length - 1];
      const bounds = clauseAt(originalText, start, end);
      const clause = originalText.slice(bounds.start, bounds.end);
      if (excludedContext(clause) || nonWeaveUse(clause, start - bounds.start, end - bounds.start)) continue;
      // Newly recognized fabric names in an article heading describe the item,
      // not a competing weave alongside its explicitly stated structure.
      if (alias.family === "fabric_names" && /^\s*(?:article(?: description)?|fabric name|name)\s*[:=]/i.test(clause)) continue;
      const qualified = qualifyWeavePhrase(originalText, { matchedTerm: originalText.slice(start, end), start, end, canonicalFamily: alias.family,
        status: "recognized", confidence: "medium", needsReview: true });
      // A supported structure code plus its adjacent repeat is a complete weave
      // phrase, even in an unlabelled specification list. Bare repeats still
      // require a weave label and remain reviewable below.
      const ratioQualified = qualified.start < start || qualified.end > end;
      if ("contextual" in alias && alias.contextual && !ratioQualified && !explicitWeaveContext(originalText, start, end)) continue;
      const normalizedClause = normalizeTerm(clause);
      const hasCue = cueExpressions.some(expression => expression.test(normalizedClause));
      // Bare repeat numbers are commonly counts/densities, not a weave declaration.
      if (/^\d+\s*[/x]\s*\d+$/i.test(alias.term) && !("contextual" in alias && alias.contextual) && !/\bweave\b/.test(normalizeTerm(clause))) continue;
      if (negatedWeaveSpan(originalText, start, end, negations)) {
        excluded.push({ start, end });
        const excludedMention = qualifyWeavePhrase(originalText, {
          matchedTerm: originalText.slice(start, end),
          start,
          end,
          canonicalFamily: alias.family,
          status: "recognized",
          confidence: "high",
          needsReview: false,
        });
        if (!excludedMentions.some(item => item.start === start && item.end === end)) {
          excludedMentions.push(excludedMention);
        }
        continue;
      }
      const mention: WeaveMention = { ...qualified, confidence: hasCue ? "high" : "medium", needsReview: !hasCue };
      // A labelled repeat alone does not identify Twill versus Basket/Matty.
      if ("contextual" in alias && alias.contextual && /^\d+\/\d+$/.test(alias.term)) {
        mention.status = "candidate_needs_review"; mention.needsReview = true;
        mention.confidence = "medium"; mention.canonicalFamily = undefined; mention.termRole = "weave_repeat";
      }
      found.push(mention);
    }
  }
  // Resolve overlapping aliases globally by longest phrase; retain every separate occurrence.
  const mentions: WeaveMention[] = [];
  for (const mention of found.sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.start - b.start)) {
    if (excluded.some(item => item.start < mention.end && item.end > mention.start)) continue;
    const same = mentions.find(item => item.start === mention.start && item.end === mention.end);
    if (same && same.canonicalFamily !== mention.canonicalFamily) {
      same.canonicalFamily = undefined; same.needsReview = true; same.confidence = "medium";
    }
    if (!mentions.some(item => item.start < mention.end && item.end > mention.start)) mentions.push(mention);
  }
  const cueRanges: { start: number; end: number; cue: string }[] = [];
  for (const cue of cues) {
    for (const match of normalized.value.matchAll(termExpression(cue))) {
      const start = normalized.starts[match.index!], end = normalized.ends[match.index! + match[0].length - 1];
      if (cueRanges.some(item => item.start < end && item.end > start)) continue;
      cueRanges.push({ start, end, cue: originalText.slice(start, end) });
    }
  }
  function addCandidate(value: string, offset: number, cue?: string) {
    // Strip connecting grammar without altering the matched candidate's wording.
    const candidate = value.replace(/^\s*(?:type|detail|architecture|structure|pattern)\s*[:=–—-]\s*/i, "")
      .replace(/^\s*(?:(?:we need|need|require|is|of|type|called|named|a|an|the|fabric)\b\s*|[:=–—-]\s*)*/i, "")
      .replace(/\s+(?:fabric|required|please)$/i, "")
      .replace(/[.,;]+$/, "")
      .trim();
    if (!meaningfulCandidate(candidate)) return;
    const start = offset + value.indexOf(candidate), end = start + candidate.length;
    if (negatedWeaveSpan(originalText, start, end, negations)) return;
    // An explicit weave description may qualify a known alias with custom words.
    // Preserve the whole description as reviewable text, not just its known suffix.
    const contained = mentions.filter(item => item.start >= start && item.end <= end);
    if (cue && contained.length === 1 && (contained[0].start !== start || contained[0].end !== end)) {
      mentions.splice(mentions.indexOf(contained[0]), 1);
    }
    if (mentions.some(item => item.start < end && item.end > start)) return;
    mentions.push({ matchedTerm: candidate, start, end, cue,
      status: cue ? "candidate_needs_review" : "possible_candidate_needs_review",
      confidence: cue ? "medium" : "low", needsReview: true });
  }
  for (const cue of cueRanges) {
    const bounds = clauseAt(originalText, cue.start, cue.end);
    const clause = originalText.slice(bounds.start, bounds.end);
    if (excludedContext(clause)) continue;
    const after = originalText.slice(cue.end, bounds.end).split(/\s+(?:with|for|at)\s+/i)[0];
    const before = originalText.slice(bounds.start, cue.start).split(/\s+with\s+/i).pop()!;
    for (const side of [{ value: after, offset: cue.end }, { value: before, offset: cue.start - before.length }]) {
      for (const match of side.value.matchAll(/(?:^|\s+(?:and|or)\s+)(.*?)(?=\s+(?:and|or)\s+|$)/gi)) {
        const value = match[1];
        addCandidate(value, side.offset + match.index! + match[0].length - value.length, cue.cue);
      }
    }
  }
  // Only isolated unlabelled terms in a clearly technical specification list.
  const technicalContext = /\b\d+\s*gsm\b/i.test(originalText) && /\b\d+\s*(?:inches|inch|meters?|metres?)\b/i.test(originalText);
  if (technicalContext) {
    for (const match of originalText.matchAll(/[^,;|\n]+/g)) {
      const value = match[0].trim();
      if (!excludedContext(value) && !nonWeaveUse(value) && /^\p{L}[\p{L}'’ -]*$/u.test(value) && value.split(/\s+/).length <= 2)
        addCandidate(match[0], match.index!);
    }
  }
  return { originalText, mentions: combineWeavePhrases(originalText, mentions.sort((a, b) => a.start - b.start)), excludedMentions };
}
