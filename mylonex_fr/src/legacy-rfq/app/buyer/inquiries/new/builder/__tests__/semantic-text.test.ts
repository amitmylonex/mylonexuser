import { describe, expect, it } from "vitest";
import { parseText, parsePlainDescription, parseDescription } from "../parse-text";
import { lineDraft, missingRequired } from "../draft";
import { applySourceChanges, rereadSource, sourceChanges } from "../source-review";
import { evidenceSchema } from "../../../../../../src/domains/rfq/text/types";

const exact = '100% cotton 2/1 twill 30x30 110x60 58" ready 1000m dyed';
function parse(source: string) {
  const [line, ...others] = parseText(source); expect(others).toEqual([]);
  expect(line.original).toBe(source);
  for (const item of line.sourceEvidence ?? []) {
    expect(source.slice(item.start, item.end)).toBe(item.text);
    expect(evidenceSchema.safeParse(item).success, `${item.field}: ${item.text}`).toBe(true);
  }
  // Each character belongs to at most one primary candidate, including conflicts.
  const claimed = new Set<number>();
  for (const item of line.sourceEvidence ?? []) for (let index = item.start; index < item.end; index++) {
    expect(claimed.has(index), `${item.field}: ${item.text}`).toBe(false); claimed.add(index);
  }
  return line;
}
describe("semantic plain-text extraction matrix", () => {
  it("owns the weave ratio before classifying standard ordered textile pairs", () => {
    const line = parse(exact);
    expect(line).toMatchObject({ blend: "100% Cotton", count: "30x30", construction: "110x60" });
    expect(line.draft).toMatchObject({ weaveType: "2/1 twill", width: "58 inches", productionCycle: "ready_stock", quantity: 1000, fabricState: "dyed" });
    expect(line.draft.gsm).toBeUndefined(); expect(missingRequired(line)).toEqual(["GSM"]);
    expect(line.warnings.join(" ")).not.toMatch(/ambiguous|unassigned|inferred|weave interpretation/i);
    expect(line.sourceEvidence).toContainEqual(expect.objectContaining({ field: "weave", text: "2/1 twill", kind: "explicit" }));
    expect(lineDraft(line).templateSpecs).toEqual(expect.arrayContaining([
      { specKey: "warp_count_ply", valueText: "30" }, { specKey: "weft_count_ply", valueText: "30" },
      { specKey: "epi", valueNum: 110 }, { specKey: "ppi", valueNum: 60 },
    ]));
  });
  it.each([
    ['100% cotton 3/1 twill 30x30 110x60 58" ready 1000m dyed', "3/1 twill", "30x30", "110x60"],
    ['100% cotton 2×1 twill 30×30 110×60 58 inches ready 1000 metres dyed', "2×1 twill", "30×30", "110×60"],
    ['100% COTTON 2/1 TWILL 30 X 30 — 110 X 60 58 IN ready 1000 MTR dyed', "2/1 TWILL", "30 X 30", "110 X 60"],
    ['100% cotton 7/3 twill 30x30-110x60 58" 1000m dyed', "7/3 twill", "30x30", "110x60"],
    ['dyed 1000m 58" 100% cotton 30x30/110x60 2/1 twill', "2/1 twill", "30x30", "110x60"],
    ['construction:110x60; dyed; 58"; weave: 2/1 twill; count:30x30; 100% cotton; 1000m', "2/1 twill", "30x30", "110x60"],
    ['100% cotton, weave: 2/1 twill.\nCount 30x30. Construction 110x60.\n58" ready 1000m dyed', "2/1 twill", "30x30", "110x60"],
  ])("labelled, standard or reordered: %s", (source, weave, count, construction) => {
    const line = parse(source);
    expect(line.draft.weaveType).toBe(weave); expect(line.count).toBe(count); expect(line.construction).toBe(construction);
    expect(line.draft.gsm).toBeUndefined(); expect(line.warnings.join(" ")).not.toMatch(/ambiguous|unassigned/i);
  });
  it.each(["2/1 twill", "3x1 twill", "5/2 twill", "satin", "plain poplin"])("a known weave phrase is not an ambiguous count: %s", source => {
    const line = parse(source);
    expect(line.draft.weaveType).toBe(source); expect(line.count).toBe(""); expect(line.construction).toBe("");
    expect(line.warnings.join(" ")).not.toMatch(/numeric pair|ambiguous|unassigned/);
  });
  it.each(["satin finish", "printed houndstooth pattern", "jacquard knit", "non-woven satin", "finish: satin", "yarn type: twill", "colour: plain blue"])("does not steal an alias from a different role: %s", source => {
    const line = parse(source);
    expect(line.draft.weaveType).toBeUndefined(); expect(line.count).toBe(""); expect(line.construction).toBe("");
  });
  it.each(["30x30", "110x60", "2/1", "30x30 or 110x60", "30x30 110x60", "30x30 110x60 80x40"])("retains genuinely ambiguous notation for review: %s", source => {
    const line = parse(source);
    expect(line.count).toBe(""); expect(line.construction).toBe("");
    expect(line.warnings.join(" ")).toMatch(/ambiguous|Proposed count/);
    expect(lineDraft(line).additionalSpecs).toContain(source);
  });
  it("shows a candidate mapping when ordering lacks sufficient fabric context", () => {
    const line = parse("30x30 110x60");
    expect(line.warnings.join(" ")).toContain("Proposed count “30x30” and construction “110x60”");
    expect(line.sourceEvidence?.every(item => item.kind === "unresolved")).toBe(true);
  });
  it("respects explicit labels even when a number pair resembles a weave repeat", () => {
    const line = parse("count: 2/1; construction: 30x30; weave: twill");
    expect(line.count).toBe("2/1"); expect(line.construction).toBe("30x30"); expect(line.draft.weaveType).toBe("twill");
    expect(line.warnings.join(" ")).not.toMatch(/ambiguous/);
  });
  it("resolves real conflicts without generating a second bare-number ambiguity", () => {
    const line = parse('count:30x30; count:40x40; EPI110 PPI60; weave:twill; 130 GSM or 150 GSM; 58"; 500m or 1000m; RFD or dyed');
    expect(line.count).toBe(""); expect(line.construction).toBe("110 × 60");
    expect(line.draft.gsm).toBeUndefined(); expect(line.draft.quantity).toBeUndefined(); expect(line.draft.fabricState).toBeUndefined();
    expect(line.warnings.join(" ")).toMatch(/Conflicting count/); expect(line.warnings.join(" ")).not.toMatch(/numeric pair|unassigned/);
  });
  it("does not use unrelated dimensions, dates or prices as technical pairs or GSM", () => {
    const line = parse('100% cotton 2/1 twill, dimensions:30x30, delivery:2026-12-20, target price:INR 130/m, 58", 1000m');
    expect(line.count).toBe(""); expect(line.construction).toBe(""); expect(line.draft.gsm).toBeUndefined();
    expect(line.draft).toMatchObject({ targetPriceMax: 130, requiredDeliveryDate: "2026-12-20", width: "58 inches", quantity: 1000 });
  });
  it.each(["ends per inch:110, picks per inch:60", "110 ends per inch, 60 picks per inch", "EPI110 PPI60"])("classifies directional construction phrases: %s", source => {
    const line = parse(source);
    expect(line.construction).toBe("110 × 60"); expect(line.count).toBe("");
    expect(line.warnings.join(" ")).not.toMatch(/numeric pair|ambiguous/);
  });
  it.each(["-130 gsm", "width: -58 inches", "-100% cotton"])("does not turn a negative measurement into a valid field: %s", source => {
    const line = parse(source);
    expect(line.draft.gsm).toBeUndefined(); expect(line.draft.width).toBeUndefined(); expect(line.blend).toBe("");
    expect(line.warnings.join(" ")).toContain("positive");
  });
  it("preserves offsets through emoji, Unicode normalization and changes to unit lengths", () => {
    const line = parse('🧵 100% COTTON ２／１ TWILL 30×30—110×60 58 INCHES 1000 METRES DYED');
    expect(line.draft).toMatchObject({ weaveType: "２／１ TWILL", width: "58 inches", quantity: 1000, fabricState: "dyed" });
    expect(line.sourceEvidence).toContainEqual(expect.objectContaining({ text: "1000 METRES", field: "quantity" }));
    expect(line.count).toBe("30×30"); expect(line.construction).toBe("110×60");
  });
  it("does not turn a negated weave into a requirement", () => {
    const line = parse("not 2/1 twill, use satin weave");
    expect(line.draft.weaveType).toBe("satin");
    expect(line.sourceEvidence?.some(item => item.field === "weave" && item.text === "2/1 twill")).toBe(false);
  });
  it.each(["EPI110", "PPI60", "warp count:30s", "weft count:150D"])("keeps an incomplete directional specification reviewable: %s", source => {
    const line = parse(source);
    expect(line.count).toBe(""); expect(line.construction).toBe("");
    expect(line.warnings.join(" ")).toContain("Only one directional");
    expect(line.warnings.join(" ")).not.toContain("numeric pair");
  });
  it.each(["delivery:2026/12/20", "date:20/12/2026", "repeat:2/1", "price:30/40"])("honours a non-count role before interpreting pairs: %s", source => {
    const line = parse(source);
    expect(line.count).toBe(""); expect(line.construction).toBe("");
    expect(line.warnings.join(" ")).not.toContain("numeric pair");
  });
  it("retains supporting phrases when processing wording explicitly conveys two roles", () => {
    const line = parsePlainDescription("100% cotton twill; piece dyed; dye type: reactive; 130 GSM; 58 inches; 500m");
    expect(line.draft).toMatchObject({ fabricState: "dyed", dyeMethod: "piece_dyed", dyeColorType: "reactive" });
    expect(line.sourceEvidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "fabricState", text: "dyed" }),
      expect.objectContaining({ field: "dyeMethod", text: "piece dyed" }),
      expect.objectContaining({ field: "dyeColorType", text: "dye type: reactive" }),
    ]));
  });
  it("never mutates an existing draft or applies new parsing over manual edits", () => {
    const current = parsePlainDescription('100% cotton, 145 gsm, 58 inches, 500m, rfd');
    current.draft.gsm = 235; current.count = "40s x 40s";
    const before = structuredClone(current), legacy = parseDescription(exact), legacyBefore = structuredClone(legacy);
    const proposal = rereadSource(exact);
    expect(current).toEqual(before); expect(legacy).toEqual(legacyBefore);
    expect(sourceChanges(current, proposal)).toContainEqual(expect.objectContaining({ key: "count", current: "40s x 40s", proposed: "30x30" }));
    const kept = applySourceChanges(current, proposal, []);
    expect(kept.draft.gsm).toBe(235); expect(kept.count).toBe("40s x 40s"); expect(current).toEqual(before);
    const accepted = applySourceChanges(current, proposal, ["count", "construction", "weaveType"]);
    expect(accepted).toMatchObject({ count: "30x30", construction: "110x60" }); expect(accepted.draft.gsm).toBe(235);
  });
});
