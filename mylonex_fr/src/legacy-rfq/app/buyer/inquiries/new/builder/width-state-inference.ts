import type { widthPhrases } from "../../../../../src/domains/rfq/text/width-phrases";
import type { RfqLine } from "./draft";
import { blendState } from "./blend-state";
import { isLycraFibre, isWidthConflictWarning, PLATFORM_WIDTH_INCHES } from "./platform-width";

export function inferFabricStateFromWidth(line: RfqLine, widths: ReturnType<typeof widthPhrases>) {
  if (line.draft.fabricState || line.widthProvenance !== "extracted" || widths.length !== 1
    || line.sourcingAlternatives?.length || line.compositionUncertain
    || /\b(?:fabric\s+)?state\s*[:=]\s*(?:coated|laminated)\b/i.test(line.original)
    || line.warnings.some(warning => isWidthConflictWarning(warning) || /conflicting explicit fabric states|negated fabric state/i.test(warning))) return;

  const [width] = widths;
  if (width.basis !== "unqualified" || !width.value || line.draft.width !== `${width.value} inches`) return;
  const blend = blendState(line);
  if (blend.state !== "complete") return;
  const stretch = blend.rows.some(row => Number(row.percentage) > 0 && isLycraFibre(row.fibre));
  const rules = stretch ? PLATFORM_WIDTH_INCHES.stretch : PLATFORM_WIDTH_INCHES.standard;
  const inches = Number(width.value);
  // Allow only floating-point conversion noise at the inclusive cm endpoints.
  const within = ([min, max]: readonly [number, number]) => inches >= min - 1e-10 && inches <= max + 1e-10;
  const greige = within(rules.greige);
  if (!greige && !within(rules.finished)) return;

  const value = greige ? "greige" : "finished";
  const reason = "Inferred from stated width and blend. Review or edit the state.";
  line.draft.fabricState = value;
  line.fabricStateInferred = true;
  line.textCandidates = [...(line.textCandidates ?? []), {
    field: "fabricState", value, origin: "local", kind: "inferred", sourcePhrases: [width.text],
    status: "review", reason,
  }];
}
