import { z } from "zod";
import source from "../../../../config/woven-weave-detection.json" with { type: "json" };

// One validated source for aliases and controlled corrections across callers.
const vocabularySchema = z.object({
  schemaVersion: z.string(),
  matching: z.object({
    caseInsensitive: z.literal(true), unicodeNormalize: z.literal("NFKC"), accentInsensitive: z.literal(true),
    trimWhitespace: z.literal(true), normalizeRepeatedWhitespace: z.literal(true),
    normalizeHyphensAndSpacesForMatching: z.literal(true), useWholeWordBoundaries: z.literal(true),
    preserveOriginalMatchedText: z.literal(true), longestMatchFirst: z.literal(true), allowSingleWordAliases: z.literal(true),
    aliasCorrections: z.record(z.string(), z.string()),
    contextualAliases: z.record(z.string(), z.string()),
    ratioCompatibleTerms: z.array(z.string()),
    termRoles: z.record(z.string(), z.array(z.string())),
    aliasGroups: z.array(z.object({ id: z.string(), terms: z.array(z.string().min(1)).min(1) })).min(1),
  }),
  extractionPolicy: z.object({
    unknownTermWithCue: z.object({ cues: z.array(z.string().min(1)) }),
    unknownStandaloneTerm: z.object({ needsReview: z.literal(true) }),
  }),
  avoidFalsePositives: z.object({ excludedNonWovenCues: z.array(z.string()) }),
});
export const weaveVocabulary = vocabularySchema.parse(source);
export const weaveMentionSchema = z.object({
  matchedTerm: z.string(), start: z.number().int().nonnegative(), end: z.number().int().nonnegative(),
  canonicalFamily: z.string().optional(), cue: z.string().optional(),
  normalizedTerm: z.string().optional(), termRole: z.string().optional(),
  status: z.enum(["recognized", "candidate_needs_review", "possible_candidate_needs_review"]),
  confidence: z.enum(["high", "medium", "low"]), needsReview: z.boolean(),
});
export const weaveDetectionSchema = z.object({
  originalText: z.string(),
  mentions: z.array(weaveMentionSchema),
  excludedMentions: z.array(weaveMentionSchema).optional(),
});
export type WeaveMention = z.infer<typeof weaveMentionSchema>;
export type WeaveDetection = z.infer<typeof weaveDetectionSchema>;

/** Normalized characters retain source offsets even for expanded Unicode forms. */
export function normalizedSource(text: string) {
  let value = "";
  const starts: number[] = [], ends: number[] = [];
  let offset = 0;
  for (const char of text) {
    const start = offset; offset += char.length;
    const normalized = char.normalize("NFKC").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase()
      .replace(/[\p{Dash_Punctuation}\s]/gu, " ").replace(/[’‘]/g, "'");
    if (!normalized && /\p{M}/u.test(char) && ends.length) ends[ends.length - 1] = offset;
    for (const letter of normalized) {
      if (letter === " " && value.endsWith(" ")) { ends[ends.length - 1] = offset; continue; }
      value += letter;
      for (let i = 0; i < letter.length; i++) { starts.push(start); ends.push(offset); }
    }
  }
  return { value, starts, ends };
}
export function normalizeTerm(text: string) { return normalizedSource(text).value.trim(); }
export function termExpression(term: string) {
  const escaped = normalizeTerm(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    .replace(/(\d)([/x])(\d)/g, "$1\\s*$2\\s*$3");
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, "gu");
}
