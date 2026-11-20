import { describe, expect, it } from "vitest";
import { parseText, parseDescription } from "../parse-text";
import { lineDraft, buildBatch } from "../draft";
import { reconcileGroups, segmentText, deterministicGroups } from "../../../../../../src/domains/rfq/text/grouping";

export const A = 'Need 100% cotton plain poplin. Width 58", 130 gsm,\n20 x 20 / 52 x 48. Require 10,000 mtrs.\nSoft finish, suitable for shirts.';
describe("complete natural fabric requirements", () => {
  it("A: groups sentences and fills complete weave, composition, measurements and construction", () => {
    const lines = parseText(A); expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ blend: "100% Cotton", count: "20 x 20", construction: "52 x 48", finish: "Soft" });
    expect(lines[0].draft).toMatchObject({ weaveType: "plain poplin", width: "58 inches", gsm: 130, quantity: 10000, endUse: "Shirting" });
    expect(lines[0].original).toBe(A);
    for (const item of lines[0].sourceEvidence!) expect(lines[0].original.slice(item.start, item.end)).toBe(item.text);
    expect(lineDraft(lines[0]).templateSpecs).toEqual(expect.arrayContaining([
      expect.objectContaining({ specKey: "warp_count_ply", valueText: "20" }), expect.objectContaining({ specKey: "epi", valueNum: 52 }),
      expect.objectContaining({ specKey: "ppi", valueNum: 48 }),
    ]));
  });
  it("B: retains units, blend ratios, shades and sampling notes without rounding cm width", () => {
    const [line, ...rest] = parseText("65/35 poly cotton 3/1 twill.\n150 cm wide and 200 gsm.\nNeed 5k metres. Navy blue. Please arrange a sample.");
    expect(rest).toEqual([]);
    expect(line.blend).toBe("65% Polyester 35% Cotton");
    expect(line.draft).toMatchObject({ weaveType: "3/1 twill", width: `${150 / 2.54} inches`, gsm: 200, quantity: 5000 });
    expect(line.colours[0].name).toBe("Navy Blue");
    expect(line.draft.additionalSpecs).toContain("Please arrange a sample");
    expect(line.sourceEvidence?.some(item => item.text === "150 cm")).toBe(true);
  });
  it("C: two fabrics in one message have no specification leakage", () => {
    const lines = parseText("Need 100% cotton poplin, 130 gsm, 58 inches, 3000 m.\nAlso need 100% polyester twill, 200 gsm, 60 inches, 5000 m.");
    expect(lines).toHaveLength(2);
    expect(lines[0].draft).toMatchObject({ gsm: 130, width: "58 inches", quantity: 3000, weaveType: "poplin" });
    expect(lines[1].draft).toMatchObject({ gsm: 200, width: "60 inches", quantity: 5000, weaveType: "twill" });
    expect(lines[0].original).not.toContain("polyester"); expect(lines[1].original).not.toContain("cotton");
  });
  it("groups blank-line WhatsApp technical blocks and keeps yarn fibres out of blend rows", () => {
    const lines = parseText(`Hello,\nPlease share similar content swatches\n\n30’s viscose twill x 30’s viscose\nConstruction- 100x72\n135 GSM\nBlend 100% viscose\nTwill weave\n\n30’s slub x 30’s slub\n96x52\nPlain weave\n127gsm\n100% cotton`);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ blend: "100% Viscose", count: "30’s viscose twill x 30’s viscose", construction: "100x72" });
    expect(lines[0].draft).toMatchObject({ gsm: 135, weaveType: "Twill" });
    expect(lines[1]).toMatchObject({ blend: "100% Cotton", count: "30’s slub x 30’s slub", construction: "96x52" });
    expect(lines[1].draft).toMatchObject({ gsm: 127, weaveType: "Plain" });
  });
  it("keeps repeated yarn text, ranges, width and commercial wording reviewable", () => {
    const line = parseDescription(`100% Lyocell Twill.\n30s x 30s / 104 x 70 - 58" G\nGSM : 145\nSend greige price and finished dyed fabric price`);
    expect(line).toMatchObject({ blend: "100% Lyocell", count: "30s × 30s", construction: "104 × 70" });
    expect(line.draft).toMatchObject({ gsm: 145, width: "58 inches", weaveType: "Twill" });
    expect(line.draft.additionalSpecs).toContain("price");
    const blend = parseDescription("72%, polyester /25% viscose /3% spandex");
    expect(blend.blend).toBe("72% Polyester 25% Viscose 3% Spandex");
    expect(parseDescription("20pc x 20pc - 182/- ex mill indicative").draft.gsm).toBeUndefined();
  });
  it("D: named fibres and unlabeled numbers do not imply purity, units or GSM", () => {
    const [line] = parseText("Cotton polyester, plain poplin, 58, 130, 3000.");
    expect(line.blend).toBe("Cotton / Polyester"); expect(line.draft.weaveType).toBe("plain poplin");
    expect(line.draft.width).toBeUndefined(); expect(line.draft.gsm).toBeUndefined(); expect(line.draft.quantity).toBeUndefined();
    expect(line.draft.additionalSpecs).toContain("58");
    const cotton = lineDraft(parseDescription("Cotton poplin, 120 gsm"));
    expect(cotton.materialType).toBe("blend"); expect(cotton.blendComposition).toBe("Cotton"); expect(cotton.pureFiber).toBeUndefined();
  });
  it.each([
    ["cotton 100% poplin", "100% Cotton"], ["65% polyester 35% cotton twill", "65% Polyester 35% Cotton"],
    ["50/50 bamboo polyester satin", "50% Bamboo 50% Polyester"], ["97 cotton 3 spandex poplin", "97% Cotton 3% Spandex"],
  ])("reads supported unlabeled composition %s", (source, expected) => {
    expect(parseDescription(source).blend).toBe(expected);
  });
  it("E: custom weave candidates and certification notes are not lost or auto-confirmed", () => {
    const [line] = parseText("Need Zephyrlock weave, 58 inches, 200 gsm, 1000 m.\nMust meet our certification requirement.");
    expect(line.weaveDetail).toBe("Zephyrlock"); expect(line.draft.weaveType).toBeUndefined();
    expect(line.draft.additionalSpecs).toContain("Must meet our certification requirement");
  });
  it("F: MOQ does not override requested quantity", () => {
    const [line] = parseText("100% cotton, 58 inches, need 3000 m. MOQ offered is 500 m.");
    expect(line.draft.quantity).toBe(3000); expect(line.draft.additionalSpecs).toContain("MOQ offered is 500 m");
  });
  it.each(['58"', "58″", "58”", "58 inch", "58 inches", "58 in", "58 ins", "58 inchs", "150 cm", "150 cms", "150 centimetres", "150 centimeters"])("width variant %s", value => {
    const line = parseDescription(`Cotton, width ${value}`);
    expect(line.draft.width).toBe(/^150/.test(value) ? `${150 / 2.54} inches` : "58 inches");
  });
  it.each([["3,000 mtrs", 3000], ["1,00,000 m", 100000], ["10k metres", 10000], ["3000 linear metres", 3000], ["3000 running metres", 3000]])("quantity %s", (source, expected) => {
    expect(parseDescription(`Need ${source}`).draft.quantity).toBe(expected);
  });
  it("retains conflicting values, ranges, tolerances and unitless widths for review", () => {
    for (const [text, key] of [["58–60 inches", "width"], ["130–140 gsm", "gsm"], ["3000–5000 m", "quantity"], ["130 gsm and 140 gsm", "gsm"], ["130 gsm ± 5", "gsm"], ["130 ± 5 gsm", "gsm"], ["58 +/- 2 inches", "width"], ["width 58", "width"]] as const) {
      const line = parseDescription(text); expect(line.draft[key]).toBeUndefined(); expect(line.draft.additionalSpecs).toContain(text);
    }
    expect(parseDescription("58 inches — actually 60 inches").draft.width).toBe("60 inches");
  });
  it("shares only explicit scope and keeps single-fabric specs local", () => {
    const lines = parseText("Need cotton poplin. Also need polyester twill. Both fabrics should be 58 inches wide. Need 3000 m.");
    expect(lines).toHaveLength(2); expect(lines.every(line => line.draft.width === "58 inches")).toBe(true);
    expect(lines[0].draft.quantity).toBeUndefined(); expect(lines[1].draft.quantity).toBe(3000);
    const sharedTotal = parseText("Need cotton poplin. Also need polyester twill. Both fabrics need total 3000 m.");
    expect(sharedTotal.every(line => line.draft.quantity === undefined)).toBe(true);
    expect(() => parseText("Need cotton poplin. Also need polyester twill. Another fabric linen satin. Both fabrics 58 inches.")).toThrow("shared scope");
    expect(parseText("Need cotton poplin. Cotton should be organic. Width 58 inches.")).toHaveLength(1);
    expect(parseText("Need cotton poplin. Also need polyester twill. Width 58 inches for both fabrics.").every(line => line.draft.width === "58 inches")).toBe(true);
  });
  it("keeps yarn units, reed and possible PPL distinct", () => {
    const line = parseDescription("yarn count: 2/30 × 150D + 40D; EPI 52, PPL 48; reed 60, pick 48");
    expect(line.count).toBe("2/30 × 150D + 40D"); expect(line.construction).toBe("52 × 48");
    expect(line.draft.additionalSpecs).toContain("reed 60"); expect(line.warnings.join(" ")).toContain("PPI");
    expect(parseDescription("reed 60, pick 48").construction).toBe("");
    const conflicts = parseDescription("20x20 / 52x48 or 30x30 / 60x50");
    expect(conflicts.count).toBe(""); expect(conflicts.construction).toBe("");
    expect(parseDescription("construction: 52 X 48").construction).toBe("52 × 48");
    const conflictingLabels = parseDescription("20x20 / 52x48; EPI 60, PPI 50");
    expect(conflictingLabels.construction).toBe(""); expect(conflictingLabels.draft.additionalSpecs).toContain("52x48");
  });
  it("keeps explicit totals separate from shade splits, stock, sampling and unsupported units", () => {
    const line = parseDescription("Need 3000 m total, navy 1000 m, black 2000 m. Available stock 5000 m. Sample 5 m.");
    expect(line.draft.quantity).toBe(3000);
    expect(line.colours).toMatchObject([{ name: "navy", metres: "1000" }, { name: "black", metres: "2000" }]);
    expect(parseDescription("Order 100 rolls, 500 kg, 300 pieces").draft.quantity).toBeUndefined();
    expect(parseDescription("Need 100 yards").draft.quantity).toBeUndefined();
  });
  it("validates AI grouping against source IDs and explicit shared scope", () => {
    const text = "Need cotton poplin. Width 58 inches. Also need polyester twill.";
    const segments = segmentText(text);
    expect(segments).toHaveLength(3);
    expect(reconcileGroups(text, { groups: [{ segmentIds: [0, 1], uncertain: false }, { segmentIds: [2], uncertain: true }], sharedIds: [] })).toHaveLength(2);
    expect(() => reconcileGroups(text, { groups: [{ segmentIds: [0], uncertain: false }], sharedIds: [] })).toThrow();
    expect(() => reconcileGroups(text, { groups: [{ segmentIds: [0, 2], uncertain: false }], sharedIds: [1] })).toThrow();
    expect(deterministicGroups(text)).toHaveLength(2);
  });
  it("preserves parsed notes/counts/source in the normal submission payload", () => {
    const [line] = parseText(A); const batch = buildBatch([line], {}, "key");
    expect(batch.lines[0].inquiry.additionalSpecs).toContain("Soft finish");
    expect(batch.lines[0].inquiry.additionalSpecs).toContain(A);
    expect(batch.lines[0].inquiry.weaveType).toBe("plain poplin");
  });
});
