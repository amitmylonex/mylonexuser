import { evidence, type TextFields } from "./types.js";
import { FIBRE_PATTERN } from "./fibres.js";

export const NUMBER = "(?:\\d{1,3}(?:,\\d{2,3})+|\\d+)(?:\\.\\d+)?(?:k)?";
export const numeric = (text: string) => Number(text.replace(/,/g, "").replace(/k$/i, "")) * (/k$/i.test(text) ? 1000 : 1);

// The core GSM unit pattern recognizes all standard and informal variants of:
// 1. Gram token variants:
//    - g, g., gm, gm., g.m, g.m., g m, gms, gms., g.m.s., gram, grams
//    - Allows ordinary spaces, nonbreaking spaces (\u00A0), dots
// 2. Square-metre token variants:
//    - m², m2, m^2, sqm, sq.m, sq.m., sq m, sq. m., sqmt, sqmt., sq mt, sq. mt., sq mtr, sq mtrs,
//      sq meter, sq meters, sq metre, sq metres, square meter, square meters, square metre, square metres
// 3. Combined gram and area tokens through:
//    - "/", "per", parenthesized units "(GM/SQMT)", bracketed units "[G.M. / SQMT]"
// 4. Direct GSM:
//    - GSM, G.S.M., G S M, G. S. M.
// 5. Inverse-area notation:
//    - g m−2, g·m⁻², g-m-2, g.m⁻²
export const GRAM_TOKEN =
  "(?:" +
  "grams?" +
  "|g[\\s.]*m[\\s.]*s\\.?" +
  "|g[\\s.]*m\\.?" +
  "|g\\.?" +
  ")";

export const AREA_M2_TOKEN =
  "(?:" +
  "m[²2]|m\\^2" +
  "|(?:sq\\.?|square)\\s*met(?:re|er)s?" +
  "|sq[\\s.]*(?:mtrs?|mts?)\\.?" +
  "|sq[\\s.]*m\\.?" +
  ")";

export const GRAM_AREA_SEPARATOR = "(?:\\s*(?:\\/|\\bper\\b)\\s*)";

export const GSM_COMPOUND_UNIT = `(?:${GRAM_TOKEN}${GRAM_AREA_SEPARATOR}${AREA_M2_TOKEN})`;

export const GSM_INVERSE_UNIT = "(?:g[\\s·•.-]*m(?:⁻²|[−-]2))";

export const GSM_DIRECT_TOKEN = "(?:g\\.?\\s*s\\.?\\s*m\\.?)";

export const GSM_UNIT_CORE =
  "(?:" +
  GSM_DIRECT_TOKEN +
  "|" + GSM_INVERSE_UNIT +
  "|" + GSM_COMPOUND_UNIT +
  ")";

export const GSM_UNIT = `(?:\\(|\\[)?\\s*${GSM_UNIT_CORE}\\s*(?:\\)|\\])?`;

// Specific GSM / grammage labels that intrinsically establish area-weight context:
export const SPECIFIC_GSM_LABEL = "(?:fabric\\s+grammage|grammage|fabric\\s+gsm|g\\.?\\s*s\\.?\\s*m\\.?)";

// Generic weight labels that alone require an explicit area unit:
export const GENERIC_WEIGHT_LABEL = "(?:fabric\\s+(?:weight|wt\\.?)|(?:required|nominal|target)\\s+(?:weight|wt\\.?)|weight|wt\\b\\.?)";

export const GSM_LABEL = `(?:${SPECIFIC_GSM_LABEL}|${GENERIC_WEIGHT_LABEL})`;

export const NON_GSM_CONTEXT = /\b(?:sample|swatch|courier|package|box|parcel|shipment|spool|cone|roll|carton|bale|container|garment|apparel|product|piece|article|code|sku|style|order|po|lot|item|ref|reference)\s*(?:weight|wt)?\b/i;
export const LINEAR_MASS = new RegExp(`\\b${NUMBER}\\s*${GRAM_TOKEN}\\s*(?:\\/|\\bper\\b)\\s*(?:linear\\s+|running\\s+)?(?:metres?|meters?|mtrs?|m|yards?|yds?)(?![²2^]|\\s*[²2^]|\\s*sq)`, "iu");

export const DISALLOWED_AFTER = /^\s*(?:kg\b|kilograms?\b|g\/m\b|met(?:re|er)s?\b|mtrs?\b|mts?\b|m\b|yards?\b|yds?\b|inches\b|inch\b|ins?\b|["″”]|cms?\b|mm\b|(?:pieces?\b(?![\s-]*(?:dye|finish|wash|print))|pcs\b)|rolls?\b|%|percent\b|\/\s*m\b|\/\s*kg\b|\/\s*piece\b)/i;

export function hasClearFabricSpecification(text: string): boolean {
  // 1. Weave keywords
  if (/\b(?:twill|plain|satin|dobby|oxford|poplin|canvas|drill|sheeting|jacquard|matty|chambray|denim|gabardine|voile|cambric|lawn|georgette|chiffon|crepe|taffeta|weave)\b/i.test(text)) return true;
  // 2. Yarn count notation
  if (/\b\d{1,3}(?:s|\/1|\/2)\s*(?:[x×*]\s*\d{1,3}(?:s|\/1|\/2)?)?\b/i.test(text)) return true;
  // 3. Construction / density
  if (/\b\d{2,3}\s*[x×*/]\s*\d{2,3}\b/i.test(text) || /\b(?:epi|ppi)\b/i.test(text)) return true;
  // 4. Multi-fibre blend with percentages
  if (/\b\d{1,2}%\s*[a-z]+\s+\d{1,2}%\s*[a-z]+/i.test(text) || /\b\d{2}\s*\/\s*\d{2}\b/i.test(text)) return true;
  // 5. Technical fabric finish
  if (/\b(?:peach\s+finish|merceri[sz]ed|sanfori[sz]ed|brushed|coated)\b/i.test(text)) return true;
  // 6. Fibre + width + quantity + specific fabric property combination
  const hasFibre = new RegExp(`\\b(?:${FIBRE_PATTERN})\\b`, "i").test(text);
  const hasWidth = /\b(?:width|wide)\b|\b\d{2,3}\s*(?:["″”]|inches|inch|in|cms?)\b/i.test(text);
  const hasQty = /\b\d+\s*(?:metres?|meters?|mtrs?|m|yards?|yds?)\b/i.test(text);
  if (hasFibre && hasWidth && hasQty && /\b(?:count|construction|density|twill|plain|satin|dobby|poplin|finish|shade|colour|color)\b/i.test(text)) return true;
  return false;
}

export function hasFabricContext(text: string): boolean {
  return hasClearFabricSpecification(text);
}

/**
 * Robust, contextual GSM extraction preserving literal source spans and evidence.
 * Does not collapse ranges, bounds, tolerances or alternatives into invented numbers.
 */
export function extractGsm(text: string, result: TextFields): void {
  // If GSM was already populated (e.g. from a prior step), do not overwrite
  if (result.gsm !== undefined || result.gsmMin !== undefined || result.gsmBound !== undefined) return;

  // Ignore question prompts like "GSM?" or "What is GSM?"
  if (/\bgsm\s*\?/i.test(text) && !/\bgsm\s*[:=]?\s*\d/i.test(text)) {
    return;
  }

  // Linear mass protection: "220 gm/m" is linear mass, not area mass (GSM).
  // If the text contains linear mass without a separate GSM notation, do not parse it as GSM.
  const linearMassMatch = text.match(LINEAR_MASS);
  const textWithoutLinearMass = linearMassMatch ? text.replace(linearMassMatch[0], " ".repeat(linearMassMatch[0].length)) : text;

  // 1. REVISION & CORRECTION
  // Examples:
  // - "change 180 GSM to 190 GSM"
  // - "replace 180 with 190 GSM"
  // - "Not 180, use 190 GSM" / "not 180 gsm, final 190 gsm"
  // - "190 gsm instead of 180 gsm" / "190 gsm (revised from 180 gsm)"
  const revisionPatterns = [
    new RegExp(`\\b(?:change|replace|revise|correct|update)\\s+(${NUMBER})\\s*(?:${GSM_UNIT})?\\s*(?:to|with)\\s*(${NUMBER})\\s*(?:${GSM_UNIT})?\\b`, "iu"),
    new RegExp(`\\b(?:not|instead of)\\s+(${NUMBER})\\s*(?:${GSM_UNIT})?\\s*[,;]?\\s*(?:use|final|revised|actual|now|updated?)?\\s*(${NUMBER})\\s*(${GSM_UNIT})\\b`, "iu"),
    new RegExp(`\\b(${NUMBER})\\s*(${GSM_UNIT})\\s*(?:\\(?\\s*(?:revised from|updated from|instead of|replacing)|instead of|replacing)\\s*(${NUMBER})\\s*(?:${GSM_UNIT})?\\)?`, "iu"),
  ];

  for (const pattern of revisionPatterns) {
    const match = textWithoutLinearMass.match(pattern);
    if (match) {
      // In pattern 1 and 2: group 1 is earlier, group 2 is active
      // In pattern 3: group 1 is active, group 3 is earlier
      let earlierVal: number, activeVal: number;
      if (pattern === revisionPatterns[2]) {
        activeVal = numeric(match[1]);
        earlierVal = numeric(match[3]);
      } else {
        earlierVal = numeric(match[1]);
        activeVal = numeric(match[2]);
      }

      if (activeVal > 0) {
        result.gsm = activeVal;
        result.evidence.push(evidence("gsm", match, `Corrected to ${activeVal} GSM (replacing earlier ${earlierVal}).`));
        result.warnings.push(`Explicit GSM correction applied: ${activeVal} g/m².`);
        return;
      }
    }
  }

  // 2. TOLERANCE
  // Examples:
  // - 185 GSM ±5 GSM, 185 ± 5 GSM, 185gsm +/-5, 120 gm/m2 (+/- 4 gm/m2)
  // - 185 GSM ±5%, 185 ± 5% GSM, 185gsm +/- 5%
  // - Weight: 165 ± 5 G.M., Fabric weight 165 +/- 5 gm
  const tolPattern = new RegExp(
    `(?<![\\d.])(?:${GSM_LABEL}\\s*[:=—–-]?\\s*)?(${NUMBER})\\s*(?:${GSM_UNIT})?\\s*(?:\\(?\\s*(?:±|\\+\\/-|\\+\\s*\\/\\s*-)\\s*(${NUMBER})\\s*(%|percent)?\\s*(?:${GSM_UNIT}|${GRAM_TOKEN})?\\s*\\)?)(?:\\s*(?:${GSM_UNIT}|${GRAM_TOKEN}))?`,
    "iu"
  );
  const tolMatch = textWithoutLinearMass.match(tolPattern);
  if (tolMatch) {
    const matchSpan = tolMatch[0];
    const afterTol = textWithoutLinearMass.slice(tolMatch.index! + matchSpan.length);
    const beforeTol = textWithoutLinearMass.slice(Math.max(0, tolMatch.index! - 35), tolMatch.index!);

    const hasExplicitGsm = new RegExp(GSM_UNIT, "i").test(matchSpan) || new RegExp(`^\\s*${SPECIFIC_GSM_LABEL}`, "i").test(matchSpan);
    const isGsmTol = !NON_GSM_CONTEXT.test(beforeTol) && (hasExplicitGsm || (!DISALLOWED_AFTER.test(afterTol) && (
      new RegExp(`^\\s*${GSM_LABEL}`, "i").test(matchSpan) ||
      (new RegExp(GRAM_TOKEN, "i").test(matchSpan) && hasClearFabricSpecification(text))
    )));

    if (isGsmTol) {
      const nominal = numeric(tolMatch[1]);
      const tolRaw = numeric(tolMatch[2]);
      const isPercent = !!tolMatch[3];

      if (nominal > 0 && tolRaw > 0) {
        if (isPercent) {
          const tolAmount = Number(((nominal * tolRaw) / 100).toFixed(2));
          result.gsmTolerance = tolAmount;
          result.gsmMin = Number(Math.max(1, nominal - tolAmount).toFixed(2));
          result.gsmMax = Number((nominal + tolAmount).toFixed(2));
          result.gsmQualifier = `${nominal} ±${tolRaw}% g/m²`;
        } else {
          result.gsmTolerance = tolRaw;
          result.gsmMin = Math.max(1, nominal - tolRaw);
          result.gsmMax = nominal + tolRaw;
          result.gsmQualifier = `${nominal} ±${tolRaw} g/m²`;
        }

        result.evidence.push({
          ...evidence("gsm", tolMatch, `GSM with tolerance: ${result.gsmQualifier}.`),
          kind: "unresolved",
        });
        result.warnings.push(`gsm: ${tolMatch[0]} needs review; tolerances were retained in notes.`);
        return;
      }
    }
  }

  // 3. ALTERNATIVES
  // Examples:
  // - 180 or 200 GSM, either 180 or 200 GSM, 180 or 190 GSM acceptable
  // - 180 / 200 GSM (in explicit GSM context)
  const altPattern = new RegExp(
    `(?<![\\d.])(?:either\\s+)?(${NUMBER})\\s*(?:${GSM_UNIT})?\\s+(?:or|\\/)\\s+(${NUMBER})\\s*(${GSM_UNIT})(?:\\s+acceptable)?`,
    "iu"
  );
  const altMatch = textWithoutLinearMass.match(altPattern);
  if (altMatch) {
    const alt1 = numeric(altMatch[1]);
    const alt2 = numeric(altMatch[2]);
    if (alt1 > 0 && alt2 > 0) {
      result.gsmAlternatives = [alt1, alt2];
      result.gsmMin = Math.min(alt1, alt2);
      result.gsmMax = Math.max(alt1, alt2);
      result.gsmQualifier = `Alternatives: ${alt1} or ${alt2} g/m²`;
      result.evidence.push({
        ...evidence("gsm", altMatch, `Alternative GSM options: ${alt1} or ${alt2} g/m².`),
        kind: "unresolved",
      });
      result.warnings.push(`gsm: ${altMatch[0]} needs review; alternatives were retained in notes.`);
      return;
    }
  }

  // 4. CONTINUOUS RANGE
  // Examples:
  // - 180–190 GSM, 180 to 190 GSM, 180-190 gsm, 180 to 190 gram per square metre
  // - GSM: 180 to 190, between 180 and 190 GSM
  // - Weight: 180–190 G.M. in a clear fabric context
  const rangePatterns = [
    new RegExp(`(?<![\\d.])(${NUMBER})\\s*(?:[-–—]|to)\\s*(${NUMBER})\\s*(${GSM_UNIT})`, "iu"),
    new RegExp(`\\b(?:between)\\s+(${NUMBER})\\s+and\\s+(${NUMBER})\\s*(${GSM_UNIT})`, "iu"),
    new RegExp(`\\b(${GSM_LABEL})\\s*[:=—–-]?\\s*(${NUMBER})\\s*(?:[-–—]|to)\\s*(${NUMBER})(?:\\s*(${GSM_UNIT}|${GRAM_TOKEN}))?(?![\\p{L}\\d])`, "iu"),
  ];

  for (const pattern of rangePatterns) {
    const rangeMatch = textWithoutLinearMass.match(pattern);
    if (rangeMatch) {
      const before = text.slice(Math.max(0, rangeMatch.index! - 35), rangeMatch.index!);
      if (NON_GSM_CONTEXT.test(before)) continue;
      const after = text.slice(rangeMatch.index! + rangeMatch[0].length);
      if (NON_GSM_CONTEXT.test(after.slice(0, 30))) continue;

      const isPattern3 = pattern === rangePatterns[2];
      if (isPattern3) {
        const label = rangeMatch[1];
        const unit = rangeMatch[4];
        const isSpecificLabel = new RegExp(`^${SPECIFIC_GSM_LABEL}$`, "i").test(label.trim());
        if (!unit && !isSpecificLabel) {
          if (DISALLOWED_AFTER.test(after)) continue;
          if (!hasFabricContext(text)) continue;
        }
      }

      const min = isPattern3 ? numeric(rangeMatch[2]) : numeric(rangeMatch[1]);
      const max = isPattern3 ? numeric(rangeMatch[3]) : numeric(rangeMatch[2]);
      if (min > 0 && max > 0) {
        result.gsmMin = Math.min(min, max);
        result.gsmMax = Math.max(min, max);
        result.gsmQualifier = `Range: ${result.gsmMin}–${result.gsmMax} g/m²`;
        result.evidence.push({
          ...evidence("gsm", rangeMatch, `GSM range: ${result.gsmMin}–${result.gsmMax} g/m².`),
          kind: "unresolved",
        });
        return;
      }
    }
  }

  // 5. BOUNDS (Minimum, Strict Minimum, Maximum, Strict Maximum)
  // Examples:
  // - Minimum: at least 180 GSM, min 180 GSM, minimum 180 GSM, >= 180 GSM, not less than 180 GSM
  // - Strict minimum: above 180 GSM, more than 180 GSM, greater than 180 GSM, > 180 GSM
  // - Maximum: up to 190 GSM, max 190 GSM, maximum 190 GSM, <= 190 GSM, at most 190 GSM, not more than 190 GSM
  // - Strict maximum: below 190 GSM, under 190 GSM, less than 190 GSM, < 190 GSM
  const boundMinStrict = new RegExp(`(?:^|[^\\w])(?:above|more than|greater than|>)\\s*(${NUMBER})\\s*(${GSM_UNIT})`, "iu");
  const boundMinInclusive = new RegExp(`(?:^|[^\\w])(?:at\\s+least|min(?:imum)?\\.?|not\\s+less\\s+than|>=)\\s*(${NUMBER})\\s*(${GSM_UNIT})`, "iu");
  const boundMaxStrict = new RegExp(`(?:^|[^\\w])(?:below|under|less than|<)\\s*(${NUMBER})\\s*(${GSM_UNIT})`, "iu");
  const boundMaxInclusive = new RegExp(`(?:^|[^\\w])(?:up\\s+to|upto|max(?:imum)?\\.?|at\\s+most|not\\s+more\\s+than|<=)\\s*(${NUMBER})\\s*(${GSM_UNIT})`, "iu");

  const boundConfigs: { regex: RegExp; operator: ">" | ">=" | "<" | "<="; label: string }[] = [
    { regex: boundMinStrict, operator: ">", label: "Above" },
    { regex: boundMinInclusive, operator: ">=", label: "At least" },
    { regex: boundMaxStrict, operator: "<", label: "Below" },
    { regex: boundMaxInclusive, operator: "<=", label: "Up to" },
  ];

  for (const cfg of boundConfigs) {
    const match = textWithoutLinearMass.match(cfg.regex);
    if (match) {
      const val = numeric(match[1]);
      if (val > 0) {
        result.gsmBound = { value: val, operator: cfg.operator, label: cfg.label };
        if (cfg.operator === ">=" || cfg.operator === ">") {
          result.gsmMin = val;
        } else {
          result.gsmMax = val;
        }
        result.gsmQualifier = `${cfg.label} ${val} g/m²`;
        result.evidence.push({
          ...evidence("gsm", match, `GSM bound: ${result.gsmQualifier}.`),
          kind: "unresolved",
        });
        result.warnings.push(`gsm: ${match[0]} is a bound, not an exact GSM; retained in notes.`);
        return;
      }
    }
  }

  // 6. APPROXIMATE VALUES
  // Examples:
  // - around 185 GSM, about 185 GSM, approx 185 GSM, approx. 185 gsm, ~185 gsm
  // - gsm approx 180, weight approx 180 gsm
  const approxPatterns = [
    new RegExp(`(?:^|[^\\w])(?:around|about|approx(?:imate(?:ly)?)?\\.?|~)\\s*(${NUMBER})\\s*(${GSM_UNIT})`, "iu"),
    new RegExp(`\\b${GSM_LABEL}\\s*[:=—–-]?\\s*(?:around|about|approx(?:imate(?:ly)?)?\\.?|~)\\s*(${NUMBER})\\s*(?:${GSM_UNIT})?`, "iu"),
    new RegExp(`\\b${GSM_UNIT}\\s*(?:around|about|approx(?:imate(?:ly)?)?\\.?|~)\\s*(${NUMBER})\\b`, "iu"),
  ];

  for (const pattern of approxPatterns) {
    const approxMatch = textWithoutLinearMass.match(pattern);
    if (approxMatch) {
      const nominal = numeric(approxMatch[1]);
      if (nominal > 0) {
        result.gsm = nominal;
        result.gsmQualifier = `Approximate: around ${nominal} g/m²`;
        result.evidence.push(evidence("gsm", approxMatch, `Approximate GSM: around ${nominal} g/m².`));
        return;
      }
    }
  }

  // 7. EXPLICIT VALUES & LAYOUT FAMILIES
  // Match prefix units, suffix units, labelled forms, and table/separator notations.
  type GsmCandidate = {
    value: number;
    match: RegExpMatchArray;
    index: number;
    numStart: number;
    numEnd: number;
  };

  const candidates: GsmCandidate[] = [];

  // A. Prefix forms: e.g. Weight (gsm): 220, gsm: 220, gsm = 220, Fabric weight [gsm] = 220, Weight / gsm / 220
  const prefixPatterns = [
    // Weight / {u} / {v}
    new RegExp(`\\b${GSM_LABEL}\\s*\\/\\s*${GSM_UNIT}\\s*\\/\\s*(${NUMBER})\\b`, "giu"),
    // Weight ({u}): {v}  or  Fabric weight [{u}] = {v}
    new RegExp(`\\b${GSM_LABEL}\\s*(?:\\(|\\[)\\s*${GSM_UNIT_CORE}\\s*(?:\\)|\\])\\s*[:=—–-]?\\s*(${NUMBER})\\b`, "giu"),
    // {u}: {v}  or  {u} = {v}  or  {u} - {v}
    new RegExp(`(?:^|[\\r\\n;,|])\\s*${GSM_UNIT}\\s*[:=—–-]?\\s*(${NUMBER})\\b`, "giu"),
    // Explicit GSM label: GSM should be 125 / GSM: 125 / GSM - 270 / G.S.M. = 270 / GSM: 270 G.M.
    new RegExp(`\\b(?:${GSM_DIRECT_TOKEN}|fabric\\s+gsm)\\s*(?:[:=—–-]|should be|must be|to be|is|revised to|changed to|set to)?\\s*(${NUMBER})(?:\\s*${GRAM_TOKEN})?(?![\\p{L}\\d])`, "giu"),
    // Grammage: {v}
    new RegExp(`\\b(?:grammage|fabric\\s+grammage)\\s*[:=—–-]?\\s*(${NUMBER})(?:\\s*${GSM_UNIT}|(?!\\s*(?:${GRAM_TOKEN}|${AREA_M2_TOKEN}|[\\w/])))(?![\\p{L}\\d])`, "giu"),
    // Hindi/Hinglish: "weight 180 hai"
    new RegExp(`\\b(?:fabric\\s+)?weight\\s*[:=]?\\s*(${NUMBER})\\s*(?:hai|hoga|chahiye|rakhna)\\b`, "giu"),
  ];

  for (const pattern of prefixPatterns) {
    for (const match of textWithoutLinearMass.matchAll(pattern)) {
      const val = numeric(match[1]);
      if (val > 0) {
        const before = text.slice(Math.max(0, match.index! - 30), match.index!);
        if (NON_GSM_CONTEXT.test(before)) continue;
        const numStart = match.index! + match[0].lastIndexOf(match[1]);
        const numEnd = numStart + match[1].length;
        candidates.push({ value: val, match, index: match.index!, numStart, numEnd });
      }
    }
  }

  // B. Suffix forms: e.g. 220 GSM, 220 g/m², 220 (GSM), Weight: 220 GSM, WEIGHT - 270 - GM / SQMT, etc.
  const suffixPattern = new RegExp(`(?<![\\d.])(${NUMBER})\\s*(?:[-–—:=]\\s*)?${GSM_UNIT}(?![\\p{L}\\d])`, "giu");
  for (const match of textWithoutLinearMass.matchAll(suffixPattern)) {
    const val = numeric(match[1]);
    if (val > 0) {
      const before = text.slice(Math.max(0, match.index! - 35), match.index!);
      if (NON_GSM_CONTEXT.test(before)) continue;
      const numStart = match.index! + match[0].indexOf(match[1]);
      const numEnd = numStart + match[1].length;
      // Avoid duplicating prefix candidates that matched the same numeric span
      if (!candidates.some(c => Math.max(c.numStart, numStart) < Math.min(c.numEnd, numEnd))) {
        candidates.push({ value: val, match, index: match.index!, numStart, numEnd });
      }
    }
  }

  // 8. INFORMAL WEIGHT SHORTHAND & BARE GRAMS IN FABRIC-WEIGHT CONTEXT
  // "“GM” and “G.M.” are not universally equivalent to GSM.
  // However, in a clear fabric-specification context, a fabric-weight label and a plausible value can support a GSM inference."
  if (candidates.length === 0) {
    const informalPattern = new RegExp(
      `\\b(${GSM_LABEL})\\s*(?:(?:\\(|\\[)\\s*(${GRAM_TOKEN})\\s*(?:\\)|\\]))?\\s*[:=—–-]?\\s*(?:is|of)?\\s*(${NUMBER})\\s*(?:(?!(?:\\/|\\bper\\b)\\s*(?:linear|running|[\\p{L}\\d]|${AREA_M2_TOKEN}))(${GRAM_TOKEN}))?(?![\\p{L}\\d])`,
      "giu"
    );
    const informalMatches = [...textWithoutLinearMass.matchAll(informalPattern)].filter(match => {
      const start = match.index!;
      const end = start + match[0].length;
      const before = text.slice(Math.max(0, start - 35), start);
      if (NON_GSM_CONTEXT.test(before)) return false;
      const after = text.slice(end, Math.min(text.length, end + 30));
      if (NON_GSM_CONTEXT.test(after)) return false;
      const unit = match[2] || match[4];
      if (!unit && DISALLOWED_AFTER.test(after)) return false;
      return true;
    });

    if (informalMatches.length > 0) {
      const distinctVals = [...new Set(informalMatches.map(m => numeric(m[3])))].filter(v => v > 0);
      if (distinctVals.length > 1) {
        result.warnings.push(`gsm: ${informalMatches.map(m => m[0]).join(" / ")} needs review; conflicting values were retained in notes.`);
        return;
      }

      if (distinctVals.length === 1) {
        const chosenMatch = informalMatches[0];
        const val = distinctVals[0];
        const unit = chosenMatch[2] || chosenMatch[4];
        const rawSpan = chosenMatch[0];
        const isPlausibleGsm = val >= 30 && val <= 800;
        const hasFabric = hasFabricContext(text);
        const areaNotStated = /\b(?:area\s+not\s+(?:stated|specified|given)|without\s+(?:an?\s+)?area)\b/i.test(text);

        if (isPlausibleGsm && hasFabric && !areaNotStated) {
          result.gsm = val;
          const note = `${val} GSM inferred from ‘${rawSpan}’; please confirm.`;
          result.evidence.push({
            ...evidence("gsm", chosenMatch, note),
            kind: "inferred",
            value: val,
            unit: "g/m²",
          });
          result.warnings.push(note);
          return;
        }

        // Retain ambiguous/unsupported measurements reviewable without silently assigning GSM
        result.evidence.push({
          ...evidence("gsm", chosenMatch, `Fabric weight stated as ${val} ${unit || "gm"} without square metre unit. Review if ${val} GSM was intended.`),
          kind: "unresolved",
          value: val,
        });
        result.gsmQualifier = `${val} ${unit || "gm"}`;
        result.warnings.push(`gsm: ${rawSpan} was stated without an area unit; retained for review.`);
        return;
      }
    }
    return;
  }

  // Sort chronologically by source position
  candidates.sort((a, b) => a.index - b.index);

  const distinctValues = new Set(candidates.map(c => c.value));
  if (distinctValues.size === 1) {
    const chosen = candidates[0];
    result.gsm = chosen.value;
    result.evidence.push(evidence("gsm", chosen.match, `Explicit fabric weight: ${chosen.value} g/m².`));
    return;
  }

  // Multiple candidates with different values:
  // Check for explicit corrections, revisions, or contradictions
  const first = candidates[0];
  const last = candidates[candidates.length - 1];
  const correctionSpan = textWithoutLinearMass.slice(first.index, last.index + last.match[0].length);

  if (/\b(?:actually|instead|correct(?:ion|ed)?|rather|revised?|update|replac(?:ing|e)|should be)\b/i.test(correctionSpan)) {
    const afterCorrection = candidates.filter(c => c.index > first.index);
    const distinctAfter = new Set(afterCorrection.map(c => c.value));

    if (distinctAfter.size > 1 && !/\b(?:not|instead of|replac(?:ing|e))\b/i.test(textWithoutLinearMass.slice(first.index))) {
      result.warnings.push("Contradictory gsm corrections detected without clear precedence; confirm the intended value.");
      return;
    }

    result.gsm = last.value;
    result.evidence.push(evidence("gsm", last.match, `Explicit GSM correction applied: ${last.value} g/m² (replacing earlier ${first.value}).`));
    result.warnings.push(`Explicit gsm correction applied: ${last.value} g/m².`);
    return;
  }

  // Check if one value is negated: e.g. "not 180 gsm, final 190 gsm"
  const negatedMatch = textWithoutLinearMass.match(new RegExp(`\\b(?:not|instead of)\\s+(${NUMBER})\\s*${GSM_UNIT}`, "iu"));
  if (negatedMatch) {
    const negatedVal = numeric(negatedMatch[1]);
    const remaining = candidates.filter(c => c.value !== negatedVal);
    if (remaining.length === 1) {
      const chosen = remaining[0];
      result.gsm = chosen.value;
      result.evidence.push(evidence("gsm", chosen.match, `Active GSM ${chosen.value} g/m² (excluding negated ${negatedVal}).`));
      result.warnings.push(`Explicit GSM ${chosen.value} applied; negated value ${negatedVal} was excluded.`);
      return;
    }
  }

  result.warnings.push(`gsm: ${candidates.map(c => c.match[0]).join(" / ")} needs review; conflicting values were retained in notes.`);
}
