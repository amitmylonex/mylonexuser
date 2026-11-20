import { describe, expect, it } from "vitest";
import { BLEND_PERCENTAGE_ERROR, getBlendPercentages } from "../blend-percentages";
import { lineDetailIssues, lineDraft, missingRequired, newLine } from "../draft";
import { blendState, initializeBlend, updateBlend } from "../blend-state";
import { fibreKey, parseBlendRows, serializeBlend, type FibreRow } from "../../../../../../src/domains/rfq/blend/rows";
import { validateBlendRows } from "../../../../../../src/domains/rfq/blend/validation";

const rows = (...values: [string, string][]): FibreRow[] => values.map(([fibre, percentage], index) => ({ id: `test-${index}`, fibre, percentage }));
function readyLine(blend = "100% Cotton") {
  return initializeBlend({ ...newLine(), blend, draft: {
    gsm: 120, width: "58 inches", weaveType: "Plain", fabricState: "rfd", quantity: 1000,
    productionCycle: "ready_stock", endUse: "Shirting",
  } });
}

describe("repeatable fibre row conversion and exact totals", () => {
  it.each([
    ["65/35 poly cotton", [["Polyester", "65"], ["Cotton", "35"]]],
    ["63/34/3 poly-cotton-lycra", [["Polyester", "63"], ["Cotton", "34"], ["Lycra", "3"]]],
    ["97% Cotton 3% Elastane", [["Cotton", "97"], ["Elastane", "3"]]],
    ["97% Cotton and 3% Elastane", [["Cotton", "97"], ["Elastane", "3"]]],
    ["Cotton 97% / Elastane 3%", [["Cotton", "97"], ["Elastane", "3"]]],
    ["Cotton polyester", [["Cotton", ""], ["Polyester", ""]]],
    ["Cotton", [["Cotton", ""]]],
    ["Lycra / Elastane", [["Lycra / Elastane", ""]]],
  ] as [string, [string, string][]][])("parses saved composition without inventing values: %s", (text, expected) => {
    const parsed = parseBlendRows(text);
    expect(parsed.legacyText).toBeUndefined();
    expect(parsed.rows.map(row => [row.fibre, row.percentage])).toEqual(expected);
  });

  it.each([
    ["33.3", "33.3", "33.4"], ["0.1", "0.2", "99.7"], [".5", "99.5"], ["99.999", "0.001"],
  ])("adds decimals exactly: %s + %s", (...percentages) => {
    const result = validateBlendRows(rows(...percentages.map((value, index) => [`Custom fibre ${index}`, value] as [string, string])));
    expect(result).toMatchObject({ state: "complete", total: "100", remaining: "0", summary: "100% / 100% · Complete", error: null });
  });

  it("retains below-100 remainder and does not fill missing amounts", () => {
    const input = rows(["Cotton", "20"], ["Polyester", "25.5"]);
    expect(validateBlendRows(input)).toMatchObject({ state: "incomplete", total: "45.5", remaining: "54.5" });
    expect(input.map(row => row.percentage)).toEqual(["20", "25.5"]);
    expect(validateBlendRows(rows(["Cotton", "0"]))).toMatchObject({ state: "incomplete", total: "0", remaining: "100" });
  });

  it.each([
    rows(["", "100"]), rows(["Cotton", "100"], ["", ""]), rows(["Cotton", ""]), [],
  ].map(input => ({ input })))("never marks missing fibre/percentage rows complete", ({ input }) => {
    expect(validateBlendRows(input).state).not.toBe("complete");
  });

  it.each(["-1", "+1", "1e2", "NaN", "Infinity", "50,5", "1.2.3", "1.", "1".repeat(31)])("rejects invalid percentage text: %s", percentage => {
    const result = validateBlendRows(rows(["Cotton", percentage]));
    expect(result.state).toBe("error"); expect(result.error).toContain("valid");
  });

  it.each(["100.00000000000001", "101", "200"])("blocks percentage above 100: %s", value => {
    expect(validateBlendRows(rows(["Cotton", value]))).toMatchObject({ state: "error", error: BLEND_PERCENTAGE_ERROR });
  });

  it.each(["Lycra", "spandex", "Elastane", "Lycra / Elastane", "SPANDEX / lycra"])("normalizes aliases and detects duplicate components: %s", name => {
    expect(fibreKey(name)).toBe(fibreKey("Spandex"));
    const input = rows(["Cotton", "97"], [name, "2"], ["elastane", "1"]);
    expect(validateBlendRows(input)).toMatchObject({ state: "error", total: "100" });
    expect(validateBlendRows(input).error).toContain("Duplicate");
    expect(input.map(row => row.percentage)).toEqual(["97", "2", "1"]);
  });

  it("canonicalizes matching aliases while preserving buyer and custom wording", () => {
    const input = rows(["Cotton", "97"], ["Lycra / Elastane", "3"]);
    expect(serializeBlend(input)).toBe("97% Cotton 3% Lycra / Elastane");
    expect(serializeBlend(input, true)).toBe("97% Cotton 3% Spandex");
    const line = updateBlend(readyLine(), input);
    const payload = lineDraft(line);
    expect(payload.blendComposition).toBe("97% Cotton 3% Spandex");
    expect(payload.additionalSpecs).toContain("Buyer composition wording: 97% Cotton 3% Lycra / Elastane");
    const custom = rows(["My supplier's SeaCell fibre", "100"]);
    expect(serializeBlend(custom, true)).toBe("100% My supplier's SeaCell fibre");
    expect(validateBlendRows(custom).state).toBe("complete");
  });

  it.each(["50/50", "63/34/3", "50% cotton, 50 polyester", "50% cotton or 50% polyester", "150 gsm cotton", "2/1 twill"])("preserves unclear legacy text for review: %s", text => {
    const parsed = parseBlendRows(text);
    expect(parsed.legacyText).toBe(text);
    expect(validateBlendRows(parsed.rows, parsed.legacyText).state).not.toBe("complete");
    const line = initializeBlend({ ...newLine(), blend: text });
    expect(line.blendLegacyText).toBe(text);
    expect(lineDraft(line).additionalSpecs).toContain(text);
  });

  it("retains unclear legacy source in notes when corrected rows deliberately replace it", () => {
    const original = "50% cotton, 50 polyester";
    const initial = initializeBlend({ ...newLine(), blend: original });
    const corrected = rows(["Cotton", "50"], ["Polyester", "50"]);
    const pendingReview = updateBlend(initial, corrected, initial.blendLegacyText);
    expect(blendState(pendingReview).state).toBe("incomplete");
    const reviewed = updateBlend(pendingReview, corrected);
    expect(reviewed.blendLegacyText).toBeUndefined();
    expect(blendState(reviewed).state).toBe("complete");
    expect(lineDraft(reviewed).additionalSpecs).toContain(`Original blend for review: ${original}`);
  });

  it("keeps new, edited, added and removed rows synchronized with the string contract", () => {
    const initial = newLine();
    expect(initial.blendRows).toEqual([{ id: "fibre-0", fibre: "", percentage: "" }]);
    expect(serializeBlend(initial.blendRows!)).toBe(initial.blend);
    const first = updateBlend(initial, rows(["Cotton", "97"]));
    const second = updateBlend(first, [...first.blendRows!, { id: "added", fibre: "Elastane", percentage: "3" }]);
    expect(second.blendRows?.[0]).toEqual(first.blendRows?.[0]);
    expect(second.blend).toBe("97% Cotton 3% Elastane");
    const removed = updateBlend(second, second.blendRows!.slice(0, 1));
    expect(removed.blend).toBe("97% Cotton"); expect(blendState(removed).state).toBe("incomplete");
    expect(blendState(initializeBlend({ ...newLine(), blend: "65% Polyester 35% Cotton" })).state).toBe("complete");
    const reloaded = JSON.parse(JSON.stringify(second));
    expect(blendState(reloaded)).toMatchObject({ state: "complete", total: "100" });
  });

  it("blocks incomplete, duplicate and invalid blends from readiness while preserving input", () => {
    for (const blend of ["15/20 cotton-poly", "cotton-poly", "80/30 cotton-poly", "100% Cotton 0% cotton"]) {
      const line = readyLine(blend);
      expect(missingRequired(line)).toContain("blend");
      expect(lineDetailIssues(line).length).toBeGreaterThan(0);
    }
    const complete = readyLine("97% Cotton 3% Elastane");
    expect(missingRequired(complete)).not.toContain("blend");
    expect(lineDetailIssues(complete)).toEqual([]);
    expect(getBlendPercentages("Cotton polyester").state).not.toBe("complete");
    expect(getBlendPercentages("100% Cotton").state).toBe("complete");
  });
});
