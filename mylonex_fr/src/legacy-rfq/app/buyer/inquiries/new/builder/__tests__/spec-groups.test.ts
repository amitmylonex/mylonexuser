import { describe, expect, it } from "vitest";
import { parseText } from "../parse-text";
import { readRequirements } from "../read-requirements";
import { lineDraft, missingRequired } from "../draft";
import { evidenceSchema } from "../../../../../../src/domains/rfq/text/types";
import { detectWovenWeaves } from "../../../../../../src/domains/rfq/weave/detect";

const alternatives = "OPTION 1 100% GOTS NOP-certified organic cotton; OPTION 2 BCI cotton; OPTION 3 Regen Agri Cotton";
const A = `16 OE × 16 OE / 96 × 60, 65” RS, 2/2 Matty (OL) – ${alternatives}`;
const B = `20 CCW × 20 CCW / 96 × 48, 3/1 Drill – ${alternatives}`;
function parse(source: string) {
  const lines = parseText(source); expect(lines).toHaveLength(1);
  const line = lines[0]; expect(line.original).toBe(source);
  for (const item of line.sourceEvidence ?? []) {
    expect(source.slice(item.start, item.end)).toBe(item.text);
    expect(evidenceSchema.safeParse(item).success).toBe(true);
  }
  return line;
}
describe("complete textile specification groups through the pasted-text draft", () => {
  it.each([
    [A, "16 OE × 16 OE", "96 × 60", "2/2 Matty"],
    [B, "20 CCW × 20 CCW", "96 × 48", "3/1 Drill"],
  ])("extracts exact source count/density and weave without choosing an OPTION: %s", (source, count, construction, weave) => {
    const line = parse(source);
    expect(line).toMatchObject({ count, construction, blend: "" });
    expect(line.draft.weaveType).toBe(weave);
    expect(line.draft.gsm).toBeUndefined(); expect(line.draft.quantity).toBeUndefined(); expect(line.draft.fabricState).toBeUndefined();
    expect(missingRequired(line)).toContain("blend");
    expect(line.warnings.join(" ")).not.toMatch(/ambiguous|Unresolved number|numeric pair|Proposed count/i);
    expect(line.draft.additionalSpecs).toContain(alternatives);
    expect(line.sourceEvidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "count", text: count, kind: "explicit" }),
      expect.objectContaining({ field: "construction", text: construction, kind: "explicit" }),
      expect.objectContaining({ field: "weave", text: weave, kind: "explicit" }),
    ]));
    const mapped = lineDraft(line);
    expect(mapped.templateSpecs).toEqual(expect.arrayContaining([
      { specKey: "warp_count_ply", valueText: count.startsWith("16") ? "16 OE" : "20 CCW" },
      { specKey: "weft_count_ply", valueText: count.startsWith("16") ? "16 OE" : "20 CCW" },
      { specKey: "epi", valueNum: 96 }, { specKey: "ppi", valueNum: count.startsWith("16") ? 60 : 48 },
    ]));
  });
  it("A maps its explicit width/RS, preserves OL, and B does not acquire either value", () => {
    const first = parse(A), second = parse(B);
    expect(first.draft).toMatchObject({ width: "65 inches", productionCycle: "ready_stock" });
    expect(first.draft.additionalSpecs).toContain("(OL)");
    expect(second.draft.width).toBeUndefined(); expect(second.draft.productionCycle).toBeUndefined();
  });
  it.each([
    ["16 OE x 16 OE / 96 x 60", "16 OE x 16 OE", "96 x 60"],
    ["20CCW×20CCW/96×48", "20CCW×20CCW", "96×48"],
    ["30 COMPACT RING × 24 CUSTOM / 110 × 60", "30 COMPACT RING × 24 CUSTOM", "110 × 60"],
    ["count:16 OE x16 OE; construction:96x60", "16 OE x16 OE", "96x60"],
    ["count:40x40/142x72", "40x40", "142x72"],
    ["2/30 OE × 150D / 96 × 60", "2/30 OE × 150D", "96 × 60"],
  ])("uses grammar rather than a numeric-only or fixed-suffix count whitelist: %s", (source, count, construction) => {
    const line = parse(source); expect(line.count).toBe(count); expect(line.construction).toBe(construction);
    expect(line.warnings.join(" ")).not.toContain("ambiguous");
  });
  it.each(["2/2 Matty", "3/1 Drill", "2/2 Matty (OL)", "3/1 Drill, 65 inches"])("does not treat a weave ratio as a specification separator: %s", source => {
    const line = parse(source);
    expect(line.count).toBe(""); expect(line.construction).toBe("");
    expect(line.draft.weaveType).toBe(source.startsWith("2/2") ? "2/2 Matty" : "3/1 Drill");
    expect(line.warnings.join(" ")).not.toMatch(/ambiguous|numeric pair/);
  });
  it.each(["16x16", "96x60", "2/2", "16/96", "16x16 / 96", "16x16 or 96x60"])("keeps genuinely unclear or incomplete notation reviewable: %s", source => {
    const line = parse(source);
    expect(line.count).toBe(""); expect(line.construction).toBe("");
    expect(line.warnings.join(" ")).toMatch(/ambiguous|Unresolved number/);
  });
  it("does not select fields from alternatives, even when an option has complete specs", () => {
    const source = "20 CCW x20 CCW /96x48, 3/1 Drill – OPTION 1 100% cotton, 145 gsm, 58 inches, 500m ready dyed; OPTION 2 65/35 poly cotton, 220 gsm, 60 inches, 1000m RFD";
    const line = parse(source);
    expect(line.blend).toBe("");
    expect(line.blendRows).toEqual([
      expect.objectContaining({ fibre: "", percentage: "" })
    ]);
    expect(line.warnings.join(" ")).toContain("Multiple sourcing alternatives with different fibre compositions detected");
    for (const key of ["gsm", "width", "quantity", "fabricState", "productionCycle"] as const) expect(line.draft[key]).toBeUndefined();
    expect(line.draft.additionalSpecs).toContain("OPTION 1 100% cotton, 145 gsm");
  });
  it("preserves an explicit common blend independently of alternative descriptions", () => {
    const line = parse(`100% cotton; 16 OE x16 OE /96x60, 2/2 Matty – ${alternatives}`);
    expect(line.blend).toBe("100% Cotton");
  });
  it("keeps explicit labels authoritative over a different unlabelled group", () => {
    const line = parse("count:30s x30s; 16 OE x16 OE /96x60, 2/2 Matty");
    expect(line.count).toBe("30s x30s"); expect(line.construction).toBe("96x60");
    expect(line.warnings.join(" ")).toContain("was kept");
  });
  it("uses the shared Matty vocabulary for paste and other detector callers", () => {
    expect(detectWovenWeaves("Matty").mentions).toContainEqual(expect.objectContaining({ matchedTerm: "Matty", status: "recognized" }));
    expect(parse("2/2 Matty").draft.weaveType).toBe("2/2 Matty");
  });
  it("does not reinterpret RS inside another explicit field as ready stock", () => {
    expect(parse("target price: Rs 130/m").draft).toMatchObject({ targetPriceMax: 130 });
    expect(parse("target price: Rs 130/m").draft.productionCycle).toBeUndefined();
    expect(parse("fabric name: RS").draft.productionCycle).toBeUndefined();
  });

  it("extracts exact buyer example with slash and whitespace separators", async () => {
    const input = `A) 16 OE / 16 OE   96 / 60, 65" greige width, 2/2 Matty (OL)
Qty 4000m
OPTION 1: 100% organic cotton
OPTION 2: BCI cotton`;
    const [line] = await readRequirements(input, false);
    expect(line.count).toBe("16 OE × 16 OE");
    expect(line.construction).toBe("96 × 60");
    expect(line.draft.weaveType).toBe("2/2 Matty");
    expect(line.draft.quantity).toBe(4000);
    expect(line.blend).toBe("");
    expect(line.draft.gsm).toBeUndefined();
    expect(line.draft.fabricState).toBeUndefined();
    expect(line.draft.productionCycle).toBeUndefined();
    expect(line.draft.additionalSpecs).toContain("(OL)");
    expect(line.draft.additionalSpecs).toContain("OPTION 1: 100% organic cotton");
    expect(line.draft.additionalSpecs).toContain("OPTION 2: BCI cotton");
    expect(line.textCandidates).toContainEqual(expect.objectContaining({
      field: "width",
      value: "65 inches",
      qualifier: "greige width",
      status: "review",
    }));
    // Alternatives detection
    expect(line.sourcingAlternatives).toHaveLength(2);
    expect(line.sourcingAlternatives?.[0]).toMatchObject({
      label: "Alternative 1",
      description: "Organic cotton",
      fibre: "Cotton",
      percentage: "100",
    });
    expect(line.sourcingAlternatives?.[1]).toMatchObject({
      label: "Alternative 2",
      description: "BCI cotton",
      fibre: "Cotton",
      percentage: "",
    });
  });

  it("populates fibre name and stated percentage directly for standalone explicit composition without alternatives", async () => {
    const input = '100% organic cotton, 60" width, 200 gsm, Plain weave, 5000m';
    const [line] = await readRequirements(input, false);
    expect(line.blend).toBe("100% Cotton");
    expect(line.blendRows).toEqual([
      expect.objectContaining({ fibre: "Cotton", percentage: "100" })
    ]);
    expect(line.draft.gsm).toBe(200);
    expect(line.draft.quantity).toBe(5000);
    expect(line.draft.weaveType).toBe("Plain");
    expect(line.draft.additionalSpecs).toContain("Organic requirement: 100% organic cotton");
    expect(line.sourcingAlternatives).toBeUndefined();
  });

  it.each([
    ["16 OE / 16 OE   96 / 60", "16 OE × 16 OE", "96 × 60"],
    ["16 OE / 16 OE / 96 / 60", "16 OE × 16 OE", "96 × 60"],
    ["16 OE by 16 OE / 96 by 60", "16 OE × 16 OE", "96 × 60"],
    ["16 OE - 16 OE / 96 - 60", "16 OE × 16 OE", "96 × 60"],
    ["16 OE × 16 OE   96 × 60", "16 OE × 16 OE", "96 × 60"],
    ["16 OE x 16 OE / 96 x 60", "16 OE x 16 OE", "96 x 60"],
  ])("consistently interprets equivalent specification groups: %s", (source, expectedCount, expectedConstruction) => {
    const line = parse(source);
    expect(line.count).toBe(expectedCount);
    expect(line.construction).toBe(expectedConstruction);
  });
});
