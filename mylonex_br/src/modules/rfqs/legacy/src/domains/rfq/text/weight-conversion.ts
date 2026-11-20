import type { RfqLine } from "../../../../app/buyer/inquiries/new/builder/draft.js";
import { NUMBER, numeric, hasClearFabricSpecification } from "./gsm.js";
import type { TextFields } from "./types.js";
import { parseWidthBounds, INCH_TO_METER } from "./width-bounds.js";

/**
 * Deterministic conversion factors:
 * 1. oz/yd² → GSM: value × 33.90574744
 * 2. oz/m²  → GSM: value × 28.349523125
 * 3. GLM    → GSM: grams per linear metre ÷ width in metres
 * 4. 1 inch = 0.0254 metres
 */
export const OZ_YD2_TO_GSM = 33.90574744;
export const OZ_M2_TO_GSM = 28.349523125;
export { INCH_TO_METER };

/**
 * Numerical comparison tolerance:
 * Stated weights (e.g. explicit GSM vs GLM-derived GSM) are considered equivalent
 * if their absolute difference does not exceed max(1.5 GSM, 1% of the value).
 */
export const WEIGHT_TOLERANCE_ABSOLUTE = 1.5;
export const WEIGHT_TOLERANCE_RELATIVE = 0.01;

/**
 * Standard rounding policy for GSM display and mapping:
 * Round to 2 decimal places if non-integer; otherwise return whole number.
 */
export function roundGsm(val: number): number {
  if (!Number.isFinite(val) || val <= 0) return 0;
  const rounded = Math.round((val + Number.EPSILON) * 100) / 100;
  return Number.isInteger(rounded) ? rounded : rounded;
}

/**
 * Check if two GSM values are numerically equivalent within tolerance.
 */
export function areGsmValuesEquivalent(gsm1: number, gsm2: number): boolean {
  const diff = Math.abs(gsm1 - gsm2);
  const tol = Math.max(WEIGHT_TOLERANCE_ABSOLUTE, Math.max(gsm1, gsm2) * WEIGHT_TOLERANCE_RELATIVE);
  return diff <= tol;
}

/**
 * Parse a width string (e.g. "150 cm", "1.5 m", "60 inches", "58") into metres.
 * For single values, returns the width in metres.
 * For width ranges, returns null (call parseWidthBounds for range handling).
 */
export function parseWidthToMeters(width?: string | number): number | null {
  const bounds = parseWidthBounds(width);
  if (!bounds || bounds.isRange) return null;
  return bounds.min;
}

export type WeightUnitType = "glm" | "oz/yd2" | "oz/m2" | "bare_oz" | "gsm";

export type WeightCandidate = {
  value: number;
  unit: WeightUnitType;
  rawText: string;
  rawUnit: string;
  start: number;
  end: number;
  min?: number;
  max?: number;
  tolerance?: number;
  basis?: string;
  isApprox?: boolean;
};

// 1. GLM unit tokens (case-insensitive, handles punctuation & spacing)
// Examples: 250 GLM, 250 glm, 250 G.L.M., 250 g/lm, 250 g per linear metre, 250 grams per linear meter
const GLM_DIRECT = "(?:g[\\s.]*l[\\s.]*m\\.?)";
const GLM_PER_METER = "(?:(?:grams?|gms?|g)\\s*(?:\\/|\\bper\\b)\\s*(?:(?:linear|running|lin\\.?)\\s+(?:met(?:re|er)s?|mtrs?|mts?|m\\b)|lm\\b|l\\.m\\.))";
const GLM_UNIT_PATTERN = `(?:${GLM_DIRECT}|${GLM_PER_METER})`;

// Contextual linear mass: "Fabric weight: 250 g/m", "Linear mass: 220 gm/m", "weight: 250 g/m"
// Disallows m² / m2 / m^2 / sqm
const CONTEXTUAL_GLM_LABEL = "(?:fabric\\s+(?:weight|wt\\.?)|linear\\s+(?:mass|weight)|weight|wt\\b\\.?)";
const CONTEXTUAL_GLM_UNIT = "(?:(?:grams?|gms?|g)\\s*(?:\\/|\\bper\\b)\\s*(?:met(?:re|er)s?|mtrs?|mts?|m\\b)(?![²2^]|\\s*[²2^]|\\s*sq))";

// 2. Ounce area-weight tokens:
// oz/yd², oz/yd2, oz per square yard, 6 ounces per square yard, 6 oz/sq yd, 6 OZ/SQ YD
const OZ_YD2_PATTERN = "(?:(?:oz|ounces?)\\s*(?:\\/|\\bper\\b)\\s*(?:yd[²2]|yd\\^2|(?:sq\\.?|square)\\s*(?:yards?|yd\\b)|sqyd|yards?[²2]))";

// 3. Ounce per square metre tokens:
// oz/m², oz/m2, oz per square metre, oz/sq m, oz per square m
const OZ_M2_PATTERN = "(?:(?:oz|ounces?)\\s*(?:\\/|\\bper\\b)\\s*(?:m[²2]|m\\^2|(?:sq\\.?|square)\\s*(?:met(?:re|er)s?|m\\b)|sqm|met(?:re|er)s?[²2]))";

// 4. Bare ounces: 6 oz, 6 OZ, 6 oz., 6 ounce fabric
const BARE_OZ_PATTERN = "(?:oz\\b|ounces?\\b|oz\\.)";

// Non-fabric context (sample, parcel, roll, carton, spool, package weight)
const NON_FABRIC_WEIGHT = /\b(?:sample|swatch|courier|package|box|parcel|shipment|spool|cone|roll|carton|bale|container|garment|apparel|product|piece|article|code|sku|style|order|po|lot|item|ref|reference)\s*(?:weight|wt)?\b/i;

/**
 * Extract non-GSM weight candidates from text:
 * - GLM
 * - oz/yd²
 * - oz/m²
 * - Bare oz in fabric context
 */
export function extractWeightCandidates(text: string): WeightCandidate[] {
  const candidates: WeightCandidate[] = [];
  const hasFabric = hasClearFabricSpecification(text);

  // Helper to check non-fabric context
  const isExcludedContext = (start: number, end: number) => {
    const before = text.slice(Math.max(0, start - 40), start);
    if (NON_FABRIC_WEIGHT.test(before)) return true;
    const after = text.slice(end, Math.min(text.length, end + 30));
    if (NON_FABRIC_WEIGHT.test(after)) return true;
    return false;
  };

  // A. GLM with Range: e.g. 250–300 GLM, 250 to 300 g/lm
  const glmRangeRegex = new RegExp(`(?<![\\d.])(${NUMBER})\\s*(?:[-–—]|to)\\s*(${NUMBER})\\s*(${GLM_UNIT_PATTERN})(?![\\p{L}\\d])`, "giu");
  for (const match of text.matchAll(glmRangeRegex)) {
    if (isExcludedContext(match.index!, match.index! + match[0].length)) continue;
    const min = numeric(match[1]);
    const max = numeric(match[2]);
    if (min > 0 && max > 0) {
      candidates.push({
        value: min,
        min: Math.min(min, max),
        max: Math.max(min, max),
        unit: "glm",
        rawText: match[0],
        rawUnit: match[3],
        start: match.index!,
        end: match.index! + match[0].length,
      });
    }
  }

  // B. GLM with Tolerance: e.g. 300 GLM ± 15 GLM, 300 ± 15 GLM
  const glmTolRegex = new RegExp(`(?<![\\d.])(${NUMBER})\\s*(?:${GLM_UNIT_PATTERN})?\\s*(?:\\(?\\s*(?:±|\\+\\/-)\\s*(${NUMBER})\\s*(?:${GLM_UNIT_PATTERN})?\\s*\\)?)(?:\\s*(${GLM_UNIT_PATTERN}))?`, "giu");
  for (const match of text.matchAll(glmTolRegex)) {
    const rawUnit = match[3] || match[0].match(new RegExp(GLM_UNIT_PATTERN, "i"))?.[0];
    if (!rawUnit) continue;
    if (isExcludedContext(match.index!, match.index! + match[0].length)) continue;
    const nominal = numeric(match[1]);
    const tol = numeric(match[2]);
    if (nominal > 0 && tol > 0) {
      candidates.push({
        value: nominal,
        min: Math.max(1, nominal - tol),
        max: nominal + tol,
        tolerance: tol,
        unit: "glm",
        rawText: match[0],
        rawUnit,
        start: match.index!,
        end: match.index! + match[0].length,
      });
    }
  }

  // C. Direct GLM Single Value: e.g. 250 GLM, 250 glm, 250 G.L.M., 250 g/lm, 250 grams per linear meter
  const glmSingleRegex = new RegExp(`(?<![\\d.])(${NUMBER})\\s*(${GLM_UNIT_PATTERN})(?![\\p{L}\\d])`, "giu");
  for (const match of text.matchAll(glmSingleRegex)) {
    if (isExcludedContext(match.index!, match.index! + match[0].length)) continue;
    const val = numeric(match[1]);
    if (val > 0) {
      // Avoid duplicating range / tol matches
      const start = match.index!;
      const end = start + match[0].length;
      if (!candidates.some(c => Math.max(c.start, start) < Math.min(c.end, end))) {
        candidates.push({
          value: val,
          unit: "glm",
          rawText: match[0],
          rawUnit: match[2],
          start,
          end,
        });
      }
    }
  }

  // D. Contextual Linear Mass: "Fabric weight: 250 g/m", "Linear mass: 220 gm/m", "weight: 250 g/m"
  const contextualGlmRegex = new RegExp(`\\b${CONTEXTUAL_GLM_LABEL}\\s*[:=—–-]?\\s*(${NUMBER})\\s*(${CONTEXTUAL_GLM_UNIT})(?![\\p{L}\\d])`, "giu");
  for (const match of text.matchAll(contextualGlmRegex)) {
    if (isExcludedContext(match.index!, match.index! + match[0].length)) continue;
    const val = numeric(match[1]);
    if (val > 0) {
      const start = match.index!;
      const end = start + match[0].length;
      if (!candidates.some(c => Math.max(c.start, start) < Math.min(c.end, end))) {
        candidates.push({
          value: val,
          unit: "glm",
          rawText: match[0],
          rawUnit: match[2],
          start,
          end,
        });
      }
    }
  }

  // E. oz/yd²: e.g. 6 oz/yd², 6 oz/yd2, 6 oz per square yard, 6 OZ/SQ YD
  const ozYd2Regex = new RegExp(`(?<![\\d.])(${NUMBER})\\s*(${OZ_YD2_PATTERN})(?![\\p{L}\\d])`, "giu");
  for (const match of text.matchAll(ozYd2Regex)) {
    if (isExcludedContext(match.index!, match.index! + match[0].length)) continue;
    const val = numeric(match[1]);
    if (val > 0) {
      candidates.push({
        value: val,
        unit: "oz/yd2",
        rawText: match[0],
        rawUnit: match[2],
        start: match.index!,
        end: match.index! + match[0].length,
      });
    }
  }

  // F. oz/m²: e.g. 6 oz/m², 6 oz/m2, 6 oz per square metre
  const ozM2Regex = new RegExp(`(?<![\\d.])(${NUMBER})\\s*(${OZ_M2_PATTERN})(?![\\p{L}\\d])`, "giu");
  for (const match of text.matchAll(ozM2Regex)) {
    if (isExcludedContext(match.index!, match.index! + match[0].length)) continue;
    const val = numeric(match[1]);
    if (val > 0) {
      candidates.push({
        value: val,
        unit: "oz/m2",
        rawText: match[0],
        rawUnit: match[2],
        start: match.index!,
        end: match.index! + match[0].length,
      });
    }
  }

  // G. Bare oz in clear fabric context: e.g. "8 oz denim fabric", "6 oz", "6 OZ"
  if (hasFabric) {
    const bareOzRegex = new RegExp(`(?<![\\d.])(${NUMBER})\\s*(${BARE_OZ_PATTERN})(?!\\s*(?:\\/|\\bper\\b|\\bsq\\b|yd|m[²2\\d]|met(?:re|er)))`, "giu");
    for (const match of text.matchAll(bareOzRegex)) {
      const start = match.index!;
      const end = start + match[0].length;
      if (isExcludedContext(start, end)) continue;
      // Do not match if already part of oz/yd² or oz/m²
      if (candidates.some(c => Math.max(c.start, start) < Math.min(c.end, end))) continue;

      const val = numeric(match[1]);
      if (val > 0) {
        candidates.push({
          value: val,
          unit: "bare_oz",
          basis: "assumed_oz_yd2",
          rawText: match[0],
          rawUnit: match[2],
          start,
          end,
        });
      }
    }
  }

  // Sort chronologically by source position
  candidates.sort((a, b) => a.start - b.start);
  return candidates;
}

/**
 * Reconcile weight fields (GLM, oz/yd², oz/m², bare oz) with explicit GSM
 * at measurement extraction time.
 */
export function reconcileWeightFields(text: string, result: TextFields, plainWeights?: readonly WeightCandidate[]): void {
  const candidates = plainWeights ?? extractWeightCandidates(text);
  if (!candidates.length) return;

  const cand = candidates[0];
  result.weightInput = {
    value: cand.value,
    unit: cand.unit,
    rawText: cand.rawText,
    rawUnit: cand.rawUnit,
    min: cand.min,
    max: cand.max,
    tolerance: cand.tolerance,
    basis: cand.basis,
  };
  if (plainWeights && cand.unit === "glm" && (result.gsmMin !== undefined || result.gsmMax !== undefined || result.gsmBound !== undefined)) {
    result.gsmProvenance = "extracted";
    return;
  }

  // Case 1: Explicit GSM was already found by extractGsm
  if (result.gsm !== undefined) {
    result.gsmProvenance = "extracted";
    let derivedGsm: number | null = null;
    let widthDesc = "";

    if (cand.unit === "glm") {
      const widthMeters = parseWidthToMeters(result.width);
      if (widthMeters && widthMeters > 0) {
        derivedGsm = roundGsm(cand.value / widthMeters);
        widthDesc = ` at ${result.width}`;
      }
    } else if (cand.unit === "oz/yd2" || cand.unit === "bare_oz") {
      derivedGsm = roundGsm(cand.value * OZ_YD2_TO_GSM);
    } else if (cand.unit === "oz/m2") {
      derivedGsm = roundGsm(cand.value * OZ_M2_TO_GSM);
    }

    if (derivedGsm !== null) {
      if (areGsmValuesEquivalent(result.gsm, derivedGsm)) {
        // Equivalent! No conflict
        result.gsmDerivedReason = `Explicit ${result.gsm} GSM confirmed with ${cand.rawText}${widthDesc}.`;
      } else {
        // Materially inconsistent
        result.warnings.push(
          `Discrepancy detected: Stated ${result.gsm} GSM conflicts with ${cand.rawText} (derived ~${derivedGsm} GSM${widthDesc}); please review.`
        );
      }
    }
    return;
  }

  // Case 2: No explicit GSM, convert non-GSM weight
  if (cand.unit === "oz/yd2") {
    const derivedGsm = roundGsm(cand.value * OZ_YD2_TO_GSM);
    result.gsm = derivedGsm;
    result.gsmProvenance = "derived";
    result.gsmDerivedReason = `Converted from ${cand.rawText} (approx. ${derivedGsm} GSM).`;
    result.evidence.push({
      field: "gsm",
      kind: "explicit",
      text: cand.rawText,
      start: cand.start,
      end: cand.end,
      value: derivedGsm,
      unit: "g/m²",
      reason: result.gsmDerivedReason,
    });
    return;
  }

  if (cand.unit === "oz/m2") {
    const derivedGsm = roundGsm(cand.value * OZ_M2_TO_GSM);
    result.gsm = derivedGsm;
    result.gsmProvenance = "derived";
    result.gsmDerivedReason = `Converted from ${cand.rawText} (approx. ${derivedGsm} GSM).`;
    result.evidence.push({
      field: "gsm",
      kind: "explicit",
      text: cand.rawText,
      start: cand.start,
      end: cand.end,
      value: derivedGsm,
      unit: "g/m²",
      reason: result.gsmDerivedReason,
    });
    return;
  }

  if (cand.unit === "bare_oz") {
    const derivedGsm = roundGsm(cand.value * OZ_YD2_TO_GSM);
    result.gsm = derivedGsm;
    result.gsmProvenance = "derived";
    result.gsmDerivedReason = `Assumed oz/yd² basis for ${cand.rawText} (approx. ${derivedGsm} GSM); please review area basis.`;
    result.warnings.push(result.gsmDerivedReason);
    result.evidence.push({
      field: "gsm",
      kind: "inferred",
      text: cand.rawText,
      start: cand.start,
      end: cand.end,
      value: derivedGsm,
      unit: "g/m²",
      reason: result.gsmDerivedReason,
    });
    return;
  }

  if (cand.unit === "glm") {
    const widthBounds = parseWidthBounds(result.width);
    const explicitWidthEv = (result.evidence || []).find(e => e.field === "width");
    const widthDisplay = explicitWidthEv ? explicitWidthEv.text : result.width;

    if (widthBounds && widthBounds.min > 0 && widthBounds.max > 0) {
      if (widthBounds.isRange) {
        // Width is a range: min GSM = GLM / maxMeters, max GSM = GLM / minMeters
        const candMin = cand.min ?? cand.value;
        const candMax = cand.max ?? cand.value;
        const gsmMin = roundGsm(candMin / widthBounds.max);
        const gsmMax = roundGsm(candMax / widthBounds.min);
        result.gsm = undefined;
        result.gsmMin = gsmMin;
        result.gsmMax = gsmMax;
        result.gsmQualifier = `Range: ${gsmMin}–${gsmMax} g/m² (converted from ${cand.min && cand.max && cand.min !== cand.max ? `${cand.min}–${cand.max}` : cand.value} GLM across ${widthDisplay})`;
        result.gsmProvenance = "derived";
        result.gsmWidthUsed = widthDisplay;
        result.gsmDerivedReason = `Derived from ${cand.rawText} across ${widthDisplay} width range (${gsmMin}–${gsmMax} GSM); draft GSM remains open until target width is chosen.`;
      } else {
        const widthMeters = widthBounds.min;
        if (cand.tolerance) {
          const tolGsm = roundGsm(cand.tolerance / widthMeters);
          const derivedGsm = roundGsm(cand.value / widthMeters);
          result.gsmTolerance = tolGsm;
          result.gsmMin = roundGsm(Math.max(1, derivedGsm - tolGsm));
          result.gsmMax = roundGsm(derivedGsm + tolGsm);
          result.gsmQualifier = `${derivedGsm} ±${tolGsm} g/m² (converted from ${cand.value} ±${cand.tolerance} GLM)`;
          result.gsmProvenance = "derived";
          result.gsmWidthUsed = widthDisplay;
        } else if (cand.min && cand.max && cand.min !== cand.max) {
          result.gsmMin = roundGsm(cand.min / widthMeters);
          result.gsmMax = roundGsm(cand.max / widthMeters);
          result.gsmQualifier = `Range: ${result.gsmMin}–${result.gsmMax} g/m² (converted from ${cand.min}–${cand.max} GLM)`;
          result.gsmProvenance = "derived";
          result.gsmWidthUsed = widthDisplay;
        } else {
          const derivedGsm = roundGsm(cand.value / widthMeters);
          result.gsm = derivedGsm;
          result.gsmProvenance = "derived";
          result.gsmWidthUsed = widthDisplay;
          result.gsmDerivedReason = `Derived from ${cand.rawText} using ${widthDisplay} width (${derivedGsm} GSM).`;
          result.evidence.push({
            field: "gsm",
            kind: "explicit",
            text: cand.rawText,
            start: cand.start,
            end: cand.end,
            value: derivedGsm,
            unit: "g/m²",
            reason: result.gsmDerivedReason,
          });
        }
      }
    } else {
      // Width is missing at this stage
      result.gsmProvenance = "derived";
      result.gsmQualifier = `${cand.value} GLM (requires width for GSM)`;
      result.gsmDerivedReason = `Stated ${cand.rawText}; requires fabric width to calculate GSM.`;
      result.warnings.push(`Weight stated as ${cand.rawText} requires fabric width to calculate GSM. Please specify width.`);
      result.evidence.push({
        field: "gsm",
        kind: "unresolved",
        text: cand.rawText,
        start: cand.start,
        end: cand.end,
        value: cand.value,
        unit: "glm",
        reason: result.gsmDerivedReason,
      });
    }
  }
}

/**
 * Recomputes GLM-derived GSM for a line when width is provided or changed.
 * Only recalculates if GSM is still derived or undefined; NEVER overwrites manual or explicit GSM.
 */
export function recalculateGlmGsm(line: RfqLine): RfqLine {
  if (!line.weightInput || line.weightInput.unit !== "glm") {
    return line;
  }

  // Never overwrite manual or explicit buyer GSM
  if (line.gsmProvenance === "manual" || line.gsmProvenance === "extracted") {
    return line;
  }

  const glmVal = line.weightInput.value;
  const widthStr = line.draft.width;
  const bounds = line.plainTextSource && line.widthProvenance === "default" ? null : parseWidthBounds(widthStr);

  if (!bounds || bounds.min <= 0 || bounds.max <= 0) {
    // Width is missing, invalid or unresolved
    const cleanWarnings = (line.warnings || []).filter(
      w => !/requires fabric width to calculate GSM/i.test(w) && !/Derived GSM/i.test(w)
    );
    cleanWarnings.push(`Weight stated as ${glmVal} GLM requires fabric width to calculate GSM. Please specify width.`);

    return {
      ...line,
      draft: { ...line.draft, gsm: undefined },
      gsmMin: undefined,
      gsmMax: undefined,
      gsmTolerance: undefined,
      gsmProvenance: "derived",
      gsmDerivedReason: `Stated ${glmVal} GLM; requires fabric width to calculate GSM.`,
      gsmDefaultWidthUsed: false,
      gsmWidthUsed: undefined,
      gsmQualifier: `${glmVal} GLM (requires width for GSM)`,
      warnings: cleanWarnings,
    };
  }

  const explicitWidthText = line.sourceEvidence?.find(e => e.field === "width")?.text;
  const isDefaultWidth = line.widthProvenance === "default";
  const widthDisplay = !isDefaultWidth && explicitWidthText
    ? explicitWidthText.trim()
    : widthStr ? widthStr.replace(/\s+/g, " ").trim() : `${bounds.min} m`;

  const cleanWarnings = (line.warnings || []).filter(
    w => !/requires fabric width to calculate GSM/i.test(w) && !/Derived GSM/i.test(w)
  );

  if (bounds.isRange) {
    // Width is a range:
    // Minimum GSM = GLM / maximum width in metres
    // Maximum GSM = GLM / minimum width in metres
    const glmMinVal = line.weightInput.min ?? glmVal;
    const glmMaxVal = line.weightInput.max ?? glmVal;
    const gsmMin = roundGsm(glmMinVal / bounds.max);
    const gsmMax = roundGsm(glmMaxVal / bounds.min);
    const glmDisplay = line.weightInput.min && line.weightInput.max && line.weightInput.min !== line.weightInput.max
      ? `${line.weightInput.min}–${line.weightInput.max}`
      : `${glmVal}`;
    const gsmQualifier = `Range: ${gsmMin}–${gsmMax} g/m² (converted from ${glmDisplay} GLM across ${widthDisplay})`;

    const derivedReason = isDefaultWidth
      ? `Derived from ${glmVal} GLM across platform default width range ${widthDisplay} (${gsmMin}–${gsmMax} GSM); draft GSM remains open until target width is chosen.`
      : `Derived from ${glmVal} GLM across ${widthDisplay} width range (${gsmMin}–${gsmMax} GSM); draft GSM remains open until target width is chosen.`;

    if (isDefaultWidth) {
      cleanWarnings.push(`Derived GSM range (${gsmMin}–${gsmMax} g/m²) from ${glmVal} GLM across platform default width range (${widthDisplay}); please review.`);
    }

    return {
      ...line,
      draft: {
        ...line.draft,
        gsm: undefined, // Must stay undefined until booking target chosen!
      },
      gsmMin,
      gsmMax,
      gsmTolerance: undefined,
      gsmQualifier,
      gsmProvenance: "derived",
      gsmDerivedReason: derivedReason,
      gsmDefaultWidthUsed: isDefaultWidth,
      gsmWidthUsed: widthDisplay,
      warnings: cleanWarnings,
    };
  }

  // Single width:
  const meters = bounds.min;
  const derivedGsm = roundGsm(glmVal / meters);
  const derivedReason = isDefaultWidth
    ? `Derived from ${glmVal} GLM using defaulted ${widthDisplay} width (approx. ${derivedGsm} GSM); please review width.`
    : `Derived from ${glmVal} GLM using ${widthDisplay} width (${derivedGsm} GSM).`;

  if (isDefaultWidth) {
    cleanWarnings.push(`Derived GSM from ${glmVal} GLM using platform default width (${widthDisplay}); please review.`);
  }

  let gsmMin: number | undefined;
  let gsmMax: number | undefined;
  let gsmTolerance: number | undefined;
  let gsmQualifier: string | undefined;

  if (line.weightInput.tolerance) {
    gsmTolerance = roundGsm(line.weightInput.tolerance / meters);
    gsmMin = roundGsm(Math.max(1, derivedGsm - gsmTolerance));
    gsmMax = roundGsm(derivedGsm + gsmTolerance);
    gsmQualifier = `${derivedGsm} ±${gsmTolerance} g/m² (converted from ${glmVal} ±${line.weightInput.tolerance} GLM)`;
  } else if (line.weightInput.min && line.weightInput.max && line.weightInput.min !== line.weightInput.max) {
    gsmMin = roundGsm(line.weightInput.min / meters);
    gsmMax = roundGsm(line.weightInput.max / meters);
    gsmQualifier = `Range: ${gsmMin}–${gsmMax} g/m² (converted from ${line.weightInput.min}–${line.weightInput.max} GLM)`;
  }

  return {
    ...line,
    draft: {
      ...line.draft,
      gsm: gsmMin && gsmMax && gsmMin !== gsmMax ? undefined : derivedGsm,
    },
    gsmMin,
    gsmMax,
    gsmTolerance,
    gsmQualifier,
    gsmProvenance: "derived",
    gsmDerivedReason: derivedReason,
    gsmDefaultWidthUsed: isDefaultWidth,
    gsmWidthUsed: widthDisplay,
    warnings: cleanWarnings,
  };
}
