import type { Colour, RfqLine } from "./draft";
import { isYarnRole } from "../../../../../src/domains/rfq/text/colours";

/**
 * Filter line.colours to identify actual requested fabric shades, excluding:
 * - yarn colours (descriptors in yarn count or directional yarn roles)
 * - print colours and reference/swatch colours
 * - future shades for explicitly RFD / Greige fabric
 */
export function getRequestedFabricShades(line: RfqLine): Colour[] {
  if (!line.colours || line.colours.length === 0) return [];

  // Exclude print context (e.g. printed base, printed state)
  if (line.draft.fabricState === "printed" || line.draft.printMethod) {
    return [];
  }

  // Future shades for explicitly RFD or Greige fabric must not act as requested dyed shades
  if (line.draft.fabricState === "rfd" || line.draft.fabricState === "greige") {
    return [];
  }

  return line.colours.filter((colour) => {
    const name = colour.name.trim();
    if (!name) return false;
    const nameLower = name.toLowerCase();
    const sourceLower = (colour.sourceText || name).trim().toLowerCase();

    // 1. Exclude if colour is in line.colourReferences
    if (
      line.colourReferences?.some((ref) => {
        const r = ref.toLowerCase();
        return r.includes(nameLower) || r.includes(sourceLower);
      })
    ) {
      return false;
    }

    // 2. Exclude yarn colours:
    const ev = line.sourceEvidence?.find(
      (e) =>
        e.field === "colour" &&
        (e.text.toLowerCase() === nameLower || e.text.toLowerCase() === sourceLower)
    );
    if (ev) {
      if (ev.kind === "unresolved" && ev.reason && /yarn/i.test(ev.reason)) return false;
      if (line.original && isYarnRole(ev.start, line.original, ev.text.length)) return false;
    }

    if (line.original && colour.sourceText) {
      const idx = line.original.toLowerCase().indexOf(colour.sourceText.toLowerCase());
      if (idx >= 0 && isYarnRole(idx, line.original, colour.sourceText.length)) return false;
    }

    // 3. Exclude if context in original source indicates a reference swatch or sample ref
    if (line.original) {
      const orig = line.original.toLowerCase();
      const escaped = sourceLower.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const refRegex = new RegExp(
        `(?:reference\\s+swatch|swatch\\s+ref|sample\\s+ref|ref(?:erence)?\\s*[:=]|for\\s+reference\\s+only)\\s*[^;,\\n]*?\\b${escaped}\\b|\\b${escaped}\\b\\s*[^;,\\n]*?(?:reference\\s+swatch|swatch\\s+ref|sample\\s+ref|for\\s+reference\\s+only)`,
        "i"
      );
      if (refRegex.test(orig)) return false;

      // 4. Exclude print floral / ground pattern context
      const printRegex = new RegExp(`\\bprinted\\b[^;,\\n]*?\\b${escaped}\\b`, "i");
      if (printRegex.test(orig)) return false;
    }

    return true;
  });
}

/**
 * If a requested fabric shade exists and fabric state is unset:
 * infer and select Dyed.
 */
export function inferFabricStateFromShade(line: RfqLine): void {
  // Preserve explicit source states, buyer-selected states, or already set states
  if (line.draft.fabricState) {
    return;
  }

  // Preserve unresolved conflicts or explicit negations
  if (line.warnings?.some((w) => /conflicting explicit fabric states|negated fabric state/i.test(w))) {
    return;
  }

  const shades = getRequestedFabricShades(line);
  if (shades.length === 0) {
    return;
  }

  // Infer and select Dyed
  line.draft.fabricState = "dyed";
  line.fabricStateInferred = true;
}
