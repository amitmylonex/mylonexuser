import { parseBlendRows } from "../../../../../src/domains/rfq/blend/rows";
import { validateBlendRows } from "../../../../../src/domains/rfq/blend/validation";
export { BLEND_PERCENTAGE_ERROR, type BlendPercentages } from "../../../../../src/domains/rfq/blend/validation";

/** Compatibility entry point: string callers share the row editor's exact validation. */
export function getBlendPercentages(input: string) {
  const { rows, legacyText } = parseBlendRows(input);
  return validateBlendRows(rows, legacyText);
}
