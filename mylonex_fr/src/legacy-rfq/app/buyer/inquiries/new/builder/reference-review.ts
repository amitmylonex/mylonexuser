import type { RfqLine } from "./draft";
import { colourAllocationIssues } from "./colour-allocation-edit";

/** Unresolved references use the existing buyer edit/confirmation controls. */
export function referenceReviewIssues(line: RfqLine): string[] {
  const issues = line.warnings.filter(warning =>
    (!line.coloursConfirmed && /^(?:Ambiguous colour code|Colour reference needs confirmation|Graphics reference|Pantone suffix unspecified)/.test(warning))
    || (!line.finishConfirmed && /^Ambiguous finish code/.test(warning)));
  if (!line.finishConfirmed && line.finishAlternatives?.length) issues.push("Confirm the requested finish alternative before sending.");
  if (!line.coloursConfirmed && line.colourAlternatives?.length) issues.push("Confirm the requested colour alternative before sending.");
  return [...issues, ...colourAllocationIssues(line)];
}
