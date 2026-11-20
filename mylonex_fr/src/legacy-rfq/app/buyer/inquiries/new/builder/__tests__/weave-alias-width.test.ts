import { it, expect } from "vitest";
import { parseText } from "../parse-text";
import { weaveAliasWidthSource as source } from "../../../../../../src/domains/rfq/text/__tests__/weave-alias-width-fixture";
import { detectWovenWeaves } from "../../../../../../src/domains/rfq/weave/detect";
import { widthPhrases } from "../../../../../../src/domains/rfq/text/width-phrases";
import { TextAnalysis } from "../../../../../../src/domains/rfq/text/analysis";
import { reconcileTextDrafts } from "../reconcile-text";
import { validateAiExtraction } from "../../../../../../src/domains/rfq/text/ai-validation";
import { missingRequired } from "../draft";
it("extracts the exact local buyer inquiry without false weave/width warnings", () => {
  const lines = parseText(source);
  expect(lines).toHaveLength(1);
  const [line] = lines;
  expect(line.draft).toMatchObject({ weaveType: "2/2 Twill", width: "58 inches", fabricState: "dyed", dyeMethod: "piece_dyed", quantity: 5000, targetPriceMax: 165 });
  expect(line.blendRows?.map(r => [r.fibre, r.percentage])).toEqual([["Polyester", "65"], ["Viscose", "35"]]);
  expect(line.count).toBe("20s × 20s");
  expect(line.construction.replace(/x/g, "×")).toBe("100 × 56");
  expect(line.draft.gsm).toBeUndefined();
  expect(line.colours.map(c => c.name)).toEqual(["Dark Navy"]);
  expect(line.widthBasis).toBe("finished");
  expect(line.draft.additionalSpecs).toContain("63 inches · Greige width");
  expect(line.targetPriceCurrency).toBe("INR");
  expect(line.targetPriceBasis).toBe("per_metre");
  expect(line.targetPriceCommercialQualifiers).toContain("ex mill");
  expect(line.warnings.join(" ")).not.toMatch(/numeric pair|clear unit|unknown weave/);
  expect(line.original).toBe(source);
  expect(line.sourceEvidence).toContainEqual(expect.objectContaining({ field: "weave", text: "2/2 TWL", kind: "explicit" }));
  expect(missingRequired(line)).toContain("GSM");
  expect(new TextAnalysis(source).text).toContain("2/2 twl.");
  expect(widthPhrases(source).map(w => [w.value, w.basis])).toEqual([["63", "greige"], ["58", "finished"]]);
});
it.each([["2/2 TWL.", "2/2 Twill"], ["2/1 TWL;", "2/1 Twill"], ["2/2 TW", "2/2 Twill"],
  ["2/2 TWIL.", "2/2 Twill"], ["3/1 DRL", "3/1 Drill"], ["MATT 2/2", "2/2 Matty"],
  ["TWL (2/2)", "2/2 Twill"]])("owns the full ratio alias %s before numeric classification", (phrase, expected) => {
  const [line] = parseText(`100% cotton; ${phrase}; count 2/40s x 2/40s; construction 100 x 56; width 58 inches; 5000 m.`);
  expect(line.draft.weaveType).toBe(expected);
  expect(detectWovenWeaves(phrase).mentions).toContainEqual(expect.objectContaining({ normalizedTerm: expected.toLowerCase(), status: "recognized" }));
  expect(line.count).toBe("2/40s x 2/40s");
  expect(line.construction).toBe("100 x 56");
  expect(line.warnings.join(" ")).not.toMatch(/count versus construction/);
  const mention = line.weaveDetection!.mentions[0];
  expect(line.original.slice(mention.start, mention.end)).toBe(mention.matchedTerm);
});
it.each(["2/40s", "2/2", "Article TWL", "shade: TWL", "finish: 2/2 TWL", "not 2/2 TWL"])("does not turn unrelated wording %s into a selected weave", phrase => {
  expect(parseText(`100% cotton; ${phrase}; 150 GSM; 58 inches; 5000 m.`)[0].draft.weaveType).toBeUndefined();
});
it("keeps a genuine unitless width warning alongside a separate known width", () => {
  expect(parseText("100% cotton; plain; greige width 63; finished width 58 inches; 5000 m.")[0].warnings.join(" ")).toMatch(/clear unit/);
});
it("reconciles canonical proposals with the exact local source without requiring OpenAI", () => {
  const raw = { source, fields: [{ field: "weaveType" as const, value: "2/2 Twill", sourcePhrases: ["2/2 TWL"], interpretation: "explicit" as const }], yarns: [], alternatives: [], issues: [] };
  const [line] = reconcileTextDrafts(source, parseText(source), validateAiExtraction(source, { fabrics: [raw] }).fabrics, [raw]);
  expect(line.draft.weaveType).toBe("2/2 Twill");
  expect(line.draft.width).toBe("58 inches");
  expect(line.draft.gsm).toBeUndefined();
  expect(line.warnings.join(" ")).not.toMatch(/count versus construction|clear unit/);
  expect(line.draft.additionalSpecs).toContain("63 inches");
});
