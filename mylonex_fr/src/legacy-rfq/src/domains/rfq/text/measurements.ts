import { evidence, type TextFields } from "./types";
import { extractGsm, NUMBER, numeric } from "./gsm";
import { reconcileWeightFields, type WeightCandidate } from "./weight-conversion";
export { NUMBER, numeric };
const RANGE = `(${NUMBER})(?:\\s*(?:[-–—]|to|or)\\s*(${NUMBER}))?`;


const WIDTH_UNIT = '(?:["″”]|inches|inch|ins|inchs|in|cms|cm|centimetres?|centimeters?)';

/** A fraction's denominator followed by the preposition "in" is not a width
 * (MATT 2/2 in cotton). Do not detach the second number from its notation. */
export function fractionComponent(text: string, start: number) {
  return /\d\s*\/\s*$/.test(text.slice(0, start));
}

export function extractMeasurements(text: string, result: TextFields, skipQuantity = false, plainWeights?: readonly WeightCandidate[]) {
  // Leave linear mass to the weight converter. A generic "Weight: 250"
  // label must never consume the number in "Weight: 250 GLM".
  const linearWeights = plainWeights?.filter(candidate => candidate.unit === "glm") ?? [];
  const gsmSource = linearWeights.length ? text.split("") : undefined;
  for (const candidate of linearWeights) gsmSource?.fill(";", candidate.start, candidate.end);
  const areaWeightSource = gsmSource?.join("") ?? text;
  extractGsm(areaWeightSource, result);

  function read(field: "width" | "gsm" | "quantity", expression: RegExp, convert: (_n: number, _unit: string) => number) {
    if (field === "gsm" && (result.gsm !== undefined || result.gsmMin !== undefined || result.gsmBound !== undefined)) return;
    let matches = [...(field === "gsm" ? areaWeightSource : text).matchAll(expression)];
    if (field === "width") matches = matches.filter(match => !fractionComponent(text, match.index!));
    if (field === "gsm") {
      const labelled = [...areaWeightSource.matchAll(new RegExp(`\\bGSM\\s*(?:[:=]|should be|must be|to be|is|revised to|changed to|set to)?\\s*${RANGE}(?![\\p{L}\\d])`, "giu"))];
      matches = [...matches, ...labelled.filter(match => !matches.some(item => item.index! < match.index! + match[0].length && match.index! < item.index! + item[0].length))].sort((a, b) => a.index! - b.index!);
    }
    if (field === "quantity") matches = matches.filter(match => {
      const before = text.slice(Math.max(0, match.index! - 65), match.index!).split(/[.;\n]/).pop()!;
      const after = text.slice(match.index! + match[0].length).split(/[.;\n]/)[0];
      const scope = `${before} ${after}`;
      if (/\b(?:both|all fabrics)\b/i.test(scope) && !/\beach\b/i.test(scope)) {
        result.warnings.push("Shared quantity scope is unclear (combined total or per fabric). Confirm it in notes; no quantity was copied."); return false;
      }
      if (/\b(?:navy(?: blue)?|light blue|dark blue|blue|black|white|red|green|beige|grey|gray|charcoal|sage|olive|taupe|maroon|teal|khaki|cream|pink|yellow)\s*[:=–—-]?\s*$/i.test(before)) return false;
      return !/\b(?:moq|stock|available|sample|swatch|yardage|deliver(?:y|ed)?|dispatch)\b[^,;]*$/i.test(before);
    });
    if (!matches.length) return;
    // Explicit "actually/instead/correction" replaces earlier values only for this field.
    let active = matches;
    const last = matches[matches.length - 1];
    if (matches.length > 1 && /\b(?:actually|instead|correct(?:ion|ed)?|rather|revised?|update|replac(?:ing|e)|should be)\b/i.test(text.slice(matches[0].index! + matches[0][0].length, last.index))) {
      const afterCorrection = matches.filter(m => m.index! > matches[0].index!);
      const distinctAfter = new Set(afterCorrection.map(m => convert(numeric(m[1]), m[3] || "")));
      if (distinctAfter.size > 1 && !/\b(?:not|instead of|replac(?:ing|e))\b/i.test(text.slice(matches[0].index!))) {
        result.warnings.push(`Contradictory ${field} corrections detected without clear precedence; confirm the intended value.`);
        return;
      }
      active = [last]; result.warnings.push(`Explicit ${field} correction applied. Earlier wording is retained in the source.`);
    }
    const values = active.map(match => convert(numeric(match[1]), match[3] || ""));
    const uncertain = active.some(match => match[2] || /(?:±|\+\/-|tolerance|\babout\b|\bapprox(?:imately)?\b)/i.test(text.slice(Math.max(0, match.index! - 15), match.index! + match[0].length + 25)));
    const conflict = new Set(values).size > 1;
    if (uncertain || conflict) {
      result.warnings.push(`${field}: ${active.map(match => match[0]).join(" / ")} needs review; ranges, tolerances and conflicting values were retained in notes.`);
      return;
    }
    if (field === "quantity" && (!Number.isInteger(values[0]) || values[0] > 2_147_483_647)) {
      result.warnings.push("Converted quantity does not fit the required whole-metre field. Confirm it; the original units are in notes."); return;
    }
    if (!Number.isFinite(values[0]) || values[0] <= 0) return;
    if (field === "width") result.width = `${values[0]} inches`;
    else result[field] = values[0];
    result.evidence.push(...matches.map(match => evidence(field, match)));
  }
  read("width", new RegExp(`(?<![\\d.])${RANGE}\\s*(${WIDTH_UNIT})(?:\\s*[gG]\\b)?(?![\\p{L}])`, "giu"), (value, unit) => /^c/i.test(unit) ? value / 2.54 : value);
  read("width", /(?<![\d.])(\d+(?:\.\d+)?)\s*["″”]\s*[gG]\b/giu, value => value);
  read("gsm", new RegExp(`(?<![\\d.])${RANGE}\\s*(gsm|g\\s*\\/\\s*m[²2]|grams? per square met(?:re|er)s?)(?![\\p{L}])`, "giu"), value => value);
  if (!skipQuantity) read("quantity", new RegExp(`(?<![\\d.])${RANGE}\\s*((?:(?:linear|running)\\s+)?(?:metres?|meters?|mtrs?|m|yards?|yds?))(?![\\p{L}])`, "giu"), (value, unit) => /^(?:yard|yd)/i.test(unit) ? value * 0.9144 : value);
  const labelledWidths = [...text.matchAll(new RegExp(`\\bwidth\\s*[:=]?\\s*${RANGE}(?![\\d.])`, "giu"))];
  if (labelledWidths.some(match => !new RegExp(`^\\s*${WIDTH_UNIT}(?![\\p{L}])`, "iu").test(text.slice(match.index! + match[0].length))))
    result.warnings.push("Width was stated without a clear unit. Confirm inches or centimetres; no unit was assumed.");

  if (!plainWeights) reconcileWeightFields(text, result);
}
