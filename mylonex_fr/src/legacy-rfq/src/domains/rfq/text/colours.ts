import { evidence, type TextFields } from "./types";
import { REVIEWED_COLOUR_ALIASES } from "./colour-aliases";
import { extractPantone, normalizePantone, pantoneMentions } from "./pantone";
import { inactiveMention } from "./intent";
import { FINISH_VOCABULARY } from "./finish";
import { numeric } from "./measurements";

/**
 * Reviewed Colour Vocabulary Definitions across major families.
 */
export interface ColourItem {
  canonical: string;
  family: string;
}

export const COLOUR_DICTIONARY: Record<string, ColourItem> = {
  // Whites / Neutrals
  "black": { canonical: "Black", family: "neutral" },
  "white": { canonical: "White", family: "neutral" },
  "off-white": { canonical: "Off-White", family: "neutral" },
  "off white": { canonical: "Off-White", family: "neutral" },
  "offwhite": { canonical: "Off-White", family: "neutral" },
  "ivory": { canonical: "Ivory", family: "neutral" },
  "cream": { canonical: "Cream", family: "neutral" },
  "ecru": { canonical: "Ecru", family: "neutral" },
  "natural": { canonical: "Natural", family: "neutral" },

  // Blues
  "blue": { canonical: "Blue", family: "blue" },
  "navy": { canonical: "Navy", family: "blue" },
  "navy blue": { canonical: "Navy Blue", family: "blue" },
  "royal blue": { canonical: "Royal Blue", family: "blue" },
  "sky blue": { canonical: "Sky Blue", family: "blue" },
  "baby blue": { canonical: "Baby Blue", family: "blue" },
  "cobalt": { canonical: "Cobalt", family: "blue" },
  "cobalt blue": { canonical: "Cobalt Blue", family: "blue" },
  "indigo": { canonical: "Indigo", family: "blue" },
  "denim blue": { canonical: "Denim Blue", family: "blue" },
  "petrol blue": { canonical: "Petrol Blue", family: "blue" },
  "teal": { canonical: "Teal", family: "blue" },
  "turquoise": { canonical: "Turquoise", family: "blue" },

  // Greens
  "green": { canonical: "Green", family: "green" },
  "olive": { canonical: "Olive", family: "green" },
  "olive green": { canonical: "Olive Green", family: "green" },
  "sage": { canonical: "Sage", family: "green" },
  "sage green": { canonical: "Sage Green", family: "green" },
  "mint": { canonical: "Mint", family: "green" },
  "mint green": { canonical: "Mint Green", family: "green" },
  "emerald": { canonical: "Emerald", family: "green" },
  "emerald green": { canonical: "Emerald Green", family: "green" },
  "forest green": { canonical: "Forest Green", family: "green" },
  "bottle green": { canonical: "Bottle Green", family: "green" },

  // Reds / Wines
  "red": { canonical: "Red", family: "red" },
  "maroon": { canonical: "Maroon", family: "red" },
  "burgundy": { canonical: "Burgundy", family: "red" },
  "wine": { canonical: "Wine", family: "red" },
  "crimson": { canonical: "Crimson", family: "red" },
  "rust": { canonical: "Rust", family: "red" },

  // Pinks / Peaches
  "pink": { canonical: "Pink", family: "pink" },
  "blush": { canonical: "Blush", family: "pink" },
  "blush pink": { canonical: "Blush Pink", family: "pink" },
  "rose": { canonical: "Rose", family: "pink" },
  "dusty rose": { canonical: "Dusty Rose", family: "pink" },
  "dusty pink": { canonical: "Dusty Pink", family: "pink" },
  "salmon": { canonical: "Salmon", family: "pink" },
  "peach": { canonical: "Peach", family: "pink" },
  "coral": { canonical: "Coral", family: "pink" },

  // Oranges / Earthy
  "orange": { canonical: "Orange", family: "orange" },
  "burnt orange": { canonical: "Burnt Orange", family: "orange" },
  "terracotta": { canonical: "Terracotta", family: "orange" },

  // Yellows
  "yellow": { canonical: "Yellow", family: "yellow" },
  "mustard": { canonical: "Mustard", family: "yellow" },
  "mustard yellow": { canonical: "Mustard Yellow", family: "yellow" },
  "lemon": { canonical: "Lemon", family: "yellow" },
  "lemon yellow": { canonical: "Lemon Yellow", family: "yellow" },
  "gold": { canonical: "Gold", family: "yellow" },

  // Purples
  "purple": { canonical: "Purple", family: "purple" },
  "violet": { canonical: "Violet", family: "purple" },
  "lavender": { canonical: "Lavender", family: "purple" },
  "lilac": { canonical: "Lilac", family: "purple" },
  "plum": { canonical: "Plum", family: "purple" },
  "mauve": { canonical: "Mauve", family: "purple" },

  // Browns / Tans
  "brown": { canonical: "Brown", family: "brown" },
  "chocolate": { canonical: "Chocolate", family: "brown" },
  "chocolate brown": { canonical: "Chocolate Brown", family: "brown" },
  "coffee": { canonical: "Coffee", family: "brown" },
  "camel": { canonical: "Camel", family: "brown" },
  "tan": { canonical: "Tan", family: "brown" },
  "beige": { canonical: "Beige", family: "brown" },
  "khaki": { canonical: "Khaki", family: "brown" },
  "taupe": { canonical: "Taupe", family: "brown" },
  "stone": { canonical: "Stone", family: "grey" },

  // Greys
  "grey": { canonical: "Grey", family: "grey" },
  "gray": { canonical: "Gray", family: "grey" },
  "charcoal": { canonical: "Charcoal", family: "grey" },
  "charcoal grey": { canonical: "Charcoal Grey", family: "grey" },
  "charcoal gray": { canonical: "Charcoal Gray", family: "grey" },
  "silver": { canonical: "Silver", family: "grey" },
  "slate": { canonical: "Slate", family: "grey" },
  "slate grey": { canonical: "Slate Grey", family: "grey" },
  "slate gray": { canonical: "Slate Gray", family: "grey" },
  "anthracite": { canonical: "Anthracite", family: "grey" },

  // Neons / Fluorescents
  "neon green": { canonical: "Neon Green", family: "neon" },
  "neon pink": { canonical: "Neon Pink", family: "neon" },
  "neon yellow": { canonical: "Neon Yellow", family: "neon" },
  "neon orange": { canonical: "Neon Orange", family: "neon" },
  "neon blue": { canonical: "Neon Blue", family: "neon" },
  "fluorescent yellow": { canonical: "Fluorescent Yellow", family: "neon" },
  "fluorescent green": { canonical: "Fluorescent Green", family: "neon" },
  "fluorescent orange": { canonical: "Fluorescent Orange", family: "neon" },
  "fluorescent pink": { canonical: "Fluorescent Pink", family: "neon" },
};

/**
 * Reviewed Modifiers.
 */
export const MODIFIERS = [
  "dark", "light", "medium", "deep", "pale", "bright", "muted",
  "dusty", "pastel", "warm", "cool", "washed", "faded", "rich",
  "fluo", "fluorescent", "neon", "neo", "heather", "marl", "melange",
];

/**
 * Modifier abbreviations.
 */
export const MODIFIER_ABBREVIATIONS: Record<string, string> = {
  d: "Dark", l: "Light", mel: "Melange",
  "dk": "Dark",
  "dk.": "Dark",
  "drk": "Dark",
  "drk.": "Dark",
  "dark": "Dark",
  "lt": "Light",
  "lt.": "Light",
  "lgt": "Light",
  "lgt.": "Light",
  "light": "Light",
  "med": "Medium",
  "med.": "Medium",
  "md": "Medium",
  "md.": "Medium",
  "mid": "Medium",
  "medium": "Medium",
  "fluo": "Fluorescent",
  "fluorescent": "Fluorescent",
  "neo": "Neon",
  "neon": "Neon",
  "pastel": "Pastel",
  "pstl": "Pastel",
  "heather": "Heather",
  "htr": "Heather",
  "marl": "Marl",
  "mrl": "Marl",
};

/**
 * Reviewed Base Colour Aliases and Abbreviations.
 */
export const BASE_COLOUR_ALIASES: Record<string, string> = {
  ...REVIEWED_COLOUR_ALIASES,
  "blu": "Blue",
  "blue": "Blue",
  "nvy": "Navy",
  "navy": "Navy",
  "navy blue": "Navy Blue",
  "blk": "Black",
  "blck": "Black",
  "black": "Black",
  "wht": "White",
  "whte": "White",
  "white": "White",
  "gry": "Grey",
  "grey": "Grey",
  "gray": "Gray",
  "grn": "Green",
  "green": "Green",
  "yel": "Yellow",
  "ylw": "Yellow",
  "yellow": "Yellow",
  "org": "Orange",
  "orng": "Orange",
  "orange": "Orange",
  "brn": "Brown",
  "brwn": "Brown",
  "brown": "Brown",
  "mrn": "Maroon",
  "maroon": "Maroon",
  "purp": "Purple",
  "purple": "Purple",
  "charc": "Charcoal",
  "chrc": "Charcoal",
  "charcoal": "Charcoal",
  "offwhite": "Off-White",
  "off white": "Off-White",
  "off-white": "Off-White",
};

/**
 * Resolves a base colour token against base aliases or the full colour dictionary.
 */
export function resolveBaseColour(name: string): string | undefined {
  const clean = name.toLowerCase().trim().replace(/[.,;]+$/, "");
  if (BASE_COLOUR_ALIASES[clean]) {
    return BASE_COLOUR_ALIASES[clean];
  }
  if (COLOUR_DICTIONARY[clean]) {
    return COLOUR_DICTIONARY[clean].canonical;
  }
  return undefined;
}

/**
 * Regex string matching all base colours, multi-word phrases first.
 */
const sortedDictionaryKeys = Object.keys(COLOUR_DICTIONARY).sort((a, b) => b.length - a.length);
export const COLOUR_BASE_REGEX_STRING = sortedDictionaryKeys.map(k => k.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")).join("|");

/**
 * Expanded full colour regex string including abbreviations and modified combinations.
 */
export const COLOUR = [
  // Safe trade abbreviations in an inquiry; high-risk codes stay label-only.
  "nvy", "blk", "wht", "blck", "gry", "grn", "ylw", "yel", "brn", "mrn", "pnk", "olv", "owt", "opw", "blu",
  // Multi-word neons and modified
  "neon green", "neon pink", "neon yellow", "neon orange", "neon blue",
  "fluorescent yellow", "fluorescent green", "fluorescent orange", "fluorescent pink",
  "royal blue", "navy blue", "sky blue", "sky blu", "sky\\. blu", "sky-blu", "sky-blue", "skyblue", "baby blue", "cobalt blue", "denim blue", "petrol blue",
  "powder blue", "pwd blu", "pwd\\. blu",
  "forest green", "bottle green", "olive green", "sage green", "mint green", "emerald green",
  "btl grn", "btl\\. grn", "b\\.green", "frst grn", "for grn", "army grn", "mnt grn", "olv grn",
  "burnt orange", "dusty rose", "dusty pink", "blush pink", "mustard yellow", "lemon yellow",
  "chocolate brown", "charcoal grey", "charcoal gray", "slate grey", "slate gray",
  "light grey", "light gray", "dark grey", "dark gray", "dark blue", "light blue", "deep navy",
  "off-white", "off white", "offwhite", "off wht", "off\\. wht", "off-wht",
  "opt wht", "opt\\. wht", "opt white", "opt\\. white", "optic white", "optical white", "bright white",
  "jet blk", "j\\.blk", "baby pink", "bby pnk", "b\\.pink",
  // Abbreviations + colours
  "char gry", "char\\. gry", "char grey", "char\\. grey", "charc gry", "charc grey",
  "dk blue", "dk\\. blue", "drk blue", "drk\\. blue", "lt blue", "lt\\. blu", "lt\\. blue", "lgt blue", "lgt\\. blue", "med blue", "med\\. blue", "md blue", "md\\. blue",
  "dk grey", "dk\\. grey", "drk grey", "drk\\. grey", "lt grey", "lt\\. grey", "lgt grey", "lgt\\. grey", "dk gray", "dk\\. gray", "drk gray", "drk\\. gray", "lt gray", "lt\\. gray", "lgt gray", "lgt\\. gray",
  "dk green", "dk\\. green", "drk green", "drk\\. green", "lt green", "lt\\. green", "lgt green", "lgt\\. green",
  "drk blu", "dk blu", "lt blu", "lgt blu", "lt gry", "lgt gry", "dk nvy", "drk nvy", "dk\\. nvy", "drk\\. nvy", "d\\.nvy",
  // Base single-word colours
  "navy", "blue", "black", "white", "red", "green", "beige", "grey", "gray", "charcoal", "sage",
  "pink", "yellow", "orange", "purple", "brown", "teal", "maroon", "ivory", "cream", "olive",
  "burgundy", "peach", "ecru", "natural", "cobalt", "indigo", "turquoise", "mint", "emerald",
  "wine", "crimson", "rust", "blush", "rose", "salmon", "coral", "terracotta", "mustard", "lemon",
  "gold", "violet", "lavender", "lilac", "plum", "mauve", "chocolate", "coffee", "camel", "tan",
  "khaki", "taupe", "stone", "silver", "slate", "anthracite",
].join("|");

export const PER_COLOUR = /\b(?:per[\s-]+colou?r|per[\s-]+col|colou?r[\s-]*wise)\b/i;

/**
 * Explicit label patterns for colour / shade.
 */
export const SHADE_LABEL_PATTERN =
  "(?:fabric\\s+(?:colou?r|shade)|required\\s+shade|dye\\s+(?:colou?r|shade)|colou?r\\s+required|colou?rway|colorway|shades?|colou?rs?|col\\.?)(?!\\s+(?:fastness|card|code|system|swatch))";

/**
 * Splits compound values into distinct colour candidates while protecting
 * slashes inside modifier combinations like "Med / Blue", "Dk / Navy", "drk / blu".
 */
export function splitColourList(raw: string): string[] {
  const modifierSlashRegex = /\b(dk|dark|drk|lt|light|lgt|med|medium|md|deep|pale|bright|muted|dusty|pastel|warm|cool|washed|faded|rich)\s*\/\s*([a-zA-Z.-]+)\b/gi;
  let protectedRaw = raw.replace(modifierSlashRegex, (_m, mod, base) => `${mod}__SLASH__${base}`);
  protectedRaw = protectedRaw.replace(/\b([a-z]+)-([a-z]+)\b/gi, (phrase, first, second) =>
    resolveBaseColour(first) && resolveBaseColour(second) ? `${first}+${second}` : phrase);
  // Slash is part of a few reviewed shade codes, rather than a list separator.
  for (const alias of Object.keys(BASE_COLOUR_ALIASES).filter(key => key.includes("/"))) {
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    protectedRaw = protectedRaw.replace(new RegExp(`(?<![\\w])${escaped}(?![\\w])`, "gi"), match => match.replace(/\//g, "__CODE_SLASH__"));
  }

  // Protect commas within numbers (e.g. 1,250)
  protectedRaw = protectedRaw.replace(/(\d),(\d{3})\b/g, "$1__COMMA__$2");

  const parts = protectedRaw
    .split(/(?:\s*[,;+&]\s*|\s+and\s+|\s*\/\s*)/i)
    .map(p => p.replace(/__SLASH__/g, " / ").replace(/__CODE_SLASH__/g, "/").replace(/__COMMA__/g, ",").trim())
    .filter(Boolean);

  return parts;
}

/**
 * Normalizes a detected colour string into a clean editable name,
 * expanding abbreviations while keeping original source string.
 */
export function normalizeColour(raw: string): { name: string; sourceText: string } {
  const trimmed = raw.trim().replace(/^[:=—–-]\s*/, "").replace(/[;,.\n]+$/, "").trim();
  const lower = trimmed.toLowerCase();
  const pantone = normalizePantone(trimmed);
  if (pantone) return { name: pantone, sourceText: trimmed };

  // 0. Direct base alias or dictionary match:
  // e.g. "blk" -> "Black", "nvy" -> "Navy", "royal blue" -> "Royal Blue", "neon green" -> "Neon Green"
  const directBase = resolveBaseColour(lower);
  if (directBase) {
    return {
      name: directBase,
      sourceText: trimmed,
    };
  }

  // 1. Check postfix modifier: e.g. "Blue (Drk)", "blue (dark)", "navy - deep", "navy - dk"
  const postMatch = trimmed.match(/^([a-zA-Z.-]+)(?:\s*\(\s*|\s*[-–—]\s*|\s+)([a-zA-Z.-]+)\s*\)?$/);
  if (postMatch) {
    const baseToken = postMatch[1].toLowerCase().replace(/[.,;]+$/, "");
    const modToken = postMatch[2].toLowerCase().replace(/[.,;]+$/, "");
    const canonicalBase = resolveBaseColour(baseToken);
    const canonicalMod =
      MODIFIER_ABBREVIATIONS[modToken] ||
      (MODIFIERS.includes(modToken) ? modToken.charAt(0).toUpperCase() + modToken.slice(1) : undefined);
    if (canonicalBase && canonicalMod) {
      return {
        name: `${canonicalMod} ${canonicalBase}`,
        sourceText: trimmed,
      };
    }
  }

  // 2. Check prefix modifier with space, dot, hyphen, slash, en-dash, etc.:
  // e.g. "SHADE - Drk Blu" -> "Dark Blue"
  // "col: LT GRY" -> "Light Grey"
  // "Dk.Nvy" -> "Dark Navy"
  // "dark-blue" -> "Dark Blue"
  // "Med / Blue" -> "Medium Blue"
  // "Dk.Blue" -> "Dark Blue"
  // "drk. blu" -> "Dark Blue"
  const prefixMatch = trimmed.match(/^([a-zA-Z]+(?:\.|\b))\s*(?:[-/\\–—]|\.|\s+)\s*([a-zA-Z.\s-]+)$/);
  if (prefixMatch) {
    const p1 = prefixMatch[1].toLowerCase().replace(/\.$/, "");
    const rest = prefixMatch[2].toLowerCase().replace(/^\.+/, "").replace(/[.,;]+$/, "");
    const canonicalMod =
      MODIFIER_ABBREVIATIONS[p1] ||
      MODIFIER_ABBREVIATIONS[prefixMatch[1].toLowerCase()] ||
      (MODIFIERS.includes(p1) ? p1.charAt(0).toUpperCase() + p1.slice(1) : undefined);
    const canonicalBase = resolveBaseColour(rest);
    if (canonicalMod && canonicalBase) {
      return {
        name: `${canonicalMod} ${canonicalBase}`,
        sourceText: trimmed,
      };
    }
  }

  // 4. Standard modifier + dictionary match:
  const modMatch = trimmed.match(/^([a-zA-Z]+)\s+([a-zA-Z -]+)$/);
  if (modMatch) {
    const mod = modMatch[1].toLowerCase();
    const base = modMatch[2].toLowerCase();
    if (MODIFIERS.includes(mod) && COLOUR_DICTIONARY[base]) {
      const capMod = mod.charAt(0).toUpperCase() + mod.slice(1);
      const capBase = COLOUR_DICTIONARY[base].canonical;
      return {
        name: `${capMod} ${capBase}`,
        sourceText: trimmed,
      };
    }
  }

  // 5. Open-ended / unfamiliar shade names & codes (e.g. "Ocean Mist", "Customer shade ABC-27", "Pantone 19-4052 TCX"):
  // Preserve casing as written when it contains uppercase characters; title-case purely lowercase words.
  const hasUpper = /[A-Z]/.test(trimmed);
  const name = hasUpper ? trimmed : trimmed.replace(/\b\w/g, c => c.toUpperCase());
  return {
    name,
    sourceText: trimmed,
  };
}

/**
 * Checks whether a word like "peach" or "orange" is functioning as a finish rather than a colour.
 */
export function isFinishRole(matchIndex: number, text: string, matchLength: number): boolean {
  const after = text.slice(matchIndex + matchLength).split(/[;,.\n]/)[0];
  if (/^\s*(?:finish|treatment|effect|texture)\b/i.test(after)) {
    return true;
  }
  const before = text.slice(Math.max(0, matchIndex - 30), matchIndex);
  if (/\b(?:finish|treatment)\s*[:=]?\s*$/i.test(before)) {
    return true;
  }
  return false;
}

/**
 * Checks whether a word like "white" is functioning as a yarn descriptor (e.g. "white warp yarn").
 */
export function isYarnRole(matchIndex: number, text: string, matchLength: number): boolean {
  const after = text.slice(matchIndex + matchLength).split(/[;,.\n]/)[0];
  if (/^\s*(?:warp|weft|combed|carded|ringspun|filament)?\s*yarn\b/i.test(after)) {
    return true;
  }
  const before = text.slice(Math.max(0, matchIndex - 25), matchIndex);
  if (/\b(?:warp|weft|yarn)\s*(?:colou?r)?\s*[:=]?\s*$/i.test(before)) {
    return true;
  }
  const clauseStart = Math.max(0, text.lastIndexOf(";", matchIndex) + 1, text.lastIndexOf("\n", matchIndex) + 1);
  const clauseBefore = text.slice(clauseStart, matchIndex);
  if (/\b(?:warp|weft)\s*[:=-]/i.test(clauseBefore)) {
    return true;
  }
  return false;
}

/**
 * Main plain-text colour extraction engine.
 */
export function extractPlainColours(text: string, result: TextFields) {
  if (result.coloursConfirmed) return;
  extractPantone(text, result);

  // 1. REFERENCE-ONLY INSTRUCTIONS (no invented named colour)
  const refMatches = [
    /\b(?:match\s+approved\s+swatch|as\s+per\s+attached\s+shade\s+card|same\s+shade\s+as\s+previous\s+lot)\b/gi,
  ];
  for (const regex of refMatches) {
    for (const match of text.matchAll(regex)) {
      result.colourReferences = result.colourReferences || [];
      const note = match[0].trim().replace(/^./, c => c.toUpperCase());
      result.colourReferences.push(note);
      result.notes = [result.notes, `Colour reference: ${note}`].filter(Boolean).join("\n");
    }
  }

  if (/\b(?:colou?rs?|shades?)\s+to\s+be\s+confirmed\b/i.test(text)) {
    result.colourReferences = result.colourReferences || [];
    result.colourReferences.push("Exact colours to be confirmed");
    result.notes = [result.notes, "Exact colours to be confirmed"].filter(Boolean).join("\n");
  }

  // 2. EXCLUSIONS & PREFERENCES:
  // e.g. "no red", "avoid yellow undertone", "navy preferred, black acceptable"
  const exclusionMatch = text.match(/\b(?:no|avoid|without)\s+([a-zA-Z\s-]+?)(?:\s+undertone|\s+colou?r|\s+shade)?(?:[;.,\n]|$)/i);
  if (exclusionMatch && !/\b(?:silicone|resin|chemical|antimicrobial)\b/i.test(exclusionMatch[0])) {
    const rawEx = exclusionMatch[1].trim();
    if (new RegExp(`\\b(?:${COLOUR})\\b`, "i").test(rawEx)) {
      result.colourExclusions = result.colourExclusions || [];
      result.colourExclusions.push(`No ${rawEx.toLowerCase()}`);
      result.notes = [result.notes, `Colour exclusion: No ${rawEx.toLowerCase()}`].filter(Boolean).join("\n");
    }
  }

  // Preference: "navy preferred, black acceptable"
  const prefMatch = text.match(/\b([a-zA-Z\s]+?)\s+preferred[;,]?\s*([a-zA-Z\s]+?)\s+acceptable\b/i);
  if (prefMatch) {
    const prefNote = `Colour preference: ${prefMatch[1].trim()} preferred, ${prefMatch[2].trim()} acceptable`;
    result.notes = [result.notes, prefNote].filter(Boolean).join("\n");
  }

  // Replacement / correction: "replace navy with royal blue"
  const replaceMatch = text.match(/\breplace\s+([a-zA-Z\s]+?)\s+with\s+([a-zA-Z\s]+?)(?:[;.,\n]|$)/i);
  if (replaceMatch) {
    const superseded = replaceMatch[1].trim();
    const active = replaceMatch[2].trim();
    result.notes = [result.notes, `Active colour: ${active} (replacing ${superseded})`].filter(Boolean).join("\n");
  }

  // 3. ALTERNATIVES: "navy or black"
  const altMatch = text.match(/\b([a-zA-Z\s]+?)\s+or\s+([a-zA-Z\s]+?)\s*(?:[;,.\n]|$)/i);
  if (altMatch && !/\b(?:to|gsm|inches|metres|m|delivery)\b/i.test(altMatch[0])) {
    const col1 = altMatch[1].trim();
    const col2 = altMatch[2].trim();
    if (new RegExp(`^${COLOUR}$`, "i").test(col1) && new RegExp(`^${COLOUR}$`, "i").test(col2)) {
      result.colourAlternatives = [col1, col2];
      const altNote = `Colour alternatives: ${col1} or ${col2}`;
      result.notes = [result.notes, altNote].filter(Boolean).join("\n");
      result.warnings.push(`Colour has alternatives (${col1} or ${col2}); confirm intended option.`);
    }
  }

  // 4. STRIPE / PATTERN: "blue/white yarn-dyed stripe" -> pattern colourway
  const stripeMatch = text.match(/\b([a-zA-Z]+)\s*\/\s*([a-zA-Z]+)\s+(?:yarn[- ]dyed\s+)?stripe\b/i);
  if (stripeMatch) {
    const patternName = `${stripeMatch[1]} / ${stripeMatch[2]} stripe`;
    result.notes = [result.notes, `Pattern colourway: ${patternName}`].filter(Boolean).join("\n");
  }

  // 5. FUTURE SHADE NOTE: e.g. "final shade navy after approval"
  const futureMatch = text.match(/\b(?:final\s+shade|final\s+colou?r|shade\s+after\s+approval)\s+([a-zA-Z\s]+?)(?:\s+after\s+approval|[;,.\n]|$)/i);
  if (futureMatch) {
    const futureShade = futureMatch[1].trim();
    const note = `Intended future shade: ${futureShade} (after approval).`;
    result.notes = [result.notes, note].filter(Boolean).join("\n");
  }

  // 6. EXPLICIT LABELLED SHADE EXTRACTION
  // e.g. "SHADE - Dk Blue", "Colour: Navy", "COL = BLACK", "Required shade\nLight Grey", "Shade: Ocean Mist"
  const labelledRegex = new RegExp(
    `(?:^|[\\r\\n;,|])\\s*(${SHADE_LABEL_PATTERN})\\s*([:=—–-]|\\n|\\s+)\\s*([^\\r\\n!]+?(?=(?:[;,|]\\s*(?:[A-Z][a-zA-Z\\s]*[:=]|FINISH|TREATMENT|WEAVE|WIDTH|GSM|QUANTITY|QTY|SUPPLY|STATE|FABRIC|ORDER|BLEND|COMPOSITION)\\b|[;,|]\\s+(?:\\d+["']|\\d+\\s*(?:gsm|m|metres?|meters?|mtrs?|mts?|inches?|in|cm|glm|oz|kg|g\\/m2|yds?|yards?)\\b)|\\r?\\n|\\bTotal\\b|$)))`,
    "gi"
  );

  const labelledMatches = [...text.matchAll(labelledRegex)];
  const processedRanges: { start: number; end: number }[] = [];

  for (const match of labelledMatches) {
    let rawVal = match[3].trim();
    // Stop at sentence-ending period if not followed by a colour token (e.g. "Colour: Navy. 100% cotton")
    const sentenceStop = rawVal.search(/\.\s+(?!\b(?:blue|blu|grey|gray|gry|green|grn|black|blk|blck|white|wht|whte|navy|nvy|yellow|yel|ylw|orange|org|orng|red|brown|brn|brwn|maroon|mrn|purple|purp|charcoal|charc|chrc|olive|teal|beige|khaki|cream|ivory|natural|ecru|pink|rust|wine|burgundy|peach|coral|salmon|gold|silver|slate|tan|camel|violet|lavender|lilac|plum|mauve|dk|dark|drk|lt|light|lgt|med|medium|md)\b)/i);
    if (sentenceStop !== -1) {
      rawVal = rawVal.slice(0, sentenceStop).trim();
    }
    rawVal = rawVal.replace(/[.;,]+$/, "").trim();

    // Stop if rawVal is purely commercial or technical
    if (/^\d+\s*(?:gsm|m|mts|metres|inches|"|in)\b/i.test(rawVal)) continue;

    // Check for reference-only
    if (/^(?:match\s+approved\s+swatch|as\s+per\s+attached|same\s+shade|to\s+be\s+confirmed)/i.test(rawVal)) {
      continue;
    }

    // Split compound values (e.g. "Navy, Black and Olive", "Dk Blue", "Pantone 19-4052 TCX", "Med / Blue")
    const parts = splitColourList(rawVal);

    for (const part of parts) {
      if (/^\d+\s*(?:m|metres?|meters?|mts?|inches?|in|cm|gsm|glm|oz|kg|g\/m2|yds?|yards?)\b/i.test(part) || /^\d+\s*["']/.test(part) || /^\d+$/.test(part.trim())) continue;
      if (/\b(?:width|gsm|glm|construction|count|blend|composition|lead\s*time|delivery|moq)\b/i.test(part)) continue;
      if (/^\s*(?:finish|treatment|weave|supply|state|fabric\s+state|qty|quantity|order|gsm|width|count|construction|blend|composition)\s*[:=—–-]/i.test(part) || /^[A-Z][a-zA-Z\s]{1,25}[:=]/.test(part) || part.includes(":") || part.includes("=")) continue;
      if (FINISH_VOCABULARY[part.toLowerCase().trim()] && !resolveBaseColour(part)) continue;

      // Extract attached quantity at end: e.g. "BLK—1,250 m", "CHAR GRY—750 metres", "DK NVY—1K mtrs", "Navy: 2000m"
      const qtyMatch = part.match(/\s*[:=–—-]*(?:@\s*)?(\d[\d,]*(?:\.\d+)?\s*[kK]?)\s*\(?\s*(?:metres?|meters?|mtrs?|mts|m)\b\s*\)?\s*$/i);
      let colourPart = part;
      let qtyStr = "";
      if (qtyMatch) {
        colourPart = part.slice(0, qtyMatch.index).trim();
        const rawQty = qtyMatch[1].replace(/,/g, "").trim();
        qtyStr = String(numeric(rawQty));
      }

      const partStart = match.index! + match[0].indexOf(part);
      if (inactiveMention(text, partStart, partStart + part.length)) continue;
      if (/^(?:TBC|TBA|AST|ASST|ASSORTED|COLOURS? LATER|SHADES? LATER)$/i.test(colourPart)) {
        const reason = `Colour reference needs confirmation: ${colourPart} (exact colours to be confirmed).`;
        result.colourReferences = [...(result.colourReferences || []), reason];
        result.warnings.push(reason);
        result.evidence.push({ field: "colour", kind: "unresolved", text: colourPart, start: partStart, end: partStart + colourPart.length, reason });
        continue;
      }
      if (/^(?:OW|GR|BG)$/i.test(colourPart)) {
        const reason = `Ambiguous colour code ${colourPart.toUpperCase()}; confirm the full shade name.`;
        result.warnings.push(reason);
        result.colourReferences = [...(result.colourReferences || []), reason];
        result.evidence.push({ field: "colour", kind: "unresolved", text: colourPart, start: partStart, end: partStart + colourPart.length, reason });
        continue;
      }
      const normalized = normalizeColour(colourPart);
      const existing = result.colours.find(c => c.name.toLowerCase() === normalized.name.toLowerCase());
      if (!existing) {
        result.colours.push({
          name: normalized.name,
          sourceText: normalized.sourceText,
          metres: qtyStr,
        });
      } else if (qtyStr && !existing.metres) {
        existing.metres = qtyStr;
      }
      const partIdx = match[0].indexOf(part);
      const start = partIdx !== -1 ? match.index! + partIdx : match.index!;
      const end = start + part.length;
      result.evidence.push({ field: "colour", kind: "explicit", text: part, start, end });
      if (qtyStr) {
        result.evidence.push({ field: "colour quantity", kind: "explicit", text: `${normalized.name}: ${qtyMatch![0].trim()}`, value: Number(qtyStr), unit: "m", start, end });
      }
    }

    processedRanges.push({ start: match.index!, end: match.index! + match[0].length });
  }

  // 7. VOCABULARY SCANNING (Natural text, e.g. "Need this fabric in dark blue", "Navy blue chahiye", "black 2000m")
  const wordsRegex = new RegExp(`\\b(?:${COLOUR})\\b`, "gi");
  for (const match of text.matchAll(wordsRegex)) {
    const idx = match.index!;
    const rawMatch = match[0];
    const matchEnd = idx + rawMatch.length;

    // If within an already processed explicit label span, skip
    if (processedRanges.some(r => r.start <= idx && matchEnd <= r.end)) {
      continue;
    }

    const before = text.slice(Math.max(0, idx - 40), idx);
    const after = text.slice(matchEnd);
    if (result.evidence.some(e => e.field === "blend" && e.start <= idx && matchEnd <= e.end)) continue;
    if (inactiveMention(text, idx, matchEnd)) continue;
    if (pantoneMentions(text).some(p => p.index! <= idx && matchEnd <= p.index! + p[0].length)) continue;
    if (isFinishRole(idx, text, rawMatch.length)) continue;

    // Context disambiguation
    const listContext = new RegExp(`(?:${COLOUR})\\s*(?:[,/–—|\\-]|and)\\s*$|\\bcolou?rs?\\s*[:=-]?\\s*$`, "i").test(before)
      || new RegExp(`^\\s*(?:[,/–—|\\-]|and)\\s*(?:${COLOUR})\\b`, "i").test(after);
    const labelledColour = /\bcolou?rs?\s*[:=-]?\s*$/i.test(before);
    const previousColour = new RegExp(`(?:${COLOUR})\\s*(?:[,/–—|\\-]|and)\\s*$`, "i").test(before);
    const newlineColourContext = new RegExp(`(?:${COLOUR})\\s*(?:\\d+\\s*(?:m|metres?|meters?|mtrs?)\\b)?\\s*[\\r\\n]+\\s*$`, "i").test(before)
      || /\b(?:requirement|specification|details?|fabric)\s*[:=-]?\s*[\r\n]+\s*$/i.test(before);
    const pipeContext = /\|\s*$/i.test(before) || /^\s*\|/i.test(after);
    const clauseContext = /;\s*$/i.test(before) || /^\s*;/i.test(after) || /\bspecification\b/i.test(before);
    const directColourIntent = /\b(?:in|dyed?|shade|colou?r|want|need|dye\s+it|quote\s+(?:cotton\s+)?poplin,\s*)\s*$/i.test(before)
      || /^\s*(?:chahiye|shade\b)/i.test(after);

    // Grey alone denotes greige state unless in colour list or explicit label
    if (/^gr[ae]y$/i.test(rawMatch) && !labelledColour && !previousColour && !newlineColourContext && !pipeContext && !directColourIntent && !clauseContext) continue;

    // Peach disambiguation (finish vs colour)
    if (/^peach$/i.test(rawMatch)) {
      const isFinish = /^\s+(?:finish|treatment)\b/i.test(after) || isFinishRole(idx, text, rawMatch.length);
      const isColour = /\b(?:colou?r|shade|hue|tone)\b/i.test(after.split(/[;,.\n]/)[0])
        || labelledColour || directColourIntent || pipeContext || newlineColourContext || clauseContext;
      if (isFinish || !isColour) continue;
    }

    // Orange peel finish disambiguation
    if (/^orange$/i.test(rawMatch) && isFinishRole(idx, text, rawMatch.length)) continue;

    // Yarn descriptor disambiguation (e.g. "FD White", "White warp yarn")
    if (isYarnRole(idx, text, rawMatch.length)) continue;

    // Commercial prose exclusions (green certification, white paper, black Friday, etc.)
    if (/^\s+(?:paper|friday|initiative|certification|delivery|signal)\b/i.test(after)) continue;

    // Colour fastness grade exclusion
    if (/\b(?:fastness\s*(?:to\s+[a-z]+\s*)?(?:grade|rating)?\s*[:=]?\s*)$/i.test(before)) continue;

    // Attached per-colour quantity: e.g. "navy 2000m", "black: 1500m", "olive - 1000 mts", "BLK—1,250 m"
    const amount = after.match(/^\s*[:=–—-]*(?:@\s*)?(\d[\d,]*(?:\.\d+)?\s*[kK]?)\s*\(?\s*(?:metres?|meters?|mtrs?|mts|m)\b\s*\)?/i);

    // Commercial adjective guard for orange/green/yellow/cream/olive
    if (/^(?:orange|green|yellow|cream|olive)$/i.test(rawMatch) && !listContext && !newlineColourContext && !PER_COLOUR.test(text) && !amount && !labelledColour && !pipeContext && !directColourIntent && !clauseContext) {
      continue;
    }

    const normalized = normalizeColour(rawMatch);
    const existing = result.colours.find(item => item.name.toLowerCase() === normalized.name.toLowerCase());
    const qtyStr = amount ? amount[1].replace(/,/g, "") : "";

    if (!existing) {
      result.colours.push({
        name: normalized.name,
        sourceText: normalized.sourceText,
        metres: qtyStr,
      });
    } else if (amount && existing.metres && existing.metres !== qtyStr) {
      existing.metres = "";
      result.warnings.push(`Conflicting quantities for ${existing.name}; retain the source amounts and confirm.`);
    }

    result.evidence.push(evidence("colour", match));
  }

  // 8. DISTRIBUTE "EACH" QUANTITIES: e.g. "500m each in navy and black"
  const eachMatch = text.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:m|metres?|meters?|mts)\s+each\s+in\s+([a-zA-Z\s,and+&]+)(?:[;,.\n]|$)/i);
  if (eachMatch) {
    const eachAmount = eachMatch[1].replace(/,/g, "");
    for (const colour of result.colours) {
      if (!colour.metres) {
        colour.metres = eachAmount;
      }
    }
  }

  // 9. QUANTITY MISMATCH WARNING & UNALLOCATED METRES
  if (result.quantity && result.colours.length) {
    const specified = result.colours.filter(c => c.metres);
    if (specified.length === result.colours.length) {
      const sum = specified.reduce((total, c) => total + Number(c.metres), 0);
      if (sum !== result.quantity) {
        const diff = result.quantity - sum;
        if (diff > 0) {
          result.warnings.push(`Quantity mismatch: colour quantities total ${sum} m; explicit total is ${result.quantity} m. Both values were preserved.`);
          result.notes = [result.notes, `${diff} m unallocated across colours.`].filter(Boolean).join("\n");
        } else {
          result.warnings.push(`Quantity mismatch: colour quantities total ${sum} m; explicit total is ${result.quantity} m. Both values were preserved.`);
        }
      }
    }
  }
}
