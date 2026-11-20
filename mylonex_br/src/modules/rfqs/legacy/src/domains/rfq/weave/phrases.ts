import { normalizedSource, normalizeTerm, termExpression, weaveVocabulary, type WeaveMention } from "./vocabulary.js";

const corrections = Object.entries({ ...weaveVocabulary.matching.aliasCorrections, ...weaveVocabulary.matching.contextualAliases })
  .map(([alias, canonical]) => [alias, canonical, termExpression(alias), normalizeTerm(canonical)] as const);
const ratios = weaveVocabulary.matching.ratioCompatibleTerms.map(term => new RegExp(termExpression(term).source, "u"));
const roles = Object.entries(weaveVocabulary.matching.termRoles).map(([role, terms]) => ({
  role, patterns: terms.map(term => new RegExp(termExpression(term).source, "u")),
}));
/** Controlled equivalence only. Source wording and offsets remain untouched. */
export function normalizedWeave(text: string): string {
  let value = normalizeTerm(text).replace(/\s+weave$/, "");
  for (const [alias, , expression, canonicalKey] of corrections) {
    // Bare-repeat aliases must not change a ratio qualifying Matty/Drill
    // or another stated structure; keep its structure and direction.
    if (/^\d+\/\d+$/.test(alias) && value !== alias) continue;
    value = value.replace(expression, canonicalKey);
  }
  value = value.replace(/\b([1-8])\s*[/x×]\s*([1-8])\b/g, "$1/$2");
  value = value.replace(/\(([1-8]\/[1-8])\)/g, "$1");
  const reverse = value.match(/^(.+?)\s*\(?([1-8]\/[1-8])\)?$/);
  if (reverse && ratios.some(expression => expression.test(reverse[1])))
    value = `${reverse[2]} ${reverse[1].trim()}`;
  if (/\b(?:plain|twill|drill)\b/.test(value) && /\bripstop\b/.test(value))
    value = `${value.replace(/\bripstop\b/g, "").replace(/\s+/g, " ").trim()} ripstop`;
  return value;
}

/** Preserve established buyer phrasing; Ripstop has an explicit canonical display requirement. */
export function weaveDisplay(text: string): string {
  text = text.replace(/[\t\r\n]+/g, " ").trim();
  const matty = normalizedWeave(text).match(/^(?:([1-8]\/[1-8])\s+)?matty$/);
  if (matty) return `${matty[1] ? `${matty[1]} ` : ""}Matty`;
  const abbreviatedRatio = normalizedWeave(text).match(/^([1-8]\/[1-8]) (twill|drill)$/);
  if (abbreviatedRatio && Object.entries(weaveVocabulary.matching.contextualAliases).some(([alias, canonical]) =>
    /^(?:Twill|Drill)$/.test(canonical) && termExpression(alias).test(normalizeTerm(text)))) {
    return `${abbreviatedRatio[1]} ${abbreviatedRatio[2] === "twill" ? "Twill" : "Drill"}`;
  }
  if (normalizeTerm(text) === "pln") return "Plain";
  if (normalizeTerm(text) === "chamb") return "Chambray";
  const source = normalizedSource(text);
  const aliases = ["Ripstop", ...corrections.filter(([, canonical]) => canonical === "Ripstop").map(([alias]) => alias)];
  const matches = aliases.flatMap(alias => [...source.value.matchAll(termExpression(alias))]).sort((a, b) => b.index! - a.index!);
  let value = text;
  for (const match of matches) value = value.slice(0, source.starts[match.index!]) + "Ripstop" + value.slice(source.ends[match.index! + match[0].length - 1]);
  if (matches.length) value = value.replace(/\b(?:twill|drill|plain)\b/gi, word => word[0].toUpperCase() + word.slice(1).toLowerCase());
  return value;
}

export function qualifyWeavePhrase(text: string, mention: WeaveMention): WeaveMention {
  const key = normalizedWeave(mention.matchedTerm);
  const compatible = ratios.some(expression => expression.test(key));
  let { start, end } = mention;
  if (compatible && !/\d\s*[/x×]\s*\d/i.test(key)) {
    const before = text.slice(0, start).match(/(?<![\p{L}\p{N}_/])\(?([1-8])\s*[/x×]\s*([1-8])\)?[\s\p{Dash_Punctuation}]*$/iu);
    const after = text.slice(end).match(/^[\s\p{Dash_Punctuation}]*\(?([1-8])\s*[/x×]\s*([1-8])\)?(?![\p{L}\p{N}_/])/iu);
    // A field label owns its numeric pair even when it precedes the weave name.
    if (before && !/\b(?:count|construction|density|yarn|size|repeat)\s*[:=]?\s*$/i.test(text.slice(0, before.index))) start = before.index!;
    else if (after) end += after[0].length;
  }
  const matchedTerm = text.slice(start, end);
  const normalizedTerm = normalizedWeave(matchedTerm);
  const ambiguous = /^(?:matt|mat|mattie)$/i.test(matchedTerm) && !/\b(?:weave|structure)\s*[:=]?\s*$/i.test(text.slice(0, start));
  const termRole = roles.find(({ patterns }) => patterns.some(expression => expression.test(normalizedTerm)))?.role;
  return { ...mention, start, end, matchedTerm, normalizedTerm, termRole,
    ...(ambiguous ? { status: "candidate_needs_review", needsReview: true, confidence: "low" } as const : {}) };
}

/** Ripstop reinforcement can accompany an explicit ground, without implying one. */
export function combineWeavePhrases(text: string, mentions: WeaveMention[]) {
  const result: WeaveMention[] = [];
  for (const mention of mentions) {
    const previous = result.at(-1);
    const reinforcement = (item: WeaveMention) => normalizedWeave(item.matchedTerm) === "ripstop";
    const ground = (item: WeaveMention) => /\b(?:plain|twill|drill)\b/.test(normalizedWeave(item.matchedTerm));
    if (previous && previous.status === "recognized" && mention.status === "recognized" &&
      (reinforcement(previous) && ground(mention) || ground(previous) && reinforcement(mention)) &&
      /^[\s\p{Dash_Punctuation}]+$/u.test(text.slice(previous.end, mention.start))) {
      const matchedTerm = text.slice(previous.start, mention.end);
      result[result.length - 1] = { ...previous, end: mention.end, matchedTerm, normalizedTerm: normalizedWeave(matchedTerm), canonicalFamily: undefined, termRole: "qualified_structure" };
    } else result.push(mention);
  }
  return result;
}

export function findExplanatoryWeaves(text: string, mentions: WeaveMention[]) {
  const explanatoryIndices = new Set<number>();
  const pairs: { primary: WeaveMention; explanatory: WeaveMention; note: string }[] = [];
  for (let i = 0; i < mentions.length - 1; i++) {
    for (let j = i + 1; j < mentions.length; j++) {
      const a = mentions[i];
      const b = mentions[j];
      const between = text.slice(a.end, b.start);
      if (/^[\s,;–—(-]*(?:also\s+(?:called|known\s+as)|aka|a\.k\.a\.?|known\s+as|referred\s+to\s+as|called)\s*$/i.test(between)) {
        explanatoryIndices.add(j);
        const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
        pairs.push({
          primary: a,
          explanatory: b,
          note: `Weave note: ${titleCase(a.matchedTerm)}, also called ${titleCase(b.matchedTerm)}.`,
        });
      }
    }
  }
  return { explanatoryIndices, pairs };
}

export function findWeaveAlternatives(text: string, mentions: WeaveMention[]) {
  if (mentions.length < 2) return null;
  const hasDecidingBetween = /\b(?:deciding|decide|choosing|choose)\s+between\b/i.test(text);
  const hasBetween = /\bbetween\s+[\s\S]*?\b(?:and|or)\b/i.test(text);
  const hasNotDecided = /\b(?:not\s+decided|undecided|either\s+structure|send\s+both\s+swatches|both\s+swatches|awaiting\s+selection)\b/i.test(text);
  const betweenMentions = mentions.slice(0, -1).map((m, idx) => text.slice(m.end, mentions[idx + 1].start));
  const hasOr = betweenMentions.some(b => /^[\s,;]*(?:or|alternatively|versus|vs|\/)[\s,;]*$/i.test(b));
  const hasAnd = betweenMentions.some(b => /^[\s,;]*(?:and)[\s,;]*$/i.test(b));

  const normalizedTerms = mentions.map(m => normalizedWeave(m.matchedTerm));
  const isHoneycombWaffle = normalizedTerms.includes("honeycomb") && normalizedTerms.includes("waffle");
  const isExplicitDeferral = hasDecidingBetween || /\b(?:either\s+structure|send\s+both\s+swatches|both\s+swatches|awaiting\s+selection)\b/i.test(text);

  if (
    (isHoneycombWaffle && (hasOr || hasAnd || hasDecidingBetween || hasNotDecided)) ||
    (isExplicitDeferral && hasDecidingBetween && (hasOr || hasAnd)) ||
    (hasBetween && hasAnd && (isHoneycombWaffle || hasNotDecided && isExplicitDeferral))
  ) {
    const unique = new Map<string, string>();
    const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
    for (const m of mentions) {
      const display = titleCase(m.matchedTerm.replace(/\s+weave$/i, ""));
      if (!unique.has(display.toLowerCase())) {
        unique.set(display.toLowerCase(), display);
      }
    }
    return Array.from(unique.values());
  }
  return null;
}

export function conflictingWeaves(text: string, mentions: WeaveMention[]) {
  const { explanatoryIndices } = findExplanatoryWeaves(text, mentions);
  const active = mentions.filter((_, idx) => !explanatoryIndices.has(idx));
  if (active.length <= 1) return false;
  if (findWeaveAlternatives(text, active)) return false;
  const keys = [...new Set(active.map(item => normalizedWeave(item.matchedTerm)))];
  if (active.some((mention, index) => index > 0 && /^[\s,;]*(?:or|alternatively|versus|vs|\/)[\s,;]*$/i.test(text.slice(active[index - 1].end, mention.start)))) return true;
  return !keys.every(a => keys.every(b => {
    if (a === b) return true;
    const ratios = [a, b].map(value => value.match(/\b[1-8]\/[1-8]\b/)?.[0]);
    if (ratios[0] && ratios[1] && ratios[0] !== ratios[1]) return false;
    return ` ${a} `.includes(` ${b} `) || ` ${b} `.includes(` ${a} `);
  }));
}
