import type { RfqLine } from "./draft";
import { type SourcingAlternative, analyzeAlternativesComposition, validateAlternatives } from "../../../../../src/domains/rfq/text/alternatives";
import type { FibreRow } from "../../../../../src/domains/rfq/blend/rows";

export function confirmFinishedWidth(line: RfqLine, width: string): RfqLine {
  const trimmed = width.trim();
  return {
    ...line,
    draft: { ...line.draft, width: trimmed || undefined },
  };
}

export function updateLineAlternatives(line: RfqLine, alternatives: SourcingAlternative[]): RfqLine {
  const normalizedAlts = alternatives.map(alt => {
    if (alt.rows && alt.rows.length === 1 && alt.percentage !== undefined) {
      return {
        ...alt,
        rows: [{
          ...alt.rows[0],
          description: alt.description || alt.rows[0].description,
          percentage: alt.percentage,
        }]
      };
    }
    return alt;
  });
  const analysis = analyzeAlternativesComposition(normalizedAlts);
  const commonFibre = analysis.commonFibre || "Cotton";
  const validation = validateAlternatives(normalizedAlts);

  let blend: string;
  let blendRows: FibreRow[];

  if (validation.state === "complete") {
    blend = `100% ${commonFibre}`;
    blendRows = [{ id: "fibre-0", fibre: commonFibre, percentage: "100" }];
  } else {
    blend = commonFibre;
    blendRows = [{ id: "fibre-0", fibre: commonFibre, percentage: "" }];
  }

  // Update additionalSpecs to preserve edited alternatives
  const existingNotes = (line.draft.additionalSpecs || "").split("\n").filter(
    (n) => !/^Alternative \d/i.test(n) && !/^OPTION \d/i.test(n)
  );
  const altNotes = normalizedAlts.map(
    (alt, i) => `Alternative ${i + 1}: ${alt.percentage ? `${alt.percentage}% ` : ""}${alt.description}`
  );
  const additionalSpecs = [...existingNotes, ...altNotes].filter(Boolean).join("\n");

  return {
    ...line,
    sourcingAlternatives: normalizedAlts,
    blend,
    blendRows,
    draft: {
      ...line.draft,
      additionalSpecs: additionalSpecs || undefined,
    },
  };
}
