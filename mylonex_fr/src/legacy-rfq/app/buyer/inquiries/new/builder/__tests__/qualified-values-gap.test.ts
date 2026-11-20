import { describe, expect, it } from "vitest";
import { parseText } from "../parse-text";
import { assessLineReadiness } from "../readiness";
import { lineDraft } from "../draft";

describe("Qualified values gap: detection, editable controls, and downstream contract", () => {
  it("distinguishes exact 185 GSM", () => {
    const [line] = parseText("Cotton poplin, 185 GSM, 58 inches, 5000m, RFD, ready stock");
    expect(line.draft.gsm).toBe(185);
    expect(line.gsmMin).toBeUndefined();
    expect(line.gsmMax).toBeUndefined();
  });

  it("distinguishes range 180–190 GSM and 180 to 190 GSM: populates min/max without silently choosing a scalar", () => {
    const [line1] = parseText("Cotton poplin, 180–190 gsm, 58 inches, 5000m, RFD, ready stock");
    expect(line1.gsmMin).toBe(180);
    expect(line1.gsmMax).toBe(190);
    expect(line1.draft.gsm).toBeUndefined(); // Do not silently choose 180, 185, or 190!
    expect(line1.gsmQualifier).toBe("Range: 180–190 g/m²");
    expect(line1.warnings.some(w => /needs review; ranges/i.test(w))).toBe(false);

    const [line2] = parseText("Cotton poplin, 180 to 190 GSM, 58 inches, 5000m, RFD, ready stock");
    expect(line2.gsmMin).toBe(180);
    expect(line2.gsmMax).toBe(190);
    expect(line2.draft.gsm).toBeUndefined();
    expect(line2.gsmQualifier).toBe("Range: 180–190 g/m²");

    // Readiness does not say "Add GSM"; it explains target GSM confirmation is needed
    const readiness = assessLineReadiness(line1);
    expect(readiness.missing).not.toContain("GSM");
    expect(readiness.summary).toContain("Confirm target GSM (range 180–190 g/m² captured)");
  });

  it("distinguishes approximate GSM: around 185 GSM", () => {
    const [line] = parseText("Cotton poplin, around 185 GSM, 58 inches, 5000m, RFD, ready stock");
    expect(line.draft.gsm).toBe(185);
    expect(line.gsmQualifier).toBe("Approximate: around 185 g/m²");
    expect(line.warnings.some(w => /needs review/i.test(w))).toBe(false);
  });

  it("distinguishes tolerance: 185 GSM ±5", () => {
    const [line] = parseText("Cotton poplin, 185 GSM ±5, 58 inches, 5000m, RFD, ready stock");
    expect(line.draft.gsm).toBeUndefined(); // Nominal 185 is not confirmed single target
    expect(line.gsmTolerance).toBe(5);
    expect(line.gsmMin).toBe(180);
    expect(line.gsmMax).toBe(190);
    expect(line.gsmQualifier).toBe("185 ±5 g/m²");
  });

  it("distinguishes alternatives: '180 or 190 GSM' as choices, not a range", () => {
    const [line] = parseText("Cotton poplin, 180 or 190 GSM, 58 inches, 5000m, RFD, ready stock");
    expect(line.gsmAlternatives).toEqual([180, 190]);
    expect(line.gsmMin).toBe(180);
    expect(line.gsmMax).toBe(190);
    expect(line.gsmQualifier).toBe("Alternatives: 180 or 190 g/m²");
    expect(line.draft.gsm).toBeUndefined(); // neither is chosen automatically
  });

  it("distinguishes correction: 'Change 180 to 190 GSM' as a replacement, not a range", () => {
    const [line] = parseText("Cotton poplin, 180 GSM, 58 inches, 5000m, RFD, ready stock. Change 180 to 190 GSM.");
    expect(line.draft.gsm).toBe(190);
    expect(line.gsmMin).toBeUndefined();
    expect(line.gsmMax).toBeUndefined();
    expect(line.gsmQualifier).toBeUndefined();
  });

  it("distinguishes minimum 5000m (>=) versus above 5000m (>)", () => {
    // Minimum: >= 5000 m
    const [lineMin] = parseText("Cotton poplin, 185 GSM, 58 inches, minimum 5000m, RFD, ready stock");
    expect(lineMin.draft.quantity).toBe(5000);
    expect(lineMin.quantityBound).toEqual({ value: 5000, operator: ">=", label: "Minimum / at least" });

    const [lineAtLeast] = parseText("Cotton poplin, 185 GSM, 58 inches, at least 5k mts, RFD, ready stock");
    expect(lineAtLeast.draft.quantity).toBe(5000);
    expect(lineAtLeast.quantityBound).toEqual({ value: 5000, operator: ">=", label: "Minimum / at least" });

    // Strict lower bound: > 5000 m ("Above" and "at least" are not identical)
    const [lineAbove] = parseText("Cotton poplin, 185 GSM, 58 inches, above 5k mts, RFD, ready stock");
    expect(lineAbove.draft.quantity).toBeUndefined(); // strict bound does not assume 5000 is allowed
    expect(lineAbove.quantityBound).toEqual({ value: 5000, operator: ">", label: "Strict lower bound: above" });
    expect(lineAbove.quantityBound?.operator).not.toBe(lineMin.quantityBound?.operator);

    // Neither reports generic "Add quantity"
    expect(assessLineReadiness(lineMin).missing).not.toContain("quantity");
    expect(assessLineReadiness(lineAbove).missing).not.toContain("quantity");
  });

  it("distinguishes below 5000m (<) versus up to 5000m (<=)", () => {
    // Up to: <= 5000 m
    const [lineUpTo] = parseText("Cotton poplin, 185 GSM, 58 inches, up to 5000m, RFD, ready stock");
    expect(lineUpTo.draft.quantity).toBe(5000);
    expect(lineUpTo.quantityBound).toEqual({ value: 5000, operator: "<=", label: "Maximum / up to" });

    // Strict upper bound: < 5000 m
    const [lineBelow] = parseText("Cotton poplin, 185 GSM, 58 inches, below 5000m, RFD, ready stock");
    expect(lineBelow.draft.quantity).toBeUndefined();
    expect(lineBelow.quantityBound).toEqual({ value: 5000, operator: "<", label: "Strict upper bound: below" });
    expect(lineBelow.quantityBound?.operator).not.toBe(lineUpTo.quantityBound?.operator);
  });

  it("reproduces the user screenshot input: 2/2 twill, 65% Polyester 35% Viscose, 180-190 gsm, Quantity >= 5000 m", () => {
    const EXACT_INPUT = `2/2 twill · 65% Polyester 35% Viscose
Count: 20 x 20 · Construction: 100 x 56
180-190 gsm, 58 inches, RFD
Quantity >= 5000 m, ready stock`;

    const [line] = parseText(EXACT_INPUT);
    expect(line.blend).toBe("65% Polyester 35% Viscose");
    expect(line.draft.weaveType?.toLowerCase()).toBe("2/2 twill");
    expect(line.count).toBe("20 x 20");
    expect(line.construction).toBe("100 x 56");

    // GSM: Range 180-190
    expect(line.gsmMin).toBe(180);
    expect(line.gsmMax).toBe(190);
    expect(line.draft.gsm).toBeUndefined(); // not silently chosen

    // Quantity: 5000 populated with >= bound
    expect(line.draft.quantity).toBe(5000);
    expect(line.quantityBound).toEqual({ value: 5000, operator: ">=", label: "Minimum / at least" });

    // Readiness: does NOT say "Add GSM, quantity"
    const readiness = assessLineReadiness(line);
    expect(readiness.missing).not.toContain("quantity");
    expect(readiness.missing).not.toContain("GSM");
    expect(readiness.summary).toContain("Confirm target GSM (range 180–190 g/m² captured)");

    // Downstream draft payload preserves qualifiers
    const payload = lineDraft(line);
    expect(payload.additionalSpecs).toContain("Range: 180–190 g/m²");
    expect(payload.additionalSpecs).toContain("Quantity specification: Minimum / at least 5000 m");
  });

  it("handles multiple fabrics with independent ranges and bounds", () => {
    const MULTI_INPUT = `Fabric A:
100% cotton poplin, 120-130 gsm, 58 inches, RFD, at least 3000m, ready stock

Fabric B:
100% polyester twill, 220 gsm, 60 inches, dyed black, up to 10000m, ready stock`;

    const lines = parseText(MULTI_INPUT);
    expect(lines).toHaveLength(2);

    // Fabric A
    expect(lines[0].gsmMin).toBe(120);
    expect(lines[0].gsmMax).toBe(130);
    expect(lines[0].draft.gsm).toBeUndefined();
    expect(lines[0].draft.quantity).toBe(3000);
    expect(lines[0].quantityBound).toEqual({ value: 3000, operator: ">=", label: "Minimum / at least" });

    // Fabric B
    expect(lines[1].draft.gsm).toBe(220);
    expect(lines[1].gsmMin).toBeUndefined();
    expect(lines[1].draft.quantity).toBe(10000);
    expect(lines[1].quantityBound).toEqual({ value: 10000, operator: "<=", label: "Maximum / up to" });
  });
});
