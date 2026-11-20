import type { ImageExtraction } from "../../../../../src/domains/rfq/image/schema";
import { meters } from "../../../../../src/domains/rfq/image/normalize";
import { newLine, type RfqLine } from "./draft";
import { applyPlatformWidthDefault } from "./platform-width";
import { recalculateGlmGsm } from "../../../../../src/domains/rfq/text/weight-conversion";

export function voiceLines(data: ImageExtraction, transcript: string, sourceId: string): RfqLine[] {
  return data.requirements.map(requirement => {
    const line = newLine();
    const { materialType, pureFiber, blendComposition, ...draft } = requirement.draft;
    delete draft.colorInfoList;
    line.voiceSourceId = sourceId;
    line.original = transcript;
    line.blend = materialType === "pure" && pureFiber ? `100% ${pureFiber}` : blendComposition || "";
    line.draft = { ...line.draft, ...draft, selectedPath: "production", fabricStructure: "woven" };
    line.colours = requirement.colors.filter(color => !color.uncertain).map(color => ({
      id: crypto.randomUUID(), name: color.color, metres: color.quantity && meters(color.quantity) !== undefined ? String(meters(color.quantity)) : "",
    }));
    line.unsureColours = requirement.colors.some(color => color.uncertain);
    line.warnings = [...data.warnings, ...requirement.warnings, "Voice draft: confirm every extracted value against the transcript before sending."];
    // Delivery stays in the existing shared destination editor, not per-line draft data.
    const deliveryKeys = ["deliveryAddress", "deliveryCountry", "deliveryState", "deliveryCity", "deliveryPincode", "contactPhone"] as const;
    if (deliveryKeys.some(key => draft[key])) line.warnings.push("Delivery/contact details were spoken. Enter and confirm them in the shared delivery section; the transcript is retained.");
    for (const key of deliveryKeys) delete line.draft[key];
    if (draft.width && !/^\d+(?:\.\d+)?\s*(?:inches|inch|in|\")$/i.test(draft.width)) {
      delete line.draft.width;
      line.warnings.push("Confirm width in inches; the spoken width remains in the transcript.");
    }
    if (draft.selectedPath === "sampling") {
      line.draft = { fabricStructure: "woven", selectedPath: "production" };
      line.blend = "";
      line.colours = [];
      line.warnings.push("Sampling was mentioned. Use the sampling flow; do not submit this as a production inquiry.");
    }
    if (line.draft.width) { line.widthProvenance = "extracted"; } else { applyPlatformWidthDefault(line); }
    const updatedWeight = recalculateGlmGsm(line);
    Object.assign(line, updatedWeight);
    return line;
  });
}

export function hasVoiceSource(lines: RfqLine[], sourceId: string) {
  return lines.some(line => line.voiceSourceId === sourceId);
}
