import { FIBRE_PATTERN } from "./fibres";
import { NUMBER, numeric } from "./measurements";
import { protectedNumbers } from "./protected-numbers";
import { evidence, type TextFields } from "./types";
import { GSM_UNIT_CORE } from "./gsm";

/** Deliberately conservative, group-local inference after explicit extraction. */
export function inferNumbers(text: string, result: TextFields) {
  const blocked = protectedNumbers(text, result);
  const remaining = [...text.matchAll(new RegExp(`(?<![\\p{L}\\p{N}_.])${NUMBER}(?![\\p{L}\\p{N}_]|\\.\\d)`, "giu"))]
    .filter(match => !blocked.slice(match.index!, match.index! + match[0].length).some(Boolean) && numeric(match[0]) > 0);
  const unresolved = (match: RegExpMatchArray, field: string, reason: string) => {
    result.evidence.push({ ...evidence(field, match), kind: "unresolved", value: numeric(match[0]), reason });
    result.warnings.push(`${field === "quantity" ? "Quantity candidate" : "Unresolved number"} ${match[0]}: ${reason}`);
  };
  if (!remaining.length) return;
  const requestCue = (match: RegExpMatchArray) => /\b(?:needs?|requires?|requested quantity|order(?: quantity)?|quantity(?: required)?|total quantity)\s*(?:is|of|[:=])?\s*$/i.test(text.slice(Math.max(0, match.index! - 45), match.index!));
  if (remaining.length > 1) {
    for (const match of remaining) unresolved(match, requestCue(match) ? "quantity" : "number", "Competing unlabeled numbers have more than one interpretation. Confirm their fields and units.");
    return;
  }
  const match = remaining[0], value = numeric(match[0]);
  if (requestCue(match)) {
    const convention = text.match(/\b(?:all\s+)?(?:order\s+)?quantities\s+(?:are\s+)?(?:given\s+)?in\s+(metres|meters|m)\b/i);
    if (!result.quantity && convention && Number.isInteger(value) && value <= 2_147_483_647) {
      const reason = `Requested quantity wording and explicit unit convention “${convention[0]}” establish metres.`;
      result.quantity = value;
      result.evidence.push({ ...evidence("quantity", match), kind: "inferred", value, unit: "m", reason });
      result.warnings.push(`Quantity ${value} m inferred from the stated unit convention. Review or edit it.`);
    } else unresolved(match, "quantity", result.quantity ? "An explicit requested quantity already exists. Confirm this additional number and its unit." : "Requested quantity wording is present, but its unit is unknown. Confirm the quantity unit; metres were not assumed.");
    return;
  }
  // Conflicts/ranges must not be 'repaired' with a different unlabeled value.
  const gsmSpecified = new RegExp(GSM_UNIT_CORE, "i").test(text);
  const preferred = value >= 50 && value <= 500;
  const fabricContext = new RegExp(`\\b(?:${FIBRE_PATTERN})\\b`, "i").test(text);
  const anchors = [result.width && "explicit width", result.quantity && "explicit requested quantity", result.count && "yarn count", result.construction && "construction"].filter(Boolean);
  const supported = preferred ? (!!result.quantity || (!!result.width && !!result.count && !!result.construction)) : (!!result.width && !!result.quantity && !!result.count && !!result.construction);
  if (!result.gsm && !result.weightInput && !gsmSpecified && fabricContext && supported) {
    const reason = `Only one unlabeled number remains after excluding other numeric roles; ${anchors.join(", ")} ${anchors.length === 1 ? "is" : "are"} already identified. ${preferred ? "50–500 is a preferred GSM range, supporting this interpretation." : "The complete width, quantity, yarn-count and construction context supports GSM outside the preferred 50–500 range."}`;
    result.gsm = value;
    result.evidence.push({ ...evidence("gsm", match), kind: "inferred", value, unit: "g/m²", reason });
    result.warnings.push(`GSM ${value} inferred from fabric context. Review or edit it.`);
  } else unresolved(match, "number", gsmSpecified ? "GSM is already explicit or has conflicting/ranged wording. This number was not used to replace it." : "The fabric context does not establish a unique measurement. Confirm its meaning and unit.");
}
