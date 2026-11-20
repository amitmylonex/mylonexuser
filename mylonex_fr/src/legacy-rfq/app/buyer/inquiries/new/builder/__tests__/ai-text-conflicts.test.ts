import { describe, expect, it } from "vitest";
import { validateAiExtraction } from "../../../../../../src/domains/rfq/text/ai-validation";
import { extraction, field, COMBINED, COMBINED_AI } from "../../../../../../src/domains/rfq/text/__tests__/ai-fixtures";
import { mapAiFabric } from "../map-ai-text";

const draft = (source: string, fields: Parameters<typeof extraction>[1]) => mapAiFabric(validateAiExtraction(source, extraction(source, fields)).fabrics[0]);
describe("AI proposals checked against textile roles and existing field rules", () => {
  it("handles reordered labels, abbreviations, unit conversion and incomplete details", () => {
    const source = 'QTY: 500 (M); dyed / RS; width: 147.32 cm; construction: 96 × 48; count: 20 CCW × 20 CCW; 3/1 Drill';
    const line = draft(source, [field("quantity", "500 m", "QTY: 500 (M)"), field("width", "58 inches", "width: 147.32 cm"), field("construction", "96 × 48", "construction: 96 × 48"), field("count", "20 CCW × 20 CCW", "count: 20 CCW × 20 CCW"), field("weaveType", "3/1 Drill", "3/1 Drill")]);
    expect(line).toMatchObject({ count: "20 CCW × 20 CCW", construction: "96 × 48", draft: { quantity: 500, width: "58 inches", fabricState: "dyed", productionCycle: "ready_stock" } });
    expect(line.blend).toBe(""); expect(line.draft.gsm).toBeUndefined();
  });
  it.each([
    ["30x30", "count", "30x30"],
    ["2/2 Matty", "count", "2/2"],
    ["3/1 Drill", "construction", "3/1"],
    ["500 M", "count", "500 M"],
    ["145 GSM, 160 GSM", "gsm", "145"],
    ['58 inches, 60 inches', "width", "58 inches"],
    ["500 M total; 700 M total", "quantity", "500 m"],
    ["65% Polyester 35% Viscose", "blend", "35% Polyester 65% Viscose"],
    ["count: 20x20; count: 30x30", "count", "30x30"],
  ] as const)("leaves unsupported or conflicting %s → %s for review", (source, name, value) => {
    const line = draft(source, [field(name, value, source)]);
    expect(name in line ? line[name as "count" | "blend"] : line.draft[name as "width"]).toBeFalsy();
    expect(line.warnings.length).toBeGreaterThan(1);
  });
  it("preserves a stated incomplete blend and validates the missing percentage total", () => {
    const line = draft("65% cotton 20% polyester", [field("blend", "65% Cotton 20% Polyester", "65% cotton 20% polyester")]);
    expect(line.blend).toBe("65% Cotton 20% Polyester"); expect(line.warnings.join(" ")).toMatch(/100/);
  });
  it("independently detects explicit state and availability conflicts even if the model omits one", () => {
    const line = draft("dyed, RFD; ready stock, made to order", [field("fabricState", "dyed", "dyed"), field("productionCycle", "ready_stock", "ready stock")]);
    expect(line.draft.fabricState).toBeUndefined(); expect(line.draft.productionCycle).toBeUndefined();
    expect(line.warnings.join(" ")).toMatch(/Conflicting/);
  });
  it("does not interpret currency, negation or greige-width wording as availability or state", () => {
    const line = draft('target price Rs 90/m; not ready; 63” Griege width', []);
    expect(line.draft.productionCycle).toBeUndefined(); expect(line.draft.fabricState).toBeUndefined(); expect(line.draft.width).toBeUndefined();
  });
  it("rejects fabricated evidence, merged explicit entries and cross-entry evidence", () => {
    expect(() => validateAiExtraction("100% cotton", extraction("100% cotton", [field("gsm", "130", "130 gsm")]))).toThrow(/fabricated/);
    expect(() => validateAiExtraction(COMBINED, extraction(COMBINED, []))).toThrow(/boundaries disagree/);
    const raw = structuredClone(COMBINED_AI); raw.fabrics[1].fields.push(field("width", "65 inches", "65”"));
    expect(() => validateAiExtraction(COMBINED, raw)).toThrow(/another fabric/);
  });
  it("cannot select a blend from a sourcing option even if the model calls it explicit", () => {
    const raw = structuredClone(COMBINED_AI); raw.fabrics[0].fields.push(field("blend", "100% Cotton", "OPTION 1 100% GOTS NOP-certified organic cotton"));
    const line = mapAiFabric(validateAiExtraction(COMBINED, raw).fabrics[0]);
    expect(line.blend).toBe(""); expect(line.warnings.join(" ")).toMatch(/unselected sourcing alternative/);
  });
  it("keeps RFD separate from ready stock and accepts numeric width only with supported units", () => {
    const line = draft('ready for dyeing, 58 inches', [field("width", "58", "58 inches")]);
    expect(line.draft.fabricState).toBe("rfd"); expect(line.draft.productionCycle).toBeUndefined(); expect(line.draft.width).toBe("58 inches");
    expect(draft("width 58", [field("width", "58", "width 58")]).draft.width).toBeUndefined();
  });
  it("requires valid whole metres in named colour splits and does not rely on model confidence", () => {
    const line = draft('blue 200.5 M; 58 inches', [field("colour", "blue", "blue 200.5 M"), { ...field("width", "58 inches", "58 inches"), interpretation: "inferred" }]);
    expect(line.colours[0].metres).toBe(""); expect(line.warnings.join(" ")).toMatch(/whole metres/);
    expect(line.draft.width).toBe("58 inches");
  });
  it("does not accept the wrong end use or confuse quantity numbers with price", () => {
    const source = "suitable for shirts; 500 M; target INR 90/m";
    const line = draft(source, [field("endUse", "Uniform", "suitable for shirts"), field("targetPriceMax", "500", source)]);
    expect(line.draft.endUse).toBeUndefined(); expect(line.draft.targetPriceMax).toBeUndefined();
    expect(draft(source, [field("targetPriceMax", "90", "target INR 90/m")]).draft.targetPriceMax).toBe(90);
  });
  it("does not replace invalid or conflicting explicit shade amounts with a common per-colour amount", () => {
    const source = "100 M per colour; blue 200.5 M, black 200 M; total 300 M";
    const line = draft(source, [field("perColourQuantity", "100 m", "100 M per colour"), field("colour", "blue", "blue 200.5 M"), field("colour", "black", "black 200 M"), field("quantity", "300 m", "total 300 M")]);
    expect(line.colours.map(colour => colour.metres)).toEqual(["", "200"]);
    expect(line.warnings.join(" ")).toMatch(/Conflicting per-colour amount for black/);
  });
});
