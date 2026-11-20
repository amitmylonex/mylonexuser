import { describe, expect, it } from "vitest";
import { parseText } from "../parse-text";

const EXACT_UNIFORM_INPUT = `Uniform stretch twill required:
Cotton 64.5%, Polyester 32.5%, Elastane 3%
Warp 40s; weft 40s + 40D
EPI 120 / PPI 70
Weave 3/1 Twill
210 g/m²
Finished cuttable width: 147.32 cm
Dyed black, easy-care finish

Qty 2.5k mts
Target below INR 285 per metre, excluding GST.
Delivery within 35 days of approved lab dip.
Do not assume ready stock.`;

const SCREENSHOT_2_INPUT = `A) 16 OE / 16 OE 96 / 60
2/2 Matty (OL), 65' greige width
145 GSM, Qty 4000 (M), ready stock

OPTION 1: 100% organic cotton
OPTION 2: 80% cotton / 20% recycled polyester
OPTION 3: BCI cotton, percentage to confirm

These are alternatives for ONE quality.
Budget @215/- per m. Quote each option separately.`;

describe("Uniform stretch twill regression", () => {
  it("extracts exact expected fields for the user uniform stretch twill inquiry", () => {
    const lines = parseText(EXACT_UNIFORM_INPUT);
    expect(lines).toHaveLength(1);
    const [line] = lines;

    // 1. Blend: Cotton 64.5%, Polyester 32.5%, Elastane 3%; total 100%
    expect(line.blend).toBe("64.5% Cotton 32.5% Polyester 3% Elastane");
    expect(line.blendRows).toEqual([
      expect.objectContaining({ fibre: "Cotton", percentage: "64.5" }),
      expect.objectContaining({ fibre: "Polyester", percentage: "32.5" }),
      expect.objectContaining({ fibre: "Elastane", percentage: "3" }),
    ]);

    // 2. Count: warp 40s; weft 40s + 40D
    expect(line.count).toBe("40s × 40s + 40D");

    // 3. Construction: EPI 120 × PPI 70
    expect(line.construction).toBe("120 × 70");

    // 4. Weave: 3/1 Twill (resolved from explicit label and compatible with generic twill)
    expect(line.draft.weaveType).toBe("3/1 Twill");
    expect(line.warnings).not.toContain("Several weave mentions were detected. Confirm the intended weave; none was chosen.");

    // 5. GSM: 210
    expect(line.draft.gsm).toBe(210);

    // 6. Width: 147.32 cm -> 58 inches, finished basis
    expect(line.draft.width).toBe("58 inches");
    expect(line.widthBasis).toBe("finished");

    // 7. Fabric state: Dyed, Finish: Easy-care, Colour: black
    expect(line.draft.fabricState).toBe("dyed");
    expect(line.finish).toBe("Easy-care");
    expect(line.colours).toHaveLength(1);
    expect(line.colours[0].name.toLowerCase()).toBe("black");

    // 8. Quantity: 2500 m
    expect(line.draft.quantity).toBe(2500);

    // 9. Target price: below INR 285 per metre, excluding GST
    expect(line.draft.targetPriceMax).toBe(285);
    expect(line.targetPriceQualifier).toBe("Below ₹285/m · excluding GST");
    expect(line.draft.additionalSpecs).toContain("Below ₹285/m · excluding GST");

    // 10. Relative delivery: within 35 days of approved lab dip
    expect(line.draft.requiredDeliveryDate).toBeUndefined();
    expect(line.warnings).not.toContain("Confirm a single real target delivery date, including its year, in YYYY-MM-DD format.");
    expect(line.draft.additionalSpecs).toContain("Delivery: within 35 days of approved lab dip");

    // 11. Production cycle: unspecified (prevented by "Do not assume ready stock")
    expect(line.draft.productionCycle).toBeUndefined();
    expect(line.warnings.some(w => /Negated production cycle/i.test(w))).toBe(true);
  });

  it("handles labelled weave variations with and without punctuation", () => {
    expect(parseText("Cotton twill, 150 GSM\nWeave 3/1 Twill\n500m")[0].draft.weaveType).toBe("3/1 Twill");
    expect(parseText("Cotton twill, 150 GSM\nWeave: 3/1 Twill\n500m")[0].draft.weaveType).toBe("3/1 Twill");
    expect(parseText("Cotton twill, 150 GSM\nWeave = 3/1 Twill\n500m")[0].draft.weaveType).toBe("3/1 Twill");
    expect(parseText("Cotton twill, 150 GSM\nWeave type — 3/1 Twill\n500m")[0].draft.weaveType).toBe("3/1 Twill");
  });

  it("preserves genuine conflicts for incompatible weaves", () => {
    const line = parseText("100% Cotton, 150 GSM\nWeave: Plain\nalso quote for satin weave\n500m")[0];
    expect(line.warnings.some(w => /conflicting weave mentions/i.test(w))).toBe(true);
  });

  it("regresses required price formats and exclusions", () => {
    // 1. @289/- per m
    const line1 = parseText("100% Cotton, 150 GSM, 500m, @289/- per m")[0];
    expect(line1.draft.targetPriceMax).toBe(289);
    expect(line1.targetPriceQualifier).toBe("₹289/m");

    // 2. Budget @215/- per m
    const line2 = parseText("100% Cotton, 150 GSM, 500m, Budget @215/- per m")[0];
    expect(line2.draft.targetPriceMax).toBe(215);
    expect(line2.targetPriceQualifier).toBe("Budget: ₹215/m");

    // 3. Target ₹280–285/m
    const line3 = parseText("100% Cotton, 150 GSM, 500m, Target ₹280–285/m")[0];
    expect(line3.draft.targetPriceMin).toBe(280);
    expect(line3.draft.targetPriceMax).toBe(285);
    expect(line3.targetPriceQualifier).toBe("Target: ₹280–₹285/m");

    // 4. Supplier quoted ₹310/m; our target below ₹285/m
    const line4 = parseText("100% Cotton, 150 GSM, 500m\nSupplier quoted ₹310/m; our target below ₹285/m")[0];
    expect(line4.draft.targetPriceMax).toBe(285);
    expect(line4.targetPriceQualifier).toBe("Below ₹285/m");
    expect(line4.draft.additionalSpecs).toContain("Supplier quote: ₹310/m");

    // 5. ₹420/kg must NOT be placed into a ₹/m field
    const line5 = parseText("100% Cotton, 150 GSM, 500m, ₹420/kg")[0];
    expect(line5.draft.targetPriceMax).toBeUndefined();
    expect(line5.warnings.some(w => /per kg rather than per metre/i.test(w))).toBe(true);
    expect(line5.draft.additionalSpecs).toContain("Price stated as ₹420/kg");

    // 6. Courier charge ₹350 is not a fabric target price
    const line6 = parseText("100% Cotton, 150 GSM, 500m, Courier charge ₹350")[0];
    expect(line6.draft.targetPriceMax).toBeUndefined();
  });

  it("parses multi-fibre sourcing alternative into two editable rows with 100% total", () => {
    const lines = parseText(SCREENSHOT_2_INPUT);
    expect(lines).toHaveLength(1);
    const [line] = lines;

    expect(line.sourcingAlternatives).toHaveLength(3);
    const [alt1, alt2, alt3] = line.sourcingAlternatives!;

    // Alt 1: 100% organic cotton
    expect(alt1.label).toBe("Alternative 1");
    expect(alt1.rows).toHaveLength(1);
    expect(alt1.rows![0].description).toBe("Organic cotton");
    expect(alt1.rows![0].percentage).toBe("100");

    // Alt 2: 80% cotton / 20% recycled polyester (TWO editable fibre rows)
    expect(alt2.label).toBe("Alternative 2");
    expect(alt2.rows).toHaveLength(2);
    expect(alt2.rows![0].description).toBe("Cotton");
    expect(alt2.rows![0].percentage).toBe("80");
    expect(alt2.rows![1].description).toBe("Recycled polyester");
    expect(alt2.rows![1].percentage).toBe("20");

    // Alt 3: BCI cotton, percentage to confirm (blank)
    expect(alt3.label).toBe("Alternative 3");
    expect(alt3.rows).toHaveLength(1);
    expect(alt3.rows![0].description).toBe("BCI cotton, percentage to confirm");
    expect(alt3.rows![0].percentage).toBe("");

    // Target price from Budget @215/- per m
    expect(line.draft.targetPriceMax).toBe(215);
  });
});
