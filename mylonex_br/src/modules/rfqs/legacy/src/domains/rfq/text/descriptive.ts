import { evidence, type TextFields } from "./types.js";
import { extractFinish } from "./finish.js";

export function extractDescriptive(text: string, result: TextFields, preserveRaw = false) {
  extractFinish(text, result, (f, m) => result.evidence.push(evidence(f, m)), preserveRaw);
  const use = text.match(/\b(?:suitable for|for|end use\s*[:=])\s+(shirts?|shirting|uniforms?|trousers?|curtains?)\b/i);
  if (use) {
    result.endUse = /shirt/i.test(use[1]) ? "Shirting" : /uniform/i.test(use[1]) ? "Uniform" : /trouser/i.test(use[1]) ? "Bottom Wear" : "Home Textile";
    result.evidence.push(evidence("endUse", use));
  }
}
