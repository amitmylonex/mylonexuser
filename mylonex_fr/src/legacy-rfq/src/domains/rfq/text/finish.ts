import { FINISH_ALIAS_GROUPS, CONTEXTUAL_FINISH_ALIASES } from "./finish-aliases";
import { inactiveMention } from "./intent";
import finishReference from "../../../../config/textile-finish-reference.json";

export type FinishRole = "positive" | "exclusion" | "alternative" | "optional" | "superseded";

export type FinishVocabularyItem = {
  canonical: string;
  family: "hand_feel" | "dimensional" | "wash" | "moisture" | "functional" | "coating" | "sample";
  description?: string;
  requiresContext?: boolean;
};

/**
 * Reviewed textile finish vocabulary registry.
 * Captures requested wording without claiming performance rating/certification.
 */
export const FINISH_VOCABULARY: Record<string, FinishVocabularyItem> = {
  // Hand feel / surface
  "soft finish": { canonical: "Soft", family: "hand_feel" },
  "soft hand feel": { canonical: "Soft", family: "hand_feel" },
  "soft handfeel": { canonical: "Soft", family: "hand_feel" },
  "soft feel": { canonical: "Soft", family: "hand_feel" },
  "soft handle": { canonical: "Soft", family: "hand_feel" },
  "soft": { canonical: "Soft", family: "hand_feel" },
  "silicone softener": { canonical: "Silicone softener", family: "hand_feel" },
  "silicone soft": { canonical: "Silicone softener", family: "hand_feel" },
  "silicone finish": { canonical: "Silicone softener", family: "hand_feel" },
  "silicone": { canonical: "Silicone", family: "hand_feel" },
  "non-silicone softener": { canonical: "Non-silicone softener", family: "hand_feel" },
  "peach": { canonical: "Peach", family: "hand_feel" },
  "peached": { canonical: "Peach", family: "hand_feel" },
  "peach finish": { canonical: "Peach", family: "hand_feel" },
  "peach skin": { canonical: "Peach skin", family: "hand_feel" },
  "emerised": { canonical: "Emerised", family: "hand_feel" },
  "emerized": { canonical: "Emerised", family: "hand_feel" },
  "sueded": { canonical: "Sueded", family: "hand_feel" },
  "suede finish": { canonical: "Sueded", family: "hand_feel" },
  "brushed": { canonical: "Brushed", family: "hand_feel" },
  "brushing": { canonical: "Brushed", family: "hand_feel" },
  "brushed finish": { canonical: "Brushed", family: "hand_feel" },
  "raised": { canonical: "Raised", family: "hand_feel" },
  "napped": { canonical: "Napped", family: "hand_feel" },
  "sanded": { canonical: "Sanded", family: "hand_feel" },
  "sheared": { canonical: "Sheared", family: "hand_feel" },
  "anti-pilling": { canonical: "Anti-pilling", family: "hand_feel" },
  "anti pilling": { canonical: "Anti-pilling", family: "hand_feel" },
  "antipilling": { canonical: "Anti-pilling", family: "hand_feel" },
  "singed": { canonical: "Singed", family: "hand_feel" },
  "calendered": { canonical: "Calendered", family: "hand_feel" },
  "calendering": { canonical: "Calendered", family: "hand_feel" },
  "glazed": { canonical: "Glazed", family: "hand_feel" },
  "chintz": { canonical: "Chintz", family: "hand_feel" },
  "embossed": { canonical: "Embossed", family: "hand_feel" },
  "embossing": { canonical: "Embossed", family: "hand_feel" },
  "schreinering": { canonical: "Schreinering", family: "hand_feel" },
  "schreinered": { canonical: "Schreinering", family: "hand_feel" },

  // Dimensional / easy care
  "sanforised": { canonical: "Sanforised", family: "dimensional" },
  "sanforized": { canonical: "Sanforised", family: "dimensional" },
  "sanforize": { canonical: "Sanforised", family: "dimensional" },
  "preshrunk": { canonical: "Preshrunk", family: "dimensional" },
  "pre-shrunk": { canonical: "Preshrunk", family: "dimensional" },
  "compacted": { canonical: "Compacted", family: "dimensional" },
  "compressive shrinkage": { canonical: "Compressive shrinkage", family: "dimensional" },
  "heat-set": { canonical: "Heat-set", family: "dimensional" },
  "heat setting": { canonical: "Heat-set", family: "dimensional" },
  "heatset": { canonical: "Heat-set", family: "dimensional" },
  "mercerised": { canonical: "Mercerised", family: "dimensional" },
  "mercerized": { canonical: "Mercerised", family: "dimensional" },
  "mercerization": { canonical: "Mercerised", family: "dimensional" },
  "liquid-ammonia treatment": { canonical: "Liquid-ammonia treatment", family: "dimensional" },
  "liquid ammonia": { canonical: "Liquid-ammonia treatment", family: "dimensional" },
  "easy-care": { canonical: "Easy-care", family: "dimensional" },
  "easy care": { canonical: "Easy-care", family: "dimensional" },
  "easycare": { canonical: "Easy-care", family: "dimensional" },
  "wrinkle-resistant": { canonical: "Wrinkle-resistant", family: "dimensional" },
  "wrinkle resistant": { canonical: "Wrinkle-resistant", family: "dimensional" },
  "crease-resistant": { canonical: "Crease-resistant", family: "dimensional" },
  "crease resistant": { canonical: "Crease-resistant", family: "dimensional" },
  "durable press": { canonical: "Durable press", family: "dimensional" },
  "resin finish": { canonical: "Resin finish", family: "dimensional" },
  "resin treated": { canonical: "Resin finish", family: "dimensional" },
  "non-iron": { canonical: "Non-iron", family: "dimensional" },

  // Wash / appearance
  "enzyme wash": { canonical: "Enzyme wash", family: "wash" },
  "enzyme washed": { canonical: "Enzyme wash", family: "wash" },
  "bio-polished": { canonical: "Bio-polished", family: "wash" },
  "biopolishing": { canonical: "Bio-polished", family: "wash" },
  "bio-wash": { canonical: "Bio wash", family: "wash" },
  "bio wash": { canonical: "Bio wash", family: "wash" },
  "bio washed": { canonical: "Bio wash", family: "wash" },
  "garment washed": { canonical: "Garment washed", family: "wash" },
  "stone washed": { canonical: "Stone washed", family: "wash" },
  "stone wash": { canonical: "Stone washed", family: "wash" },
  "acid washed": { canonical: "Acid washed", family: "wash" },
  "acid wash": { canonical: "Acid washed", family: "wash" },
  "silicone washed": { canonical: "Silicone washed", family: "wash" },
  "silicone wash": { canonical: "Silicone washed", family: "wash" },
  "vintage washed": { canonical: "Vintage washed", family: "wash" },
  "vintage wash": { canonical: "Vintage washed", family: "wash" },
  "washed-down": { canonical: "Washed-down", family: "wash" },
  "washed down": { canonical: "Washed-down", family: "wash" },

  // Moisture / comfort
  "moisture management": { canonical: "Moisture Management", family: "moisture" },
  "moisture-wicking": { canonical: "Moisture-wicking", family: "moisture" },
  "moisture wicking": { canonical: "Moisture-wicking", family: "moisture" },
  "wicking": { canonical: "Wicking", family: "moisture" },
  "hydrophilic finish": { canonical: "Hydrophilic finish", family: "moisture" },
  "hydrophilic": { canonical: "Hydrophilic", family: "moisture" },
  "quick-dry": { canonical: "Quick-dry", family: "moisture" },
  "quick dry": { canonical: "Quick-dry", family: "moisture" },
  "fast dry": { canonical: "Quick-dry", family: "moisture" },
  "absorbent finish": { canonical: "Absorbent finish", family: "moisture" },
  "water-repellent": { canonical: "Water-repellent", family: "moisture" },
  "water repellent": { canonical: "Water-repellent", family: "moisture" },
  "durable water repellent": { canonical: "Durable water repellent (DWR)", family: "moisture" },
  "dwr": { canonical: "DWR", family: "moisture" },
  "waterproof treatment": { canonical: "Waterproof treatment", family: "moisture" },
  "waterproof": { canonical: "Waterproof", family: "moisture" },
  "breathable coating": { canonical: "Breathable coating", family: "moisture" },

  // Functional performance
  "antimicrobial": { canonical: "Antimicrobial", family: "functional" },
  "anti-microbial": { canonical: "Antimicrobial", family: "functional" },
  "antibacterial": { canonical: "Antibacterial", family: "functional" },
  "anti-bacterial": { canonical: "Antibacterial", family: "functional" },
  "anti-odour": { canonical: "Anti-odour", family: "functional" },
  "anti-odor": { canonical: "Anti-odor", family: "functional" },
  "antifungal": { canonical: "Antifungal", family: "functional" },
  "anti-fungal": { canonical: "Antifungal", family: "functional" },
  "antistatic": { canonical: "Antistatic", family: "functional" },
  "anti-static": { canonical: "Antistatic", family: "functional" },
  "conductive finish": { canonical: "Conductive finish", family: "functional" },
  "uv-protective": { canonical: "UV-protective", family: "functional" },
  "uv protection": { canonical: "UV protection", family: "functional" },
  "upf finish": { canonical: "UPF finish", family: "functional" },
  "anti-uv": { canonical: "UV protection", family: "functional" },
  "flame-retardant": { canonical: "Flame-retardant", family: "functional" },
  "flame retardant": { canonical: "Flame-retardant", family: "functional" },
  "fire-retardant": { canonical: "Fire-retardant", family: "functional" },
  "fr finish": { canonical: "Flame-retardant", family: "functional" },
  "soil-release": { canonical: "Soil-release", family: "functional" },
  "soil release": { canonical: "Soil-release", family: "functional" },
  "stain-resistant": { canonical: "Stain-resistant", family: "functional" },
  "stain resistant": { canonical: "Stain-resistant", family: "functional" },
  "oil-repellent": { canonical: "Oil-repellent", family: "functional" },
  "oil repellent": { canonical: "Oil-repellent", family: "functional" },
  "anti-mosquito": { canonical: "Anti-mosquito", family: "functional" },
  "insect-repellent": { canonical: "Insect-repellent", family: "functional" },
  "cooling finish": { canonical: "Cooling finish", family: "functional" },
  "phase-change treatment": { canonical: "Phase-change treatment", family: "functional" },

  // Coating / lamination
  "lamination": { canonical: "Lamination", family: "coating" },
  "laminated": { canonical: "Laminated", family: "coating" },
  "membrane laminated": { canonical: "Membrane laminated", family: "coating" },
  "lam": { canonical: "Lam", family: "coating" },
  "pu coating": { canonical: "PU coating", family: "coating" },
  "polyurethane coating": { canonical: "Polyurethane coating", family: "coating" },
  "matte pu coating": { canonical: "Matte PU coating", family: "coating" },
  "matt pu coating": { canonical: "Matt PU coating", family: "coating" },
  "matt finish": { canonical: "Matt finish", family: "coating" },
  "matte finish": { canonical: "Matte finish", family: "coating" },
  "acrylic coating": { canonical: "Acrylic coating", family: "coating" },
  "pvc coating": { canonical: "PVC coating", family: "coating" },
  "silicone coating": { canonical: "Silicone coating", family: "coating" },
  "back coating": { canonical: "Back coating", family: "coating" },
  "blackout coating": { canonical: "Blackout coating", family: "coating" },
  "transfer coating": { canonical: "Transfer coating", family: "coating" },

  // Sample matching
  "same as approved sample": { canonical: "Same as approved sample", family: "sample" },
  "match approved sample": { canonical: "Same as approved sample", family: "sample" },
  "to match approved sample": { canonical: "Same as approved sample", family: "sample" },

  // Additional reviewed finishes from textile reference
  "anti-viral": { canonical: "Anti-viral", family: "functional" },
  "anti-mite": { canonical: "Anti-mite", family: "functional" },
  "anti-slip": { canonical: "Anti-slip", family: "functional" },
  "anti-snag": { canonical: "Anti-snag", family: "functional" },
  "airo": { canonical: "Airo", family: "wash" },
  "skin-care": { canonical: "Skin care", family: "functional" },
  "fragrance": { canonical: "Fragrance", family: "functional" },
  "arc-rated": { canonical: "Arc-rated", family: "functional" },
  "burnout": { canonical: "Burnout", family: "hand_feel" },
  "beetled": { canonical: "Beetled", family: "hand_feel" },
  "far-infrared": { canonical: "Far-infrared", family: "functional" },
  "activated-charcoal": { canonical: "Activated charcoal", family: "functional" },
  "chlorine-resistant": { canonical: "Chlorine resistant", family: "functional" },
  "cooling": { canonical: "Cooling", family: "functional" },
  "downproof": { canonical: "Downproof", family: "functional" },
  "dry-touch": { canonical: "Dry touch", family: "hand_feel" },
  "blood-repellent": { canonical: "Blood repellent", family: "functional" },
  "fluid-resistant": { canonical: "Fluid resistant", family: "functional" },
  "foil-print": { canonical: "Foil print", family: "coating" },
  "flocked": { canonical: "Flocked", family: "coating" },
  "fusible": { canonical: "Fusible", family: "coating" },
  "graphene": { canonical: "Graphene", family: "functional" },
  "lacquer": { canonical: "Lacquer", family: "coating" },
  "laser-fading": { canonical: "Laser fading", family: "wash" },
  "ptfe-membrane": { canonical: "PTFE membrane", family: "coating" },
  "shape-memory": { canonical: "Shape memory", family: "functional" },
  "milky-coating": { canonical: "Milky coating", family: "coating" },
  "mothproof": { canonical: "Mothproof", family: "functional" },
  "self-cleaning": { canonical: "Self-cleaning", family: "functional" },
  "wax-coated": { canonical: "Wax coated", family: "coating" },
  "paper-touch": { canonical: "Paper touch", family: "hand_feel" },
  "pearl-finish": { canonical: "Pearl finish", family: "coating" },
  "plisse": { canonical: "Plissé", family: "hand_feel" },
  "reflective": { canonical: "Reflective", family: "coating" },
  "3d-resin": { canonical: "3D resin", family: "wash" },
  "rinse-wash": { canonical: "Rinse wash", family: "wash" },
  "rubber-coating": { canonical: "Rubber coating", family: "coating" },
  "sand-wash": { canonical: "Sand wash", family: "wash" },
  "scoured": { canonical: "Scoured", family: "wash" },
  "metallic-finish": { canonical: "Metallic finish", family: "coating" },
  "shrink-resist": { canonical: "Shrink resist", family: "functional" },
  "silicone-wash": { canonical: "Silicone wash", family: "wash" },
  "snow-wash": { canonical: "Snow wash", family: "wash" },
  "stiff-finish": { canonical: "Stiff finish", family: "hand_feel" },
  "tpu-lamination": { canonical: "TPU lamination", family: "coating" },
  "thermal-regulation": { canonical: "Thermal regulation", family: "functional" },
  "overdye": { canonical: "Overdye", family: "wash" },
  "vintage-wash": { canonical: "Vintage wash", family: "wash" },
  "weight-reduction": { canonical: "Weight reduction", family: "wash" },
  "silk-weighting": { canonical: "Silk weighting", family: "hand_feel" },
  "windproof": { canonical: "Windproof", family: "functional" },
};

/**
 * Explicit label patterns for finishing requirements.
 */
// Extend the shared registry while preserving all established aliases/meanings.
for (const [target, aliases] of Object.entries(FINISH_ALIAS_GROUPS)) {
  for (const alias of aliases) FINISH_VOCABULARY[alias.toLowerCase()] ??= {
    ...FINISH_VOCABULARY[target], requiresContext: CONTEXTUAL_FINISH_ALIASES.has(alias.toLowerCase()),
  };
}
// Workbook additions are explicitly context-bound. Keep existing finer meanings;
// never import its broad finish-to-state or performance inference statements.
for (const entry of finishReference.entries) FINISH_VOCABULARY[entry.alias.toLowerCase()] ??= {
  canonical: entry.canonical, family: "functional", requiresContext: true,
};
// Compile the expanded dictionary once, preserving the existing longest-phrase
// matching order without rebuilding hundreds of expressions for each draft.
const finishMatchers = Object.keys(FINISH_VOCABULARY).sort((a, b) => b.length - a.length).map(phrase => ({
  phrase, regex: new RegExp(`(?<![\\w])${phrase.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&")}(?![\\w])`, "gi"),
}));

export const FINISH_LABEL_PATTERN =
  "(?:finishing\\s+requirement|special\\s+treatment|functional\\s+finish|required\\s+finish|finish\\s+required|fabric\\s+finish|finishing|treatment|finish)";

/**
 * Checks whether a word like "peach" is functioning as a colour rather than a finish.
 * e.g. "dyed peach colour, soft finish" -> peach is colour.
 * "soft peach shade" -> peach is colour.
 * "dyed peach finish" -> peach is finish!
 */
export function isColourRole(matchIndex: number, text: string): boolean {
  const after = text.slice(matchIndex).split(/[;,.\n]/)[0];
  if (/\b(?:colour|color|shade|hue|tone)\b/i.test(after)) {
    return true;
  }
  const before = text.slice(Math.max(0, matchIndex - 30), matchIndex);
  if (/\b(?:colour|color|shade|hue|tone)\s*[:=]?\s*$/i.test(before)) {
    return true;
  }
  return false;
}

/**
 * Parses qualifiers (e.g. PFAS-free, 30 washes, UPF 50+) from text.
 */
export function extractFinishQualifiers(text: string): string[] {
  const qualifiers: string[] = [];
  if (/\b(?:pfas[ -]?free|fluorocarbon[ -]?free)\b/i.test(text)) {
    qualifiers.push("PFAS-free");
  }
  if (/\bformal(?:dehyde)?[ -]?free\b/i.test(text)) {
    qualifiers.push("Formaldehyde-free");
  }
  const washMatch = text.match(/\b(?:durability\s*[:=]?\s*)?(\d+)\s*(?:home\s+)?(?:washes|wash\s+cycles|launderings)\b/i);
  if (washMatch) {
    qualifiers.push(`Durability: ${washMatch[1]} washes`);
  }
  const upfMatch = text.match(/\b(?:target\s+)?UPF\s*(\d+(?:\s*\+)?)/i);
  if (upfMatch) {
    qualifiers.push(upfMatch[0].trim().replace(/^target/i, "Target"));
  }
  if (/\b(?:same\s+as\s+approved\s+sample|match\s+approved\s+sample|to\s+match\s+sample)\b/i.test(text)) {
    qualifiers.push("Match approved sample");
  }
  if (/\b(?:performance\s+testing\s+requested|test\s+report\s+required)\b/i.test(text)) {
    qualifiers.push("Performance testing requested");
  }
  return qualifiers;
}

/**
 * Parses exclusions (e.g. "no silicone", "non-peach", "without resin") from text.
 */
export function extractFinishExclusions(text: string): string[] {
  const exclusions: string[] = [];
  const patterns = [
    /\b(?:no|not|without|free\s+from)\s+(?:softener|silicone|resin|chemical|antimicrobial|antibacterial)\s*(?:finish|treatment)?\b/gi,
    /\b(?:non[ -]silicone|non[ -]peach|resin[ -]free)\b/gi,
    /\b(?:without|no)\s+resin\b/gi,
    /\bno\s+antimicrobial(?:\s+finish)?\b/gi,
  ];
  for (const regex of patterns) {
    for (const match of text.matchAll(regex)) {
      exclusions.push(match[0].trim().replace(/^./, c => c.toUpperCase()));
    }
  }
  return [...new Set(exclusions)];
}

/**
 * Disassembles compound finish text into individual finish tokens.
 * Handles '+', '&', 'and', ',', ';', and line breaks.
 */
export function splitFinishTokens(raw: string): string[] {
  return raw
    .split(/(?:\s+[+&]\s+|\s+and\s+|[,;]|\r?\n)/i)
    .map(t => t.trim())
    .filter(t => t.length > 0 && !/^(?:both|all|required|and|also)$/i.test(t));
}

/**
 * Main modular Finish extractor.
 */
export function extractFinish(
  text: string,
  target: any,
  recordEvidence?: (_field: string, _match: RegExpMatchArray) => void,
  preserveRaw = false
): void {
  if (target.finishConfirmed) return;

  // 1. Check for double negation / negation scope: "Do not remove the peach finish"
  const isDoNotRemove = /\bdo not (?:remove|omit|skip|drop|delete)\s+(?:the\s+)?([a-z\s-]+?)\s+finish\b/i.exec(text);

  // 2. Check for explicit finish correction / replacement:
  // "Replace peach with enzyme wash" -> active: enzyme wash
  // "Enzyme wash instead of silicone wash" -> active: enzyme wash
  const replaceMatch = text.match(/\breplace\s+([a-z\s-]+?)\s+with\s+([a-z\s-]+?)(?:[;.,\n]|$)/i);
  const insteadMatch = text.match(/\b([a-z\s-]+?)\s+instead\s+of\s+([a-z\s-]+?)(?:[;.,\n]|$)/i);

  if (replaceMatch) {
    const superseded = replaceMatch[1].trim();
    const active = replaceMatch[2].trim();
    const note = `Finish updated to ${active} (replacing earlier ${superseded}).`;
    target.metadataNotes = target.metadataNotes || [];
    target.metadataNotes.push(note);
    target.finish = active.replace(/\s+finish$/i, "").replace(/^./, c => c.toUpperCase());
    if (target.draft && !target.draft.additionalSpecs?.includes(note)) {
      target.draft.additionalSpecs = [target.draft.additionalSpecs, note].filter(Boolean).join("\n");
    }
    return;
  }

  if (insteadMatch) {
    const active = insteadMatch[1].trim();
    const superseded = insteadMatch[2].trim();
    const note = `Active finish: ${active} (instead of ${superseded}).`;
    target.metadataNotes = target.metadataNotes || [];
    target.metadataNotes.push(note);
    target.finish = active.replace(/\s+finish$/i, "").replace(/^./, c => c.toUpperCase());
    if (target.draft && !target.draft.additionalSpecs?.includes(note)) {
      target.draft.additionalSpecs = [target.draft.additionalSpecs, note].filter(Boolean).join("\n");
    }
    return;
  }

  // 3. Check for Alternatives: "Peach or enzyme wash"
  const altMatch = text.match(/\b([a-zA-Z\s-]+?)\s+or\s+([a-zA-Z\s-]+?)\s+(?:finish|both\s+acceptable|acceptable|options?)\b/i);
  if (altMatch && !/\b(?:to|-|–|—)\b/.test(altMatch[0])) {
    const alt1 = altMatch[1].trim();
    const alt2 = altMatch[2].trim();
    target.finishAlternatives = [alt1, alt2];
    const altNote = `Finish alternatives: ${alt1} or ${alt2}.`;
    target.metadataNotes = target.metadataNotes || [];
    target.metadataNotes.push(altNote);
    if (target.draft && !target.draft.additionalSpecs?.includes(altNote)) {
      target.draft.additionalSpecs = [target.draft.additionalSpecs, altNote].filter(Boolean).join("\n");
    }
    target.warnings = target.warnings || [];
    target.warnings.push(`Finish has alternatives (${alt1} or ${alt2}); confirm intended option.`);
    // Leave primary finish unchosen or populated as alternatives
    target.finish = `${alt1} / ${alt2}`;
    return;
  }

  // 4. Extract Qualifiers & Exclusions
  const qualifiers = extractFinishQualifiers(text);
  const exclusions = extractFinishExclusions(text);

  if (qualifiers.length) {
    target.finishQualifiers = qualifiers;
    for (const q of qualifiers) {
      if (target.draft && !target.draft.additionalSpecs?.includes(q)) {
        target.draft.additionalSpecs = [target.draft.additionalSpecs, `Finish qualifier: ${q}`].filter(Boolean).join("\n");
      }
    }
  }

  if (exclusions.length) {
    target.finishExclusions = exclusions;
    for (const ex of exclusions) {
      if (target.draft && !target.draft.additionalSpecs?.includes(ex)) {
        target.draft.additionalSpecs = [target.draft.additionalSpecs, `Finish exclusion: ${ex}`].filter(Boolean).join("\n");
      }
    }
  }

  // 5. Check for Optional finish: e.g. "Peach optional", "Quote with and without DWR"
  if (/\b([a-z\s-]+?)\s+optional\b/i.test(text)) {
    const optMatch = text.match(/\b([a-z\s-]+?)\s+optional\b/i)!;
    const optNote = `Optional finish: ${optMatch[1].trim()}`;
    target.metadataNotes = target.metadataNotes || [];
    target.metadataNotes.push(optNote);
    if (target.draft && !target.draft.additionalSpecs?.includes(optNote)) {
      target.draft.additionalSpecs = [target.draft.additionalSpecs, optNote].filter(Boolean).join("\n");
    }
  }

  if (/\bquote\s+with\s+and\s+without\s+([a-z\s-]+?)(?:[;.,\n]|$)/i.test(text)) {
    const quoteOptMatch = text.match(/\bquote\s+with\s+and\s+without\s+([a-z\s-]+?)(?:[;.,\n]|$)/i)!;
    const qNote = `Quotation alternative: With and without ${quoteOptMatch[1].trim()}`;
    target.metadataNotes = target.metadataNotes || [];
    target.metadataNotes.push(qNote);
    if (target.draft && !target.draft.additionalSpecs?.includes(qNote)) {
      target.draft.additionalSpecs = [target.draft.additionalSpecs, qNote].filter(Boolean).join("\n");
    }
  }

  // 6. EXPLICIT LABELLED FINISH:
  // e.g. FINISH – Lam + Moisture Management
  // Finish: Peach + silicone soft
  // Treatment: Mercerised, sanforised; easy-care
  // Required finish = Lam + Moisture Management
  const labelledRegex = new RegExp(
    `(?:^|[\\r\\n;,|])\\s*(${FINISH_LABEL_PATTERN})(?!\\s+(?:width|cuttable|greige))\\s*([:=—–-]|\\s+to\\s+be\\b|\\n)\\s*((?:[^\\r\\n;,.!]|\\.(?=[A-Za-z]))+)`,
    "gi"
  );

  const labelledMatches = [...text.matchAll(labelledRegex)];
  if (labelledMatches.length) {
    const chosenMatch = labelledMatches[0];
    const rawVal = chosenMatch[3].trim();
    if (/\b(?:later|optional|after\s+(?:approval|delivery)|future)\b/i.test(rawVal)) {
      target.warnings = target.warnings || [];
      target.warnings.push(`Future or optional finish retained for review: ${rawVal}`);
      target.finish = "";
      return;
    }

    // Check if the explicitly labelled value is purely a fabric state:
    // e.g. "Finish: dyed", "Finish: RFD", "Finish: greige", "Finish: printed"
    if (/^(?:dyed|rfd|ready\s+for\s+dyeing|greige|grey|printed)$/i.test(rawVal)) {
      const stateMap: Record<string, string> = {
        dyed: "dyed",
        rfd: "rfd",
        "ready for dyeing": "rfd",
        greige: "greige",
        grey: "greige",
        printed: "printed",
      };
      const mappedState = stateMap[rawVal.toLowerCase()];
      if (mappedState) {
        if (target.draft) target.draft.fabricState = mappedState;
        target.warnings = target.warnings || [];
        target.warnings.push(`Explicit finish wording "${rawVal}" maps to fabric state rather than a functional finish.`);
        if (recordEvidence) recordEvidence("fabricState", chosenMatch);
        return;
      }
    }

    // Preserve the explicitly labelled wording, retaining tokens as written!
    // e.g. "Lam + Moisture Management"
    // Handle multi-finish tokens joined by +, &, and, commas:
    const tokens = splitFinishTokens(rawVal);
    const validTokens: string[] = [];

    for (const token of tokens) {
      const cleanToken = token.trim().replace(/[.,;]+$/, "");
      const lower = cleanToken.toLowerCase();
      if (/^(?:no|not|without|avoid)\b/i.test(lower)) continue;
      if (/^(?:IR|WR)$/i.test(cleanToken)) {
        target.warnings = target.warnings || [];
        target.warnings.push(`Ambiguous finish code ${cleanToken.toUpperCase()}; confirm the full treatment name.`);
        continue;
      }
      // Check if token is excluded (e.g. "no silicone"):
      if (exclusions.some(ex => ex.toLowerCase().includes(lower))) continue;
      // Filter out pure state tokens if mixed (e.g. "Dyed, peach" -> Dyed is state, Peach is finish)
      if (/^(?:dyed|rfd|greige|printed)$/i.test(lower)) {
        if (target.draft) {
          target.draft.fabricState = lower === "rfd" ? "rfd" : lower === "greige" ? "greige" : lower === "printed" ? "printed" : "dyed";
        }
        continue;
      }
      const canonical = FINISH_VOCABULARY[lower]?.canonical;
      if (lower === "peach" && cleanToken === "peach") {
        validTokens.push("peach");
      } else {
        validTokens.push(canonical || cleanToken);
      }
    }

    if (validTokens.length) {
      // Re-assemble preserving natural connector or standard ' + '
      const joined = validTokens.join(" + ");
      target.finish = joined;
      if (recordEvidence) recordEvidence("finish", chosenMatch);
      return;
    }
  }

  // 7. VOCABULARY PHRASE SCANNING (Natural text, e.g. "Need peach finish", "Soft hand feel required", "Mercerised and sanforised")
  const detectedTokens: { canonical: string; raw: string; index: number; priority: number }[] = [];

  // Sort vocabulary keys by length descending to match longest phrases first (e.g. "durable water repellent" before "water repellent")
  for (const { phrase, regex } of finishMatchers) {
    for (const match of text.matchAll(regex)) {
      const idx = match.index!;
      const rawMatch = match[0];
      if (/^(?:charcoal|silver|copper)$/i.test(rawMatch) && !/\b(?:finish|treatment|activated|ion)\b/i.test(text.slice(Math.max(0, idx - 20), idx + rawMatch.length + 20))) continue;
      if (/^(?:ir|wr)$/i.test(rawMatch)) continue;
      if (FINISH_VOCABULARY[phrase].requiresContext) {
        const clause = text.slice(0, idx).split(/[;,|\n]/).pop()!;
        const afterClause = text.slice(idx + rawMatch.length).split(/[;,|\n]/)[0];
        if (!new RegExp(`^\\s*(?:${FINISH_LABEL_PATTERN})\\s*[:=—–-]`, "i").test(clause) &&
          !new RegExp(`\\b(?:${FINISH_LABEL_PATTERN})\\b`, "i").test(afterClause) &&
          !/^\s+(?:finish|treatment)\b/i.test(text.slice(idx + rawMatch.length))) continue;
      }

      // Disambiguate colour vs finish:
      // "peach" in "dyed peach colour" or "soft peach shade" -> colour, NOT finish!
      if (/peach/i.test(rawMatch) && isColourRole(idx, text)) {
        continue;
      }

      // Disambiguate bare "soft":
      // "soft peach shade" or "soft pink colour" -> color adjective, not a finish!
      if (phrase === "soft" && /\bsoft\s+(?:peach|pink|blue|green|yellow|grey|white|red|shade|colour|color|tone)\b/i.test(text.slice(idx, idx + 35))) {
        continue;
      }

      // Check negation / exclusion before this match:
      const before = text.slice(Math.max(0, idx - 40), idx);
      const isNegated =
        /\b(?:no|not|without|neither|never|non[- ]?|must not(?: receive)?|do not(?: need| want)?|exclude|excluded|excluding)\b[^.;\n]*$/i.test(before) && !isDoNotRemove;
      if (isNegated) {
        exclusions.push(`No ${rawMatch}`);
        continue;
      }
      if (inactiveMention(text, idx, idx + rawMatch.length)) continue;

      // Interval overlap check (not center distance!):
      const overlaps = detectedTokens.some(
        d => Math.max(d.index, idx) < Math.min(d.index + d.raw.length, idx + rawMatch.length)
      );
      if (overlaps) continue;

      const item = FINISH_VOCABULARY[phrase];
      detectedTokens.push({
        canonical: item.canonical,
        raw: rawMatch,
        index: idx,
        priority: phrase.length,
      });
    }
  }

  // If exclusions were detected, save them
  if (exclusions.length && (!target.finishExclusions || !target.finishExclusions.length)) {
    target.finishExclusions = [...new Set(exclusions)];
    for (const ex of exclusions) {
      if (target.draft && !target.draft.additionalSpecs?.includes(ex)) {
        target.draft.additionalSpecs = [target.draft.additionalSpecs, `Finish exclusion: ${ex}`].filter(Boolean).join("\n");
      }
    }
  }

  if (!detectedTokens.length) return;

  // Sort detected tokens by appearance order in text
  detectedTokens.sort((a, b) => a.index - b.index);

  // Deduplicate identical canonical finishes (e.g. "peach finish" and "peached" -> "Peach")
  const uniqueCanonicals: string[] = [];
  for (const token of detectedTokens) {
    if (!uniqueCanonicals.some(c => c.toLowerCase() === token.canonical.toLowerCase())) {
      uniqueCanonicals.push(token.canonical);
    }
  }

  if (preserveRaw) {
    target.finish = detectedTokens.map(t => t.raw).join(" + ");
  } else {
    target.finish = uniqueCanonicals.join(" + ");
  }
}
