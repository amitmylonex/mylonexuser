import { describe, expect, it } from "vitest";
import { parseText } from "../parse-text";

describe("MATT 2/2 weave recognition regression", () => {
  const EXACT_INPUT = `100% cotton
40 HRKM x 40 HRKM - 124x104
143 GSM
MATT 2/2
Finish - PFH
58"
quantity - 700m
target price - 195/-
ready`;

  it("reproduces exact user input: extracts MATT 2/2 as weave without false count/construction ambiguity warning", () => {
    const lines = parseText(EXACT_INPUT);
    expect(lines).toHaveLength(1);
    const [line] = lines;

    // Blend: Cotton 100%
    expect(line.blend).toBe("100% Cotton");
    expect(line.blendRows).toEqual([
      expect.objectContaining({ fibre: "Cotton", percentage: "100" }),
    ]);

    // Count: 40 HRKM x 40 HRKM
    expect(line.count).toBe("40 HRKM x 40 HRKM");

    // Construction: 124x104
    expect(line.construction).toBe("124x104");

    // GSM: 143
    expect(line.draft.gsm).toBe(143);

    // Canonical weave; original MATT wording remains in evidence.
    expect(line.draft.weaveType).toBe("2/2 Matty");

    // Finish: PFH
    expect(line.finish).toBe("PFH");

    // Width: 58 inches
    expect(line.draft.width).toBe("58 inches");

    // Quantity: 700m
    expect(line.draft.quantity).toBe(700);

    // Target Price: 195 (basis unspecified confirms existing currency/basis confirmation rules)
    expect(line.targetPriceAmount).toBe(195);
    expect(line.targetPriceBasis).toBe("unspecified");
    expect(line.draft.targetPriceMax).toBeUndefined();

    // Production Cycle: ready
    expect(line.draft.productionCycle).toBe("ready_stock");

    // Fabric state remains unstated
    expect(line.draft.fabricState).toBeUndefined();

    // No false count/construction ambiguity warning for 2/2
    expect(line.warnings).not.toContain("Review numeric pair “2/2”; count versus construction is ambiguous.");
    expect(line.warnings.some(w => /Review numeric pair.*2\/2/i.test(w))).toBe(false);
  });

  describe("Weave and repeat-ratio notation variations", () => {
    it.each([
      ["MATT 2/2", "2/2 Matty"],
      ["2/2 MATT", "2/2 Matty"],
      ["Matty 2/2", "2/2 Matty"],
      ["2/2 Matty", "2/2 Matty"],
      ["Twill 3/1", "Twill 3/1"],
      ["3/1 Twill", "3/1 Twill"],
      ["Drill 3/1", "Drill 3/1"],
      ["3/1 Drill", "3/1 Drill"],
      ["MATT (2/2)", "2/2 Matty"],
      ["MATT - 2/2", "2/2 Matty"],
      ["Weave: MATT 2/2", "2/2 Matty"],
      ["Weave MATT 2 / 2", "2/2 Matty"],
    ])("recognizes notation %s as weave '%s'", (inputWeave, expectedWeave) => {
      const text = `100% cotton
40s x 40s / 120 x 80
140 gsm
${inputWeave}
58"
1000m`;
      const [line] = parseText(text);
      expect(line.draft.weaveType).toBe(expectedWeave);
      expect(line.warnings.some(w => /Review numeric pair.*(?:2\/2|3\/1)/i.test(w))).toBe(false);
    });
  });

  describe("Distinguishing weave from finish / coating and handling ambiguous terms", () => {
    it("treats 'Matt finish' as finish, not weave", () => {
      const text = `100% cotton
40s x 40s / 120 x 80
140 gsm
Matt finish
58"
1000m`;
      const [line] = parseText(text);
      expect(line.draft.weaveType).toBeUndefined();
      expect(line.finish).toMatch(/matt/i);
    });

    it("treats 'Matte PU coating' as finish/coating, not weave", () => {
      const text = `100% cotton
40s x 40s / 120 x 80
140 gsm
Matte PU coating
58"
1000m`;
      const [line] = parseText(text);
      expect(line.draft.weaveType).toBeUndefined();
      expect(line.finish).toMatch(/Matte PU coating/i);
    });

    it("requires review for standalone ambiguous 'matt' without ratio or cue", () => {
      const text = `100% cotton
40s x 40s / 120 x 80
140 gsm
matt
58"
1000m`;
      const [line] = parseText(text);
      // Standalone matt without cue or ratio should require review and not populate draft.weaveType directly
      expect(line.draft.weaveType).toBeUndefined();
      expect(line.weaveDetail).toBe("matt");
      expect(line.warnings.some(w => /weave/i.test(w))).toBe(true);
    });

    it("does not treat bare '2/2' as weave without a weave term", () => {
      const text = `100% cotton
40s x 40s / 120 x 80
140 gsm
2/2
58"
1000m`;
      const [line] = parseText(text);
      expect(line.draft.weaveType).toBeUndefined();
      // Bare 2/2 without weave context remains ambiguous
      expect(line.warnings.some(w => /2\/2/i.test(w))).toBe(true);
    });
  });

  describe("Numerical role preservation", () => {
    it("distinguishes blend ratio, yarn count, construction, and weave repeat ratio in one input", () => {
      const text = `65/35 poly cotton
2/40's x 2/40's
124/104
MATT 2/2
160 GSM
58"
5000m`;
      const [line] = parseText(text);
      expect(line.blendRows).toEqual([
        expect.objectContaining({ fibre: "Polyester", percentage: "65" }),
        expect.objectContaining({ fibre: "Cotton", percentage: "35" }),
      ]);
      expect(line.count).toContain("2/40's");
      expect(line.construction).toBe("124 × 104");
      expect(line.draft.weaveType).toBe("2/2 Matty");
      expect(line.draft.gsm).toBe(160);
      expect(line.warnings.some(w => /Review numeric pair.*2\/2/i.test(w))).toBe(false);
    });
  });
});
