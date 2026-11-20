import { extractComposition } from "./composition";
import { extractMeasurements } from "./measurements";
import { extractTechnical } from "./technical";
import { evidence, type TextFields } from "./types";
import { inferNumbers } from "./infer-numbers";
import { extractDescriptive } from "./descriptive";

/** Existing non-paste extraction contract, retained for reviewed image text. */
export function extractTextFields(text: string): TextFields {
  const result: TextFields = { blend: "", count: "", construction: "", finish: "", colours: [], notes: "", warnings: [], evidence: [] };
  extractComposition(text, result); extractMeasurements(text, result); extractTechnical(text, result);
  extractDescriptive(text, result, true);
  const colours = [...text.matchAll(/\b(?:navy blue|light blue|dark blue|navy|blue|black|white|red|green|beige|grey|gray|charcoal|sage|pink|yellow)\b/gi)];
  for (const colour of colours) {
    const tail = text.slice(colour.index! + colour[0].length).match(/^\s*[:=-]?\s*(\d[\d,]*(?:\.\d+)?)\s*(?:m|metres?|meters?)\b/i);
    result.colours.push({ name: colour[0], metres: tail ? tail[1].replace(/,/g, "") : "" });
    result.evidence.push(evidence("colour", colour));
  }
  inferNumbers(text, result);
  const captured = new Array(text.length).fill(false);
  for (const item of result.evidence.filter(item => item.kind !== "unresolved")) for (let i = item.start; i < item.end; i++) captured[i] = true;
  result.notes = text.split("").map((char, index) => captured[index] ? " " : char).join("")
    .replace(/[ \t]+/g, " ").replace(/\s*[,;]\s*(?=[,;.]|$)/g, " ").replace(/^\s*[,;.\s]+|[,;\s]+$/g, "").trim();
  if (/[\d]/.test(result.notes) && !result.warnings.some(item => /range|conflict|unit/i.test(item)))
    result.warnings.push("Some numbers remain unassigned in notes. Confirm their meaning and units; no values were guessed.");
  return result;
}
