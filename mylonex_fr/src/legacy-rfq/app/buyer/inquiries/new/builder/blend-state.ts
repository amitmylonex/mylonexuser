import { parseBlendRows, serializeBlend, type FibreRow } from "../../../../../src/domains/rfq/blend/rows";
import { validateBlendRows } from "../../../../../src/domains/rfq/blend/validation";
import type { RfqLine } from "./draft";

export function blendState(line: RfqLine) {
  const parsed = line.blendRows && serializeBlend(line.blendRows) === line.blend ? { rows: line.blendRows, legacyText: line.blendLegacyText } : parseBlendRows(line.blend);
  const legacyText = line.blendLegacyText || parsed.legacyText;
  return { ...parsed, legacyText, ...validateBlendRows(parsed.rows, legacyText) };
}
export function updateBlend(line: RfqLine, rows: FibreRow[], legacyText?: string): RfqLine {
  const retained = line.blendLegacyText && !legacyText ? `Original blend for review: ${line.blendLegacyText}` : "";
  return { ...line, blendRows: rows, blendLegacyText: legacyText, blend: serializeBlend(rows),
    ...(retained ? { draft: { ...line.draft, additionalSpecs: [line.draft.additionalSpecs, retained].filter(Boolean).join("\n") } } : {}),
  };
}
export function initializeBlend(line: RfqLine): RfqLine {
  if (line.blendRows && serializeBlend(line.blendRows) === line.blend) return line;
  const parsed = parseBlendRows(line.blend);
  return { ...line, blend: serializeBlend(parsed.rows), blendRows: parsed.rows, blendLegacyText: line.blendLegacyText || parsed.legacyText };
}
