import { describe, expect, it } from "vitest";
import { readRequirements } from "../read-requirements";
import { blendState } from "../blend-state";
import { fibreKey } from "../../../../../../src/domains/rfq/blend/rows";
import { orderedCompositions, aliasCases, completeCompositionInquiry, EXACT_ORDERED_INQUIRY } from "../../../../../../src/domains/rfq/text/__tests__/composition-coverage-fixtures";

const rows = (line: Awaited<ReturnType<typeof readRequirements>>[number]) => blendState(line).rows.map(row => [fibreKey(row.fibre), row.percentage]);
describe("shared composition recognition through real builder rows", () => {
  it.each(orderedCompositions)("associates ordered lists: %s", async phrase => {
    const [line] = await readRequirements(completeCompositionInquiry(phrase), false);
    expect(rows(line)).toEqual([["Polyester", "63"], ["Cotton", "34"], ["Lyocell", "3"]]);
    expect(blendState(line).state).toBe("complete");
    expect(line.draft).toMatchObject({ weaveType: "2/1 Twill", gsm: 180, width: "58 inches", quantity: 3000, productionCycle: "made_to_order" });
    expect(line.count).toBe("30s x 30s"); expect(line.construction).toBe("100 x 72");
    for (const item of line.sourceEvidence || []) expect(line.original.slice(item.start, item.end)).toBe(item.text);
  });
  it.each(aliasCases)("recognizes contextual alias %s as %s", async (alias, name) => {
    const [line] = await readRequirements(completeCompositionInquiry(`100% ${alias}`), false);
    expect(rows(line)).toEqual([[name, "100"]]);
  });
  it.each([
    ["97% cot 3% spx", [["Cotton", "97"], ["Spandex", "3"]]],
    ["cot 97%, spx 3%", [["Cotton", "97"], ["Spandex", "3"]]],
    ["97 % cotton + 3 % elastane", [["Cotton", "97"], ["Spandex", "3"]]],
    ["Cotton (97%) / Spandex (3%)", [["Cotton", "97"], ["Spandex", "3"]]],
    ["Composition: 65 poly / 32 visc / 3 spx", [["Polyester", "65"], ["Viscose", "32"], ["Spandex", "3"]]],
    ["80% lyocel/20% linen", [["Lyocell", "80"], ["Linen", "20"]]],
    ["cotton97% spx3%", [["Cotton", "97"], ["Spandex", "3"]]],
    ["cot/poly/spx 60/37/3", [["Cotton", "60"], ["Polyester", "37"], ["Spandex", "3"]]],
    ["62.5/34.5/3 poly/cotton/spx", [["Polyester", "62.5"], ["Cotton", "34.5"], ["Spandex", "3"]]],
    ["cotton/linen/hemp/spx 50/25/22/3", [["Cotton", "50"], ["Linen", "25"], ["Hemp", "22"], ["Spandex", "3"]]],
    ["P/V (65/35)", [["Polyester", "65"], ["Viscose", "35"]]],
    ["P/C 65/35", [["Polyester", "65"], ["Cotton", "35"]]],
    ["C/P 60/40", [["Cotton", "60"], ["Polyester", "40"]]],
  ] as [string, string[][]][])("preserves explicit source order and amounts in %s", async (phrase, expected) => {
    const [line] = await readRequirements(completeCompositionInquiry(phrase), false);
    expect(rows(line)).toEqual(expected);
  });
  it("parses the exact complete ordered ratio inquiry", async () => {
    const lines = await readRequirements(EXACT_ORDERED_INQUIRY, false);
    expect(lines).toHaveLength(1);
    expect(rows(lines[0])).toEqual([["Polyester", "63"], ["Cotton", "34"], ["Lyocell", "3"]]);
    expect(lines[0].draft).toMatchObject({ gsm: 180, width: "58 inches", quantity: 3000, productionCycle: "made_to_order" });
    expect(lines[0].draft.weaveType?.toLowerCase()).toBe("2/1 twill");
    expect(lines[0].count).toBe("30s x 30s"); expect(lines[0].construction).toBe("100 x 72");
  });
  it.each(["63/34/3 poly/cotton", "63/34 poly/cotton/lyo", "63/34/3 poly/cotton/unknown-fibre", "poly/cotton 65/35 or 60/40",
    "2:1 poly/cotton", "Cotton or viscose", "poly/cotton/lyo", "Cotton poly spandex; percentages undecided", "63/34/3 alone"])("does not fabricate a complete blend: %s", async phrase => {
    const [line] = await readRequirements(completeCompositionInquiry(phrase), false);
    expect(blendState(line).state).not.toBe("complete");
    expect(blendState(line).rows.every(row => !row.percentage)).toBe(true);
  });
  it.each(["cotton/poly 65/34", "cotton/poly 65/38"])("preserves stated non-100 totals: %s", async phrase => {
    const [line] = await readRequirements(completeCompositionInquiry(phrase), false);
    expect(blendState(line).total).toBe(phrase.endsWith("34") ? "99" : "103");
    expect(blendState(line).state).toBe(phrase.endsWith("34") ? "incomplete" : "error");
  });
  it.each(["We visited a cottonwood mill", "Please review the cost and visibility", "My pet needs a coat", "The PA will call", "63/34/3; Width 58 inches; poly/cotton/lyo"])("rejects unrelated short words and intervening fields: %s", async phrase => {
    const [line] = await readRequirements(completeCompositionInquiry(phrase), false);
    expect(blendState(line).rows.every(row => !row.percentage)).toBe(true);
    if (!phrase.includes("poly/cotton")) expect(line.blend).toBe("");
  });
});
