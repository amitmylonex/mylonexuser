export const INCH_TO_METER = 0.0254;

export type WidthBounds = {
  min: number; // in meters
  max: number; // in meters
  isRange: boolean;
  minInches?: number;
  maxInches?: number;
};

/**
 * Parses a width string or number into metric and inch bounds.
 * Supports:
 * - "58 inches", "58 in", "58\"", "58"
 * - "150 cm", "1.5 m"
 * - "54–57 inches", "54-57 inches", "54—57 inches", "54 to 57 inches", "54-57 in", "54–57"
 * - "140–150 cm", "1.4–1.5 m"
 */
export function parseWidthBounds(width?: string | number | null): WidthBounds | null {
  if (width === undefined || width === null) return null;
  const str = String(width).trim();
  if (!str) return null;

  // 1. Range pattern: num (unit)? [-–—|to] num (unit)?
  const rangeMatch = str.match(
    /^([\d.]+)\s*(inches|inch|ins?|inchs|["″”]|cms?|centimet(?:re|er)s?|met(?:re|er)s?|mtrs?|mts?|m)?\s*(?:[-–—]|\bto\b)\s*([\d.]+)\s*(inches|inch|ins?|inchs|["″”]|cms?|centimet(?:re|er)s?|met(?:re|er)s?|mtrs?|mts?|m)?$/i
  );

  if (rangeMatch) {
    const val1 = parseFloat(rangeMatch[1]);
    const val2 = parseFloat(rangeMatch[3]);
    const unit1 = rangeMatch[2]?.toLowerCase();
    const unit2 = rangeMatch[4]?.toLowerCase();
    const unit = unit2 || unit1 || "inches";

    if (Number.isFinite(val1) && Number.isFinite(val2) && val1 > 0 && val2 > 0) {
      const lower = Math.min(val1, val2);
      const upper = Math.max(val1, val2);

      let minMeters: number;
      let maxMeters: number;
      let minInches: number;
      let maxInches: number;

      if (/^(?:cms?|centimet(?:re|er)s?)$/i.test(unit)) {
        minMeters = lower / 100;
        maxMeters = upper / 100;
        minInches = lower / 2.54;
        maxInches = upper / 2.54;
      } else if (/^(?:met(?:re|er)s?|mtrs?|mts?|m)$/i.test(unit)) {
        minMeters = lower;
        maxMeters = upper;
        minInches = (lower * 100) / 2.54;
        maxInches = (upper * 100) / 2.54;
      } else {
        // Default: inches
        minMeters = lower * INCH_TO_METER;
        maxMeters = upper * INCH_TO_METER;
        minInches = lower;
        maxInches = upper;
      }

      return {
        min: minMeters,
        max: maxMeters,
        isRange: lower !== upper,
        minInches,
        maxInches,
      };
    }
  }

  // 2. Single value: cm
  const cmMatch = str.match(/^([\d.]+)\s*(?:cms?|centimet(?:re|er)s?)$/i);
  if (cmMatch) {
    const val = parseFloat(cmMatch[1]);
    if (Number.isFinite(val) && val > 0) {
      const meters = val / 100;
      const inches = val / 2.54;
      return { min: meters, max: meters, isRange: false, minInches: inches, maxInches: inches };
    }
  }

  // 3. Single value: m
  const mMatch = str.match(/^([\d.]+)\s*(?:met(?:re|er)s?|mtrs?|mts?|m)$/i);
  if (mMatch) {
    const val = parseFloat(mMatch[1]);
    if (Number.isFinite(val) && val > 0) {
      const inches = (val * 100) / 2.54;
      return { min: val, max: val, isRange: false, minInches: inches, maxInches: inches };
    }
  }

  // 4. Single value: inches or bare number
  const inMatch = str.match(/^([\d.]+)\s*(?:inches|inch|ins?|inchs|["″”])?$/i);
  if (inMatch) {
    const val = parseFloat(inMatch[1]);
    if (Number.isFinite(val) && val > 0) {
      const meters = val * INCH_TO_METER;
      return { min: meters, max: meters, isRange: false, minInches: val, maxInches: val };
    }
  }

  return null;
}

/**
 * Checks whether a width string or number represents a valid positive width (single value or range).
 */
export function isValidWidth(width?: string | number | null): boolean {
  if (!width) return false;
  const bounds = parseWidthBounds(width);
  if (!bounds) return false;
  return bounds.min > 0 && bounds.max > 0;
}

/**
 * Checks whether a width represents a range.
 */
export function isWidthRange(width?: string | number | null): boolean {
  const bounds = parseWidthBounds(width);
  return bounds?.isRange ?? false;
}
