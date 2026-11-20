import type { RfqLine } from "./draft";
import { fibreKey } from "../../../../../src/domains/rfq/blend/rows";
import { FIBRES } from "../../../../../src/domains/rfq/text/fibres";

const SPANDEX_ALIASES = [
  "spandex",
  "elastane",
  "lycra",
  "elastan",
  "spand ex",
  "spx",
  "spdx",
  "spndx",
  "lyc",
  "ea",
  "el",
];

// Matches spandex aliases, contextual codes (ea, el when surrounded by numbers/% or slashes), or blend codes containing spandex (cs, ps, ns, vs, pcs, pvs)
const SPANDEX_PATTERN = new RegExp(
  `\\b(?:${SPANDEX_ALIASES.join("|")})\\b|(?<=\\d\\s*%?\\s*)[/]?\\s*\\b(?:ea|el)\\b|\\b(?:ea|el)\\b(?=\\s*\\d|\\s*%)|\\b(?:cs|ps|ns|vs|pcs|pvs)\\b`,
  "i"
);

const NEGATION_PREFIX = /\b(?:no|not|without|zero|0%|neither|avoid|excluding|free from|non[- ])\s*(?:any\s+)?(?:added\s+)?$/i;
const NEGATION_POSTFIX = /^(?:[- ]free|\s+is not (?:used|needed|wanted|required)|\s+excluded)\b/i;

const NON_LYCRA_FIBRES =
  /\b(?:cotton|cot|polyester|poly|pes|pet|rpet|viscose|visc|cv|rayon|linen|flax|bamboo|nylon|polyamide|pa|silk|wool|tencel|lyocell|cly|modal|hemp|acrylic|t400|pbt)\b/i;

export function isLycraFibre(fibre: string): boolean {
  if (!fibre || !fibre.trim()) return false;
  const norm = fibre.trim().toLowerCase();
  // Mechanical stretch, T400 or PBT alone must not imply Lycra.
  if (/^(?:t400|pbt|mechanical\s+stretch|mech(?:\.?|\s+)stretch)$/i.test(norm)) return false;
  const key = fibreKey(fibre);
  if (key === "Spandex") return true;
  if (SPANDEX_ALIASES.includes(norm)) return true;
  return (FIBRES.Spandex ?? []).some((alias) => alias.toLowerCase() === norm);
}

function hasNegatedLycra(text: string, matchIndex: number, matchLength: number): boolean {
  const before = text.slice(Math.max(0, matchIndex - 40), matchIndex);
  if (NEGATION_PREFIX.test(before)) return true;
  const after = text.slice(matchIndex + matchLength, matchIndex + matchLength + 30);
  if (NEGATION_POSTFIX.test(after)) return true;
  return false;
}

function isAlternativeLycra(text: string, matchIndex: number, matchLength: number): boolean {
  const before = text.slice(Math.max(0, matchIndex - 50), matchIndex);
  const after = text.slice(matchIndex + matchLength, matchIndex + matchLength + 50);
  if (
    /\b(?:or|either|deciding between|not decided|choice of)\b/i.test(before) ||
    /\b(?:or|not decided)\b/i.test(after)
  ) {
    return true;
  }
  return false;
}

export function hasLycraInText(text: string): boolean {
  if (!text || !text.trim()) return false;
  const matches = [...text.matchAll(new RegExp(SPANDEX_PATTERN, "gi"))];
  if (!matches.length) return false;

  for (const match of matches) {
    const idx = match.index!;
    const len = match[0].length;
    if (hasNegatedLycra(text, idx, len)) continue;
    if (isAlternativeLycra(text, idx, len)) continue;
    return true;
  }
  return false;
}

export function hasDetectedLycra(line: RfqLine): boolean {
  // 1. Unresolved sourcing alternatives
  if (line.sourcingAlternatives && line.sourcingAlternatives.length > 0) {
    if (!line.selectedAlternativeId) {
      // Unresolved alternatives: do not treat Lycra inside alternatives as confirmed
      return false;
    }
    const selected = line.sourcingAlternatives.find((a) => a.id === line.selectedAlternativeId);
    if (selected) {
      if (selected.fibre && isLycraFibre(selected.fibre)) return true;
      if (selected.rows && selected.rows.some((r) => r.fibre && isLycraFibre(r.fibre))) return true;
      if (selected.rawText && hasLycraInText(selected.rawText)) return true;
      return false;
    }
  }

  // 2. Unresolved alternative warnings
  const hasAlternativeWarning = line.warnings?.some((w) =>
    /Alternative fibre descriptions need buyer selection/i.test(w) ||
    /Multiple sourcing alternatives with different fibre compositions/i.test(w)
  );
  if (hasAlternativeWarning) return false;

  // 3. Blend rows
  const activeBlendRows = line.blendRows?.filter((row) => row.fibre && row.fibre.trim());
  if (activeBlendRows && activeBlendRows.length > 0) {
    return activeBlendRows.some((row) => {
      if (row.percentage && Number(row.percentage) === 0) return false;
      return isLycraFibre(row.fibre);
    });
  }

  // 4. Blend text
  if (line.blend && line.blend.trim()) {
    return hasLycraInText(line.blend);
  }

  // 5. Source text (only when blend information is missing or incomplete)
  if (line.original && line.original.trim()) {
    return hasLycraInText(line.original);
  }

  return false;
}

export function hasKnownComposition(line: RfqLine): boolean {
  // 1. Check blendRows
  const activeRows = (line.blendRows || []).filter(
    (row) =>
      row.fibre &&
      row.fibre.trim() &&
      !/percentages?\s+not\s+available|please\s+confirm/i.test(row.fibre)
  );
  if (activeRows.length > 0) {
    if (activeRows.every((r) => r.percentage && Number(r.percentage) === 0)) return false;
    return true;
  }

  // 2. Check line.blend
  if (line.blend && line.blend.trim()) {
    if (!/percentages?\s+not\s+available|please\s+confirm/i.test(line.blend)) {
      if (hasDetectedLycra(line) || NON_LYCRA_FIBRES.test(line.blend)) {
        return true;
      }
    }
  }

  // 3. Check line.original
  if (line.original && line.original.trim()) {
    if (hasDetectedLycra(line) || NON_LYCRA_FIBRES.test(line.original)) {
      return true;
    }
  }

  return false;
}

export function isWidthConflictWarning(warning: string): boolean {
  if (!warning) return false;
  return (
    warning.startsWith("width:") ||
    /Conflicting finished\/cuttable widths/i.test(warning) ||
    /Conflicting greige widths/i.test(warning) ||
    /Width was stated without a clear unit/i.test(warning) ||
    /Contradictory width corrections/i.test(warning) ||
    /Stated greige width.*needs review/i.test(warning)
  );
}

export type PlatformWidthDefault = {
  width: string;
  value?: number;
  min?: number;
  max?: number;
  isRange?: boolean;
  note: string;
  reason: "dyed" | "rfd" | "printed" | "finished" | "greige_lycra" | "greige_no_lycra";
};

export const PLATFORM_WIDTH_INCHES = {
  standard: { greige: [63, 63], finished: [58, 58] },
  stretch: { greige: [67, 72], finished: [54, 57] },
} as const;

export function getPlatformWidthDefault(line: RfqLine): PlatformWidthDefault | undefined {
  const state = line.draft.fabricState;
  if (!state) return undefined;

  const s = state.trim().toLowerCase();
  const isFinished = s === "dyed" || s === "rfd" || s === "printed" || s === "finished";
  const isGreige = s === "greige" || s === "grey" || s === "griege";

  if (!isFinished && !isGreige) return undefined;

  const hasLycra = hasDetectedLycra(line);
  const knownComp = hasKnownComposition(line);

  // Requirement 8: Unknown composition does not mean "without Lycra".
  // Do not apply default if composition is unknown.
  if (!hasLycra && !knownComp) {
    return undefined;
  }

  // Requirement 8: Undecided/alternative Lycra wording must not be treated as confirmed without Lycra.
  if (line.warnings?.some((w) => /Alternative fibre descriptions need buyer selection/i.test(w) || /Multiple sourcing alternatives with different fibre compositions/i.test(w))) {
    return undefined;
  }

  if (isGreige) {
    if (hasLycra) {
      const [min, max] = PLATFORM_WIDTH_INCHES.stretch.greige;
      return {
        width: `${min}–${max} inches`,
        min,
        max,
        isRange: true,
        note: "Defaulted to 67–72 inches range for Greige with Lycra; please review.",
        reason: "greige_lycra",
      };
    }
    const [value] = PLATFORM_WIDTH_INCHES.standard.greige;
    return {
      width: `${value} inches`,
      value,
      min: value,
      max: value,
      isRange: false,
      note: "Defaulted to 63 inches for Greige without Lycra; please review.",
      reason: "greige_no_lycra",
    };
  }

  if (isFinished) {
    const stateLabel = s === "rfd" ? "RFD" : s[0].toUpperCase() + s.slice(1);
    if (hasLycra) {
      const [min, max] = PLATFORM_WIDTH_INCHES.stretch.finished;
      return {
        width: `${min}–${max} inches`,
        min,
        max,
        isRange: true,
        note: `Defaulted to 54–57 inches range for ${stateLabel} fabric with Lycra; please review.`,
        reason: s,
      };
    }
    const [value] = PLATFORM_WIDTH_INCHES.standard.finished;
    return {
      width: `${value} inches`,
      value,
      min: value,
      max: value,
      isRange: false,
      note: `Defaulted to 58 inches for ${stateLabel} fabric; please review.`,
      reason: s,
    };
  }

  return undefined;
}

/**
 * Applies platform default width only when width was genuinely omitted.
 * Never overwrites a buyer-supplied or manually entered width.
 */
export function applyPlatformWidthDefault(line: RfqLine): RfqLine {
  // If width is already explicitly entered or extracted, keep it
  if (line.draft.width && line.draft.width.trim()) {
    return line;
  }

  // If user deliberately cleared the width or entered manual blank, respect it
  if (line.widthProvenance === "cleared" || line.widthProvenance === "manual") {
    return line;
  }

  // If there are conflicting or ambiguous width warnings, do not default
  if (line.warnings?.some(isWidthConflictWarning)) {
    return line;
  }

  // If unresolved/unsupported candidates for width exist in source evidence
  if (
    line.sourceEvidence?.some(
      (e) => e.field === "width" && (e.kind === "unresolved" || e.reason?.includes("Conflicting"))
    )
  ) {
    return line;
  }

  const def = getPlatformWidthDefault(line);
  if (!def) return line;

  line.draft.width = def.width;
  line.widthProvenance = "default";
  line.widthDefaultNote = def.note;
  if (def.isRange) {
    line.widthMin = def.min;
    line.widthMax = def.max;
  } else {
    line.widthMin = def.value ?? def.min;
    line.widthMax = def.value ?? def.max;
  }
  return line;
}

/**
 * Recalculates width only if it is still system-defaulted.
 * Never overwrites an explicit or manually edited width.
 */
export function recomputePlatformWidth(line: RfqLine): RfqLine {
  if (line.widthProvenance !== "default") {
    return line;
  }

  const def = getPlatformWidthDefault(line);
  if (!def) {
    // If state became unresolved, remove only the system default that is no longer justified
    delete line.draft.width;
    delete line.widthProvenance;
    delete line.widthDefaultNote;
    delete line.widthMin;
    delete line.widthMax;
    return line;
  }

  line.draft.width = def.width;
  line.widthProvenance = "default";
  line.widthDefaultNote = def.note;
  if (def.isRange) {
    line.widthMin = def.min;
    line.widthMax = def.max;
  } else {
    line.widthMin = def.value ?? def.min;
    line.widthMax = def.value ?? def.max;
  }
  return line;
}
