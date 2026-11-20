import { z } from "zod";
import { parseDescription } from "./parse-text";
import { initializeBlend } from "./blend-state";
import { imageTextScope } from "./image-text-scope";
import { applyPlatformWidthDefault } from "./platform-width";
import { recalculateGlmGsm } from "../../../../../src/domains/rfq/text/weight-conversion";

const reviewedTextSchema = z.string().trim().min(1, "Review the written requirement first.").max(16000);

/** One reviewed text creates one fresh builder line. Never consume stale provider draft fields. */
export function imageTextLine(input: string) {
  const reviewed = reviewedTextSchema.parse(input);
  const scope = imageTextScope(reviewed);
  const line = parseDescription(scope.text);
  // Image intake requires explicit written values; the paste flow's inference stays separate.
  for (const key of ["gsm", "quantity"] as const) {
    if (line.sourceEvidence?.some(item => item.field === key && item.kind === "inferred")) delete line.draft[key];
  }
  line.sourceEvidence = line.sourceEvidence?.filter(item => item.kind === "explicit");
  const blocked = scope.uncertain.join(" ");
  if (/\b(?:correction|corrected|actually|instead)\b/i.test(blocked) && !/\b(?:blend|composition|gsm|width|quantity|weave|count|construction|finish|colour|color|date|delivery|state|cycle)\b/i.test(blocked)) {
    line.blend = ""; line.draft = { fabricStructure: "woven", selectedPath: "production" };
    line.count = ""; line.construction = ""; line.finish = ""; line.weaveDetail = ""; line.colours = [];
  }
  if (/\b(?:blend|composition|polyester|rayon|cotton|silk|linen|viscose|fibre|fiber)\b|%/i.test(blocked)) line.blend = "";
  if (/\bgsm\b|g\s*\/\s*m[²2]/i.test(blocked)) delete line.draft.gsm;
  if (/\bwidth\b|inches|inch|\bcm\b/i.test(blocked)) delete line.draft.width;
  if (/\bquantity\b|metres|meters|\bm\b/i.test(blocked)) delete line.draft.quantity;
  if (/\bweave\b|twill|plain|satin|dobby|jacquard/i.test(blocked)) { delete line.draft.weaveType; line.weaveDetail = ""; }
  if (/\b(?:state|rfd|greige|dyed|printed)\b/i.test(blocked)) delete line.draft.fabricState;
  if (/\b(?:cycle|ready|stock|production|made to order)\b/i.test(blocked)) delete line.draft.productionCycle;
  if (/\b(?:deliver|date|by)\b/i.test(blocked)) delete line.draft.requiredDeliveryDate;
  if (/\bcount\b/i.test(blocked)) line.count = "";
  if (/\bconstruction\b|\bepi\b|\bppi\b/i.test(blocked)) line.construction = "";
  if (/\bfinish\b/i.test(blocked)) line.finish = "";
  if (/\bcolou?r\b|red|navy|blue|black|white/i.test(blocked)) line.colours = [];
  // Keep all context, including original values and requests, visibly editable as line notes.
  line.original = reviewed;
  line.draft.deliveryNotes = reviewed;
  delete line.draft.additionalSpecs;
  delete line.draft.customFabricName; // parseDescription generates a name; it was not written.
  const fabricName = scope.text.match(/\b(?:fabric(?: type| name)?|name)\s*[:=]\s*([^;\n]+)/i);
  if (fabricName) line.draft.customFabricName = fabricName[1].trim();
  const weave = scope.text.match(/\bweave\s*[:=]\s*([^;\n]+)/i);
  if (weave && !/\bweave\b/i.test(blocked)) line.draft.weaveType = weave[1].trim();
  const finish = scope.text.match(/\bfinish\s*[:=]\s*([^;\n]+)/i);
  if (finish && !/\bfinish\b/i.test(blocked)) line.finish = finish[1].trim();
  if (line.draft.requiredDeliveryDate && !z.iso.date().safeParse(line.draft.requiredDeliveryDate).success) delete line.draft.requiredDeliveryDate;
  if (/\bPPL\b/i.test(scope.text) && !/\bPPI\b/i.test(scope.text)) line.construction = "";
  const price = scope.text.match(/\b(?:target(?: price)?|price)\s*[:=]?\s*(?:INR|Rs\.?|₹)\s*(\d+(?:\.\d+)?)\s*(?:\/|per)\s*m(?:eter|etre)?s?\b/i);
  if (price) line.draft.targetPriceMax = Number(price[1]);
  line.warnings = [];
  if (scope.uncertain.length || /\[unclear[^\]]*\]/i.test(reviewed)) line.warnings.push("Some handwriting needs review. Unclear specifications were left blank.");
  if (reviewed.length > 1000) line.warnings.push("Shorten the line notes to 1,000 characters before sending. The full reviewed description is retained.");
  if (line.draft.width) { line.widthProvenance = "extracted"; } else { applyPlatformWidthDefault(line); }
  const updatedWeight = recalculateGlmGsm(line);
  Object.assign(line, updatedWeight);
  return initializeBlend(line);
}
