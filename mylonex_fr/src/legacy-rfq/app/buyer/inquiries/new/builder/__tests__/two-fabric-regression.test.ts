import { describe, expect, it } from "vitest";
import { parseText } from "../parse-text";

const EXACT_TWO_FABRIC_INPUT = `A) 20's P/V (65/35) × 20's P/V (65/35)
100 by 56, 63” Griege width, 2/2 Twill

Qty 6000m total
Navy 2000m
Black 2000m
Olive 1500m
Dyed, peach finish
Please check the colour split.

B) 30s viscose / 30s viscose - 100 / 72
2/1 Twill, 135 gsm, 58" finished width
100% viscose, RFD
Qty 1500 MTRS

B must not receive peach finish.
Send prices separately for A and B.`;

describe("Two-fabric regression: width autofill, basis qualification, and colour allocations", () => {
  it("parses both fabrics independently with exact expected fields", () => {
    const lines = parseText(EXACT_TWO_FABRIC_INPUT);
    expect(lines).toHaveLength(2);
    const [a, b] = lines;

    // Expected A:
    // Blend: Polyester 65%, Viscose 35%
    expect(a.blend).toBe("65% Polyester 35% Viscose");
    expect(a.blendRows).toEqual([
      expect.objectContaining({ fibre: "Polyester", percentage: "65" }),
      expect.objectContaining({ fibre: "Viscose", percentage: "35" }),
    ]);
    expect(a.count).toBe("20s × 20s");
    expect(a.construction).toBe("100 × 56");
    expect(a.draft.weaveType).toBe("2/2 Twill");
    expect(a.draft.width).toBe("63 inches");
    expect(a.widthBasis).toBe("greige");
    expect(a.draft.fabricState).toBe("dyed");
    expect(a.finish).toBe("Peach");
    expect(a.draft.quantity).toBeUndefined(); // 6,000 stated versus 5,500 allocated requires review.
    expect(a.colours).toHaveLength(3);
    expect(a.colours).toEqual([
      expect.objectContaining({ name: "Navy", metres: "2000" }),
      expect.objectContaining({ name: "Black", metres: "2000" }),
      expect.objectContaining({ name: "Olive", metres: "1500" }),
    ]);
    expect(a.draft.gsm).toBeUndefined();
    expect(a.draft.productionCycle).toBeUndefined();

    // Colour subtotal: 5500m, explicit total: 6000m. 500m difference flagged
    expect(a.warnings).toContain("Quantity mismatch: colour quantities total 5500 m; explicit total is 6000 m. Both values were preserved.");
    expect(a.warnings.join(" ")).not.toContain("Conflicting per-colour quantities");

    // Expected B:
    expect(b.blend).toBe("100% Viscose");
    expect(b.blendRows).toEqual([
      expect.objectContaining({ fibre: "Viscose", percentage: "100" }),
    ]);
    expect(b.count).toBe("30s viscose × 30s viscose");
    expect(b.construction).toBe("100 × 72");
    expect(b.draft.weaveType).toBe("2/1 Twill");
    expect(b.draft.gsm).toBe(135);
    expect(b.draft.width).toBe("58 inches");
    expect(b.widthBasis).toBe("finished");
    expect(b.draft.fabricState).toBe("rfd");
    expect(b.draft.quantity).toBe(1500);
    expect(b.finish).toBe("");
    expect(b.colours).toHaveLength(0);
  });
});
