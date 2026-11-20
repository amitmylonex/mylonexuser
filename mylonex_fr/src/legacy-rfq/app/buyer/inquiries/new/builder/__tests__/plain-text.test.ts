import { describe, expect, it } from "vitest";
import { isFieldDisabled } from "../../../../../../src/config/field-visibility";
import { parseText, parsePlainDescription } from "../parse-text";
import { lineDraft, missingRequired, lineDetailIssues } from "../draft";

const parse = (text: string) => {
  const lines = parseText(text);
  expect(lines).toHaveLength(1);
  expect(lines[0].original).toBe(text);
  for (const item of lines[0].sourceEvidence ?? []) expect(text.slice(item.start, item.end)).toBe(item.text);
  return lines[0];
};
describe("plain-text textile extraction through draft mapping and review", () => {
  it.each([
    ["40x40-142x72 100% cotton", "40x40", "142x72"],
    ["40s x 40s - 142 x 72, 100% cotton", "40s x 40s", "142 x 72"],
    ["40s × 40s – 142 × 72, 100% cotton", "40s × 40s", "142 × 72"],
    ["40X40,142X72 100% cotton", "40X40", "142X72"],
    ["40*40/142*72 100% cotton", "40*40", "142*72"],
    ["count: 40/40; construction: 142/72; 100% cotton", "40/40", "142/72"],
  ])("preserves and maps technical notation: %s", (text, count, construction) => {
    const line = parse(text);
    expect(line).toMatchObject({ count, construction, blend: "100% Cotton" });
    const draft = lineDraft(line);
    expect(draft.customFabricName).toBeUndefined();
    expect(draft.templateSpecs).toEqual(expect.arrayContaining([
      { specKey: "epi", valueNum: 142 }, { specKey: "ppi", valueNum: 72 },
    ]));
    if (count === "40/40") expect(draft.additionalSpecs).toContain("Count: 40/40");
    else expect(draft.templateSpecs).toEqual(expect.arrayContaining([
      { specKey: "warp_count_ply", valueText: /s/.test(count) ? "40s" : "40" },
      { specKey: "weft_count_ply", valueText: /s/.test(count) ? "40s" : "40" },
    ]));
  });
  it.each(["500 M", "500m", "500 (M)", "quantity: 500 (m)", "Qty: 500 M", "500 metres", "500 meters", "500 mtr", "500 mts", "500\u00a0M"])("uses whole metres: %s", source => {
    expect(lineDraft(parse(source)).quantity).toBe(500);
  });
  it("extracts a natural multiline sentence without confusing total and per-colour quantity", () => {
    const source = 'We need 50% cotton / 50% polyester poplin, count 40s x 40s, construction 142 x 72.\n220 GSM, 58 inches, 100 m per-colour, 500 m total: blue, black, green, yellow and orange; ready stock.';
    const line = parse(source);
    expect(line).toMatchObject({ blend: "50% Cotton 50% Polyester", count: "40s x 40s", construction: "142 x 72" });
    expect(line.draft).toMatchObject({ gsm: 220, width: "58 inches", quantity: 500, productionCycle: "ready_stock" });
    expect(line.draft.fabricState).toBe("dyed");
    expect(line.fabricStateInferred).toBe(true);
    expect(missingRequired(line)).toEqual([]);
    expect(line.warnings.join(" ")).toContain("Dyed inferred");
    expect(line.colours.map(item => [item.name.toLowerCase(), item.metres])).toEqual([
      ["blue", "100"], ["black", "100"], ["green", "100"], ["yellow", "100"], ["orange", "100"],
    ]);
    expect(lineDraft(line).additionalSpecs).toContain("Colour quantity: Orange: 100 m");
    expect(lineDraft(line).additionalSpecs).toContain("Dyed inferred");
    line.draft.fabricState = "dyed";
    line.draft.endUse = "Shirting";
    expect(missingRequired(line)).toEqual([]);
    if (!isFieldDisabled("dyeMethod")) {
      expect(lineDetailIssues(line).join(" ")).toContain("Dye method");
    } else {
      expect(lineDetailIssues(line).join(" ")).not.toContain("Dye method");
    }
  });
  it.each(["RFD", "Greige", "Dyed", "Printed", "ready for dyeing", "grey"])("preserves explicit state %s alongside per-colour wording", state => {
    const line = parse(`${state}, blue / black, 100m per color, 200 m total`);
    const expected = /rfd|ready for dyeing/i.test(state) ? "rfd" : /greige|grey/i.test(state) ? "greige" : state.toLowerCase();
    expect(line.draft.fabricState).toBe(expected);
    expect(line.sourceEvidence?.some(item => item.field === "fabricState" && item.kind === "inferred")).toBe(false);
    if (state === "ready for dyeing") expect(line.draft.productionCycle).toBeUndefined();
  });
  it("keeps genuine state/cycle conflicts blank and separates Ready from Dyed", () => {
    expect(parse("RFD or dyed, blue and black").draft.fabricState).toBeUndefined();
    expect(parse("ready or running production").draft.productionCycle).toBeUndefined();
    expect(parse("ready stock, blue and black").draft.fabricState).toBe("dyed");
    expect(parse("ready stock").draft.fabricState).toBeUndefined();
    expect(parse("running, RFD").draft.productionCycle).toBe("running_production");
  });
  it.each(["40x40", "142 × 72", "40/40", "40*40"])("does not guess the role of a single numeric pair: %s", source => {
    const line = parse(source);
    expect(line.count).toBe(""); expect(line.construction).toBe("");
    expect(line.warnings.join(" ")).toContain("ambiguous");
    expect(lineDraft(line).additionalSpecs).toContain(source);
  });
  it("assigns unrelated numbers only to their supported roles", () => {
    const line = parse("220 GSM, 58 inches, delivery 2026-12-15, 500 m");
    expect(line.draft).toMatchObject({ gsm: 220, width: "58 inches", requiredDeliveryDate: "2026-12-15", quantity: 500 });
    expect(line.count).toBe(""); expect(line.construction).toBe(""); expect(line.blend).toBe("");
  });
  it("handles the exact per sol example conservatively", () => {
    const line = parse('145 gsm ready 100m per sol (500 m total) - blue, black, green, yellow, orange 58"');
    expect(line.draft).toMatchObject({ gsm: 145, productionCycle: "ready_stock", quantity: 500, width: "58 inches" });
    expect(line.colours.map(item => item.name.toLowerCase())).toEqual(["blue", "black", "green", "yellow", "orange"]);
    expect(line.colours.every(item => item.metres === "")).toBe(true);
    expect(line.draft.fabricState).toBe("dyed");
    expect(line.fabricStateInferred).toBe(true);
    expect(line).toMatchObject({ blend: "", count: "", construction: "" });
    expect(line.warnings.join(" ")).toContain("per sol");
    expect(missingRequired(line)).toEqual(["blend", "weave"]);
    expect(lineDraft(line).additionalSpecs).toContain("per sol");
  });
  it.each(["per colour", "per color", "per-colour", "per-col", "colour-wise", "color-wise"])("preserves splits and flags a total mismatch: %s", phrase => {
    const line = parse(`100 m ${phrase}, 600 m total, blue-black-green-yellow-orange`);
    expect(line.draft.quantity).toBeUndefined();
    expect(line.colours).toHaveLength(5);
    expect(line.colours.every(item => item.metres === "100")).toBe(true);
    expect(line.warnings.join(" ")).toContain("Quantity mismatch");
  });
  it("keeps a calculated total as a proposal and unknown-unit quantities unresolved", () => {
    const split = parse("100 m per colour, blue and black");
    expect(split.draft.quantity).toBe(200);
    expect(split.draft.additionalSpecs).toContain("Calculated total 200 m");
    const unknown = parse("quantity 500");
    expect(unknown.draft.quantity).toBeUndefined();
    expect(unknown.sourceEvidence).toContainEqual(expect.objectContaining({ field: "quantity", kind: "unresolved", value: 500 }));
    expect(missingRequired(unknown)).toContain("quantity");
  });
  it.each([
    ["50/50 cotton-polyester", "50% Cotton 50% Polyester"],
    ["63/34/3 poly-cotton-elastane", "63% Polyester 34% Cotton 3% Elastane"],
    ["50% cotton / 50% polyester", "50% Cotton 50% Polyester"],
  ])("reads supported blend shorthand without assigning a fabric name: %s", (source, blend) => {
    const line = parse(source); expect(line.blend).toBe(blend); expect(line.draft.customFabricName).toBeUndefined();
  });
  it("leaves incomplete or invalid percentages to existing live blend validation", () => {
    for (const source of ["70% cotton / 20% polyester", "60% cotton / polyester", "100% cotton / polyester"]) {
      const line = parse(source); expect(missingRequired(line)).toContain("blend");
      expect(lineDetailIssues(line).length).toBeGreaterThan(0);
      expect(line.original).toBe(source);
    }
  });
  it("extracts labelled metadata but rejects unsupported prices and invalid dates", () => {
    const line = parse("fabric name: Summer shirt; yarn type: combed; finish: peach; end use: Shirting; piece dyed; dye type: reactive; target price: INR 130/m; delivery: 2026-12-20");
    expect(line.draft).toMatchObject({ customFabricName: "Summer shirt", yarnType: "combed", endUse: "Shirting", dyeMethod: "piece_dyed", dyeColorType: "reactive", targetPriceMax: 130, requiredDeliveryDate: "2026-12-20" });
    expect(line.finish).toBe("peach");
    const invalid = parse("target price: USD 4/m; delivery: 2026-02-30");
    expect(invalid.draft.targetPriceMax).toBeUndefined(); expect(invalid.draft.requiredDeliveryDate).toBeUndefined();
    expect(invalid.warnings.join(" ")).toContain("currency");
  });
  it("keeps conflicting explicit technical labels blank instead of silently overriding", () => {
    const line = parse("count 40x40, count 30x30; construction 142x72, EPI 100 PPI 60");
    expect(line.count).toBe(""); expect(line.construction).toBe("");
    expect(line.warnings.join(" ")).toContain("Conflicting count");
  });
  it("retains inferred GSM as a proposal that cannot satisfy readiness", () => {
    const line = parse('100% cotton poplin, 58", 130, 500 m, RFD, ready');
    expect(line.draft.gsm).toBeUndefined(); expect(missingRequired(line)).toContain("GSM");
    expect(line.warnings.join(" ")).toContain("Proposed gsm: 130");
    const reparsed = parsePlainDescription(line.original);
    expect(reparsed.draft.gsm).toBeUndefined();
  });
  it("keeps inferred percentages and source-established units as confirmation proposals", () => {
    const blend = parse("97 cotton 3 spandex poplin");
    expect(blend.blend).toBe(""); expect(missingRequired(blend)).toContain("blend");
    expect(blend.warnings.join(" ")).toContain("Proposed blend: 97% Cotton 3% Spandex");
    const quantity = parse("130 gsm cotton poplin. All order quantities are in metres. Need 500.");
    expect(quantity.draft.quantity).toBeUndefined(); expect(missingRequired(quantity)).toContain("quantity");
    expect(quantity.warnings.join(" ")).toContain("Proposed quantity: 500 m");
  });
  it("does not reuse dimensions, stock, sample amounts, prices or fractional metres as totals", () => {
    for (const source of ["width: 58 m", "58m wide", "MOQ 500m", "available stock 500m", "sample 5m", "price INR 500m", "1.5m", "500 kg", "500 mm", "500-600 m"]) {
      expect(parse(source).draft.quantity, source).toBeUndefined();
    }
    expect(parse("Need 500 m; MOQ 1000m; sample 5m").draft.quantity).toBe(500);
  });
  it("preserves explicit total and individual shade amounts on disagreement", () => {
    const line = parse("500m total, blue 200m, black 100m");
    expect(line.draft.quantity).toBeUndefined();
    expect(line.colours.map(item => item.metres)).toEqual(["200", "100"]);
    expect(line.warnings.join(" ")).toContain("Quantity mismatch");
    expect(lineDraft(line).additionalSpecs).toContain("Colour quantity: Blue: 200 m");
    expect(parse("500m total or 600m total").draft.quantity).toBeUndefined();
  });
  it("uses directional labels without losing units or original evidence", () => {
    const line = parse("Blend: 100% cotton; warp: 2/30, weft: 150D; EPI 142 PPI 72");
    expect(line.count).toBe("2/30 × 150D"); expect(line.construction).toBe("142 × 72");
    expect(lineDraft(line).templateSpecs).toEqual(expect.arrayContaining([{ specKey: "warp_count_ply", valueText: "2/30" }]));
  });
  it("maps current edits without submitting stale extracted technical specs", () => {
    const line = parse("40*40/142*72 100% cotton");
    line.count = "30x20"; line.construction = "100/60";
    expect(lineDraft(line).templateSpecs).toEqual([
      { specKey: "warp_count_ply", valueText: "30" }, { specKey: "weft_count_ply", valueText: "20" },
      { specKey: "epi", valueNum: 100 }, { specKey: "ppi", valueNum: 60 },
    ]);
    line.count = ""; line.construction = "";
    expect(lineDraft(line).templateSpecs).toEqual([]);
    expect(lineDraft(parse("count 2/30")).additionalSpecs).toContain("Count: 2/30");
  });
  it("does not select negated availability or derive shades from commercial wording", () => {
    const line = parse("not ready, not dyed; green certification, white paper");
    expect(line.draft.productionCycle).toBeUndefined(); expect(line.draft.fabricState).toBeUndefined();
    expect(line.colours).toEqual([]);
    expect(parse("not dyed, 100m per colour, blue and black").sourceEvidence?.some(item => item.field === "fabricState" && item.kind === "inferred")).toBe(false);
    expect(parse("ready  for dyeing").draft).toMatchObject({ fabricState: "rfd" });
    expect(parse("yarn count: 40s").count).toBe("40s");
  });
});
