import { describe, expect, it } from "vitest";
import { parseText } from "../parse-text";
import { validateBlendRows } from "../../../../../../src/domains/rfq/blend/validation";

const EXACT_INPUT = `45’s Cotton/Poly (65/35) x 45’s Cotton/Poly (65/35) / 116 x 76 x 63" Greige Width, Plain
65% PSCP Cotton, 35% Recycle Poly
Order qty : 1,50,000 mtrs`;

describe("qualified blend regression: 65% PSCP Cotton, 35% Recycle Poly", () => {
  it("extracts exact blend percentages and technical fields without losing qualified fibres", () => {
    const lines = parseText(EXACT_INPUT);
    expect(lines).toHaveLength(1);
    const [line] = lines;

    // Count preserving yarn wording
    expect(line.count).toBe("45’s Cotton/Poly (65/35) x 45’s Cotton/Poly (65/35)");

    // Construction
    expect(line.construction).toBe("116 x 76");

    // Width & basis
    expect(line.draft.width).toBe("63 inches");
    expect(line.widthBasis).toBe("greige");

    // Weave
    expect(line.draft.weaveType).toBe("Plain");

    // Quantity
    expect(line.draft.quantity).toBe(150000);

    // GSM unstated
    expect(line.draft.gsm).toBeUndefined();

    // Blend rows: Cotton 65%, Polyester (or Recycled Polyester) 35%
    expect(line.blendRows).toBeDefined();
    expect(line.blendRows?.length).toBe(2);
    const cottonRow = line.blendRows?.find(r => /cotton/i.test(r.fibre));
    const polyRow = line.blendRows?.find(r => /poly/i.test(r.fibre));
    expect(cottonRow?.percentage).toBe("65");
    expect(polyRow?.percentage).toBe("35");

    // Total 100%
    const blendValidation = validateBlendRows(line.blendRows || []);
    expect(blendValidation.state).toBe("complete");
    expect(blendValidation.total).toBe("100");

    // No confirm fibre percentages warning
    expect(line.warnings.some(w => /confirm fibre percentages|named fibres do not imply/i.test(w))).toBe(false);

    // Qualifiers preserved in additionalSpecs / notes
    expect(line.draft.additionalSpecs).toMatch(/PSCP/i);
    expect(line.draft.additionalSpecs).toMatch(/Recycle/i);
  });

  it("supports variations of qualified fibres, percent words and reverse order", () => {
    // 35% recycled polyester and 65 percent cotton
    const text1 = "65 percent cotton, 35% recycled polyester\nQty: 5000 mtrs";
    const [line1] = parseText(text1);
    expect(line1.blendRows?.find(r => /cotton/i.test(r.fibre))?.percentage).toBe("65");
    expect(line1.blendRows?.find(r => /poly/i.test(r.fibre))?.percentage).toBe("35");
    expect(validateBlendRows(line1.blendRows || []).state).toBe("complete");

    // Reverse order: Cotton 65%, recycled polyester 35%
    const text2 = "Cotton 65%, recycled polyester 35%\nWeave: Plain, Width: 58 inches";
    const [line2] = parseText(text2);
    expect(line2.blendRows?.find(r => /cotton/i.test(r.fibre))?.percentage).toBe("65");
    expect(line2.blendRows?.find(r => /poly/i.test(r.fibre))?.percentage).toBe("35");
    expect(validateBlendRows(line2.blendRows || []).state).toBe("complete");
  });

  it("handles directional yarn compositions that differ when no overall composition is given", () => {
    const text = "40's Cotton x 40's Poly / 76 x 52 / 58 inches / Plain";
    const [line] = parseText(text);
    expect(line.blend).toBe("");
    expect(line.warnings.some(w => /differ|not averaged|compositions differ/i.test(w))).toBe(true);
  });

  it("flags explicit overall and yarn compositions that genuinely conflict", () => {
    const text = `45’s Cotton/Poly (65/35) x 45’s Cotton/Poly (65/35) / 116 x 76
60% Cotton, 40% Polyester
Qty: 1000m`;
    const [line] = parseText(text);
    expect(line.blend).toBe("");
    expect(line.warnings.some(w => /conflict/i.test(w))).toBe(true);
  });

  it("leaves percentages unfilled when only named fibres are mentioned without amounts", () => {
    const text = "Need Cotton and Polyester poplin fabric\nQuantity: 1000m";
    const [line] = parseText(text);
    expect(line.blendRows?.every(r => r.percentage === "")).toBe(true);
    expect(line.warnings.some(w => /confirm fibre percentages|named fibres/i.test(w))).toBe(true);
  });

  it("handles decimal percentages exactly (97/3 and 64.5/32.5/3)", () => {
    const text1 = "97/3 Cotton Lycra / 58 inches / 200 gsm / Plain";
    const [line1] = parseText(text1);
    expect(line1.blendRows?.find(r => /cotton/i.test(r.fibre))?.percentage).toBe("97");
    expect(line1.blendRows?.find(r => /lycra|spandex/i.test(r.fibre))?.percentage).toBe("3");
    expect(validateBlendRows(line1.blendRows || []).state).toBe("complete");

    const text2 = "64.5% Cotton, 32.5% Recycle Poly, 3% Elastane\n1000 metres";
    const [line2] = parseText(text2);
    expect(line2.blendRows?.find(r => /cotton/i.test(r.fibre))?.percentage).toBe("64.5");
    expect(line2.blendRows?.find(r => /poly/i.test(r.fibre))?.percentage).toBe("32.5");
    expect(line2.blendRows?.find(r => /elastane/i.test(r.fibre))?.percentage).toBe("3");
    const val2 = validateBlendRows(line2.blendRows || []);
    expect(val2.state).toBe("complete");
    expect(val2.total).toBe("100");
  });

  it("processes multiple fabric requirements in the same text cleanly", () => {
    const text = `Fabric 1:
45’s Cotton/Poly (65/35) x 45’s Cotton/Poly (65/35) / 116 x 76 x 63" Greige Width, Plain
65% PSCP Cotton, 35% Recycle Poly
Order qty : 1,50,000 mtrs

Fabric 2:
100% GOTS Organic Cotton, 58 inches finished, 140 gsm
Quantity: 50,000 mtrs`;

    const lines = parseText(text);
    expect(lines).toHaveLength(2);
    expect(lines[0].blendRows?.find(r => /cotton/i.test(r.fibre))?.percentage).toBe("65");
    expect(lines[0].blendRows?.find(r => /poly/i.test(r.fibre))?.percentage).toBe("35");
    expect(lines[1].blendRows?.find(r => /cotton/i.test(r.fibre))?.percentage).toBe("100");
  });
});
