import { describe, expect, it } from "vitest";
import { parseText } from "../parse-text";
import { deterministicGroups } from "../../../../../../src/domains/rfq/text/grouping";

const EXACT_REVISION_INPUT = `Need 100% cotton poplin
40s x 40s / 133 x 72
120 gsm, 58 inches finished, RFD
Qty 3000m, target ₹145/m

Correction:
GSM should be 125, not 120.
Final order quantity 4500m, replacing 3000m.
Revised target ₹152/m; ignore the earlier ₹145.
Width and construction unchanged.
Made to order. No silicone finish.`;

const CORRECTION_FRAGMENT_ONLY = `Correction:
GSM should be 125, not 120.
Final order quantity 4500m, replacing 3000m.
Revised target ₹152/m; ignore the earlier ₹145.
Width and construction unchanged.
Made to order. No silicone finish.`;

describe("Revision-aware grouping and extraction", () => {
  it("groups full message into EXACTLY ONE fabric draft with all revised values", () => {
    // 1. Grouping verification
    const groups = deterministicGroups(EXACT_REVISION_INPUT);
    expect(groups).toHaveLength(1);

    const lines = parseText(EXACT_REVISION_INPUT);
    expect(lines).toHaveLength(1);
    const line = lines[0];

    // Blend: Cotton 100%
    expect(line.blend).toBe("100% Cotton");
    expect(line.blendRows?.[0]?.fibre).toBe("Cotton");
    expect(line.blendRows?.[0]?.percentage).toBe("100");

    // Weave: Poplin
    expect(line.draft.weaveType?.toLowerCase()).toBe("poplin");
    expect(line.warnings).not.toContain("Several conflicting weave mentions were detected. Confirm the intended weave; none was chosen.");
    expect(line.warnings.some(w => /Review unknown weave wording/i.test(w))).toBe(false);

    // Count: 40s x 40s
    expect(line.count).toBe("40s x 40s");

    // Construction: 133 x 72
    expect(line.construction).toBe("133 x 72");

    // GSM: 125 (not 120)
    expect(line.draft.gsm).toBe(125);
    expect(line.warnings.some(w => /Unresolved number 120/i.test(w))).toBe(false);

    // Width: 58 inches, Finished
    expect(line.draft.width).toMatch(/^58(?:\s*inches)?$/);
    expect(line.widthBasis).toBe("finished");

    // State: RFD
    expect(line.draft.fabricState).toBe("rfd");

    // Quantity: 4500 m (not 3000m)
    expect(line.draft.quantity).toBe(4500);
    expect(line.warnings).not.toContain("Conflicting total quantities; confirm the intended total in metres.");

    // Target price: INR 152 per metre (not 145)
    expect(line.draft.targetPriceMax).toBe(152);
    expect(line.targetPriceQualifier).toBe("Target: ₹152/m");

    // Production cycle: Made to order
    expect(line.draft.productionCycle).toBe("made_to_order");

    // Exclusion: No silicone finish (NOT a positive finish)
    expect(line.finish).toBe("");
    expect(line.draft.additionalSpecs).toMatch(/no silicone finish/i);
  });

  it("handles a correction fragment alone without inventing missing original specifications", () => {
    const lines = parseText(CORRECTION_FRAGMENT_ONLY);
    expect(lines).toHaveLength(1);
    const line = lines[0];

    // Does NOT invent missing original specifications
    expect(line.blend).toBe("");
    expect(line.count).toBe("");
    expect(line.construction).toBe("");
    expect(line.draft.weaveType).toBeUndefined();
    expect(line.draft.width).toBeUndefined();
    expect(line.draft.fabricState).toBeUndefined();

    // Still correctly extracts the specifications stated in the fragment
    expect(line.draft.gsm).toBe(125);
    expect(line.draft.quantity).toBe(4500);
    expect(line.draft.targetPriceMax).toBe(152);
    expect(line.draft.productionCycle).toBe("made_to_order");
    expect(line.finish).toBe("");
    expect(line.draft.additionalSpecs).toMatch(/no silicone finish/i);
  });

  it("multi-fabric scope: 'For B only, change quantity to 2000m' leaves A unchanged", () => {
    const input = `A) 100% cotton poplin, 120 gsm, 58", 3000m
B) 100% linen twill, 180 gsm, 58", 4000m

For B only, change quantity to 2000m`;
    const lines = parseText(input);
    expect(lines).toHaveLength(2);
    expect(lines[0].draft.quantity).toBe(3000);
    expect(lines[1].draft.quantity).toBe(2000);
  });

  it("multi-fabric scope: 'Both fabrics: revised delivery instruction' applies to both", () => {
    const input = `A) 100% cotton poplin, 120 gsm, 58", 3000m
B) 100% linen twill, 180 gsm, 58", 4000m

Both fabrics: delivery within 20 days`;
    const lines = parseText(input);
    expect(lines).toHaveLength(2);
    expect(lines[0].draft.additionalSpecs).toMatch(/delivery: within 20 days/i);
    expect(lines[1].draft.additionalSpecs).toMatch(/delivery: within 20 days/i);
  });

  it("multi-fabric scope: 'Both yarns are combed' does not create another fabric or shared instruction", () => {
    const input = `100% cotton twill, 40s x 40s / 120 x 70, 150 gsm, 58", 3000m
Both yarns are combed`;
    const lines = parseText(input);
    expect(lines).toHaveLength(1);
    expect(lines[0].draft.quantity).toBe(3000);
  });

  it("multi-fabric scope: 'Change GSM to 125' after multiple fabrics flags ambiguity", () => {
    const input = `A) 100% cotton poplin, 120 gsm, 58", 3000m
B) 100% linen twill, 180 gsm, 58", 4000m

Change GSM to 125`;
    const lines = parseText(input);
    expect(lines).toHaveLength(2);
    expect(lines[1].warnings.some(w => /ambiguous revision target/i.test(w))).toBe(true);
  });

  it("alternatives vs replacement: '125 or 130 GSM acceptable' is an alternative, not a replacement", () => {
    const input = `100% cotton poplin, 58", 3000m
125 or 130 GSM acceptable`;
    const lines = parseText(input);
    expect(lines).toHaveLength(1);
    // Should retain review warning and not silently pick one
    expect(lines[0].warnings.some(w => /gsm:.*needs review/i.test(w))).toBe(true);
  });

  it("contradictory corrections without clear precedence require review", () => {
    const input = `100% cotton poplin, 120 gsm, 58", 3000m
Correction: GSM should be 125.
Correction: GSM should be 140.`;
    const lines = parseText(input);
    expect(lines).toHaveLength(1);
    expect(lines[0].warnings.some(w => /contradictory.*correction/i.test(w))).toBe(true);
  });
});
