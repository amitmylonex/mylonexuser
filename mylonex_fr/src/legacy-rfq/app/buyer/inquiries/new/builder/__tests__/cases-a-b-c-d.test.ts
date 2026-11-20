import { describe, it, expect } from "vitest";
import { parseText } from "../parse-text";

describe("reproduction cases A-D local extraction", () => {
  it("CASE A — WEAVE SHORT FORM AND WIDTH BASIS", () => {
    const text = `20’s P/V (65/35) x 20’s P/V (65/35) x 100 x 56
x 63" Greige width; 2/2 TWL.
Supply P/D, shade DK NVY; finished cuttable width 58".
Qty 5K MTRS; target INR 165/m ex-mill.`;

    const [line] = parseText(text);

    // Polyester 65%, viscose 35%
    expect(line.blend).toBe("65% Polyester 35% Viscose");
    expect(line.blendRows).toEqual([
      { id: "fibre-0", fibre: "Polyester", percentage: "65" },
      { id: "fibre-1", fibre: "Viscose", percentage: "35" },
    ]);

    // Count 20s x 20s; construction 100 x 56
    expect(line.count).toBe("20s × 20s");
    expect(line.construction).toBe("100 x 56");

    // Weave 2/2 Twill
    expect(line.draft.weaveType).toBe("2/2 Twill");

    // 63 inches greige width reference retained; requested finished cuttable width 58"
    expect(line.draft.width).toBe("58 inches");
    expect(line.widthBasis).toBe("finished");
    expect(line.draft.additionalSpecs).toContain("Stated width: 63 inches · Greige width");

    // Piece dyed; dark navy
    expect(line.draft.fabricState).toBe("dyed");
    expect(line.draft.dyeMethod).toBe("piece_dyed");
    expect(line.colours.some(c => c.name === "Dark Navy")).toBe(true);

    // Quantity 5,000 metres
    expect(line.draft.quantity).toBe(5000);

    // INR 165/m ex-mill
    expect(line.draft.targetPriceMax).toBe(165);
    expect(line.draft.additionalSpecs).toContain("Target: ₹165/m · ex mill");

    // GSM missing because none is stated
    expect(line.draft.gsm).toBeUndefined();

    // No false unitless-width or count/construction warning for 2/2 TWL
    expect(line.warnings.some(w => /unitless|count\/construction|numeric pair/i.test(w))).toBe(false);
  });

  it("CASE B — EXPLICIT WEAVE LABEL AND INVALID FIBRE NAMES", () => {
    const text = `Warp: 80D/72/2 Poly HIM Roto FD White;
weft: 2/40’s Cotton Combed TFO Knotless.
Construction 76 X 52; 63" Greige Width; weave PLN.
Supply GREIGE; order 5,000 (M).
Blend percentages not available—please confirm.`;

    const [line] = parseText(text);

    // Weave Plain: PLN is a supported alias in explicit weave context
    expect(line.draft.weaveType).toBe("Plain");

    // Preserve warp/weft yarn descriptions
    expect(line.draft.additionalSpecs).toContain("Warp yarn source: 80D/72/2 Poly HIM Roto FD White");
    expect(line.draft.additionalSpecs).toContain("Weft yarn source: 2/40’s Cotton Combed TFO Knotless");

    // Construction 76 x 52
    expect(line.construction).toBe("76 X 52");

    // Width 63 inches, greige basis
    expect(line.draft.width).toBe("63 inches");
    expect(line.widthBasis).toBe("greige");
    expect(line.draft.additionalSpecs).toContain("Stated width: 63 inches · Greige width");

    // Supply state Greige
    expect(line.draft.fabricState).toBe("greige");

    // Quantity 5,000 metres
    expect(line.draft.quantity).toBe(5000);

    // Polyester and cotton are named materials; proportions unknown
    expect(line.blend).toBe("Polyester / Cotton");
    expect(line.blendRows?.map(r => r.fibre)).toEqual(["Polyester", "Cotton"]);
    expect(line.blendRows?.every(r => r.percentage === "")).toBe(true);

    // NEVER create fibres named "percentages not available" or "please confirm"
    for (const row of line.blendRows || []) {
      expect(row.fibre.toLowerCase()).not.toContain("percentage");
      expect(row.fibre.toLowerCase()).not.toContain("available");
      expect(row.fibre.toLowerCase()).not.toContain("confirm");
    }

    // GSM and other unstated specifications remain missing
    expect(line.draft.gsm).toBeUndefined();

    // Do not infer currently dyed fabric from "FD White" in the yarn description
    expect(line.colours.filter(c => c.name.toLowerCase() === "white")).toHaveLength(0);
  });

  it("CASE C — DRILL ALIAS AND MATCHING TOTAL", () => {
    const text = `Composition: 62.5% rPET + 34.5% CV + 3% SPX;
3/1 DRL; 205 gsm; CW 57".
Finish: ENZ + SIL; colours:
BLK—1,250 m; CHAR GRY—750 metres; DK NVY—1K mtrs.
Total requirement 3,000 m.`;

    const [line] = parseText(text);

    // Recycled polyester 62.5%, viscose 34.5%, elastane 3%
    expect(line.blendRows).toEqual([
      { id: "fibre-0", fibre: "Recycled Polyester", percentage: "62.5" },
      { id: "fibre-1", fibre: "Viscose", percentage: "34.5" },
      { id: "fibre-2", fibre: "Spandex", percentage: "3" },
    ]);

    // Weave 3/1 Drill
    expect(line.draft.weaveType).toBe("3/1 Drill");

    // GSM 205; cuttable width 57"
    expect(line.draft.gsm).toBe(205);
    expect(line.draft.width).toBe("57 inches");

    // Enzyme wash and silicone finish
    expect(line.finish).toBe("Enzyme wash + Silicone");

    // Black 1,250 m; charcoal grey 750 m; dark navy 1,000 m
    expect(line.colours.map(c => ({ name: c.name, metres: c.metres }))).toEqual([
      { name: "Black", metres: "1250" },
      { name: "Charcoal Grey", metres: "750" },
      { name: "Dark Navy", metres: "1000" },
    ]);

    // Total 3,000 m, counted once
    expect(line.draft.quantity).toBe(3000);

    // No false "incomplete subtotal" warning when every allocation is complete and agrees with stated total
    expect(line.warnings.some(w => /incomplete, uncertain or non-additive|known colour subtotal/i.test(w))).toBe(false);

    // No count/construction warning for supported 3/1 DRL phrase
    expect(line.warnings.some(w => /count\/construction|numeric pair/i.test(w))).toBe(false);
  });

  it("CASE D — PANTONE ALLOCATIONS MUST ADD", () => {
    const text = `100% CLY; 30s × 30s / 104 × 70;
145 GSM; 58 inches; 2/1 twill.
600 m shade Pantone 19 4052 TCX;
400 M shade 13-1023TCX.
Soft finish; running quality.`;

    const [line] = parseText(text);

    // Lyocell 100%; count 30s x 30s; construction 104 x 70
    expect(line.blend).toBe("100% Lyocell");
    expect(line.count).toBe("30s × 30s");
    expect(line.construction).toBe("104 × 70");

    // GSM 145; width 58 inches; weave 2/1 Twill
    expect(line.draft.gsm).toBe(145);
    expect(line.draft.width).toBe("58 inches");
    expect(line.draft.weaveType).toBe("2/1 twill");

    // Preserve the two distinct Pantone shade allocations
    expect(line.colours.map(c => ({ name: c.name, metres: c.metres }))).toEqual([
      { name: "Pantone 19-4052 TCX", metres: "600" },
      { name: "13-1023 TCX", metres: "400" },
    ]);

    // Quantity 1,000 metres (additive allocations, not conflicting total)
    expect(line.draft.quantity).toBe(1000);
    expect(line.warnings.some(w => /conflicting total/i.test(w))).toBe(false);

    // Soft finish; running quality
    expect(line.finish).toBe("Soft");
    expect(line.draft.productionCycle).toBe("running_production");
  });
});
