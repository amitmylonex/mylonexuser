import { describe, expect, it } from "vitest";
import { readRequirements } from "../read-requirements";
import { blendState, updateBlend } from "../blend-state";
import { fibreKey } from "../../../../../../src/domains/rfq/blend/rows";
import { lineDraft } from "../draft";
import { applySourceChanges, rereadSource } from "../source-review";
import { validateAiExtraction } from "../../../../../../src/domains/rfq/text/ai-validation";
import { reconcileTextDrafts } from "../reconcile-text";
import type { AiFabric } from "../../../../../../src/domains/rfq/text/ai-schema";
import { orderedCompositions, completeCompositionInquiry } from "../../../../../../src/domains/rfq/text/__tests__/composition-coverage-fixtures";

describe("composition attributes, review, reconciliation and isolation", () => {
  it.each([
    ["60% recycled poly / 40% cot", [["recycled polyester", "60"], ["Cotton", "40"]], "Polyester qualifier: recycled"],
    ["100% organic cottn", [["Cotton", "100"]], "Cotton qualifier: organic"],
    ["97% cotton / 3% recycled spandex", [["Cotton", "97"], ["Spandex", "3"]], "Spandex qualifier: recycled"],
    ["52.5% recycled cotton / 45% poly / 2.5% spx", [["Cotton", "52.5"], ["Polyester", "45"], ["Spandex", "2.5"]], "Cotton qualifier: recycled"],
    ["60% pre-consumer recycled polyester / 40% post-consumer recycled cotton", [["recycled polyester", "60"], ["Cotton", "40"]], "Cotton qualifier: post-consumer recycled"],
    ["pre-consumer recycled polyester / post-consumer recycled cotton 60/40", [["recycled polyester", "60"], ["Cotton", "40"]], "Polyester qualifier: pre-consumer recycled"],
    ["60% rPET / 40% ctn", [["recycled polyester", "60"], ["Cotton", "40"]], "recycled (rPET)"],
  ] as [string, string[][], string][])("keeps attributes with their own component: %s", async (phrase, expected, note) => {
    const [line] = await readRequirements(completeCompositionInquiry(phrase), false);
    expect(blendState(line).rows.map(row => [fibreKey(row.fibre), row.percentage])).toEqual(expected);
    expect(lineDraft(line).additionalSpecs).toContain(note);
    if (phrase.startsWith("97% cotton")) expect(line.fibreQualifiers?.some(qualifier => qualifier.startsWith("Cotton"))).toBe(false);
    expect(blendState(line).state).toBe("complete");
  });
  it.each(["No polyester; need 100% ctn", "No poly; need 100% cotton", "Not viscose; 100% lyocel"])("excludes negated fibres: %s", async phrase => {
    const [line] = await readRequirements(completeCompositionInquiry(phrase), false);
    expect(blendState(line).rows).toHaveLength(1);
    expect(blendState(line).rows[0].percentage).toBe("100");
  });
  it.each(["Cotton or viscose", "65% cotton / 35% poly or 100% linen", "poly/cotton 65/35 or 60/40", "Composition: 100% cotten", "100% cotten", "100% cotton / 3% unknown-fibre"])("retains ambiguity for explicit review: %s", async phrase => {
    const [line] = await readRequirements(completeCompositionInquiry(phrase), false);
    expect(blendState(line).state).not.toBe("complete");
    expect(line.blendLegacyText).toBeTruthy();
    expect(lineDraft(line).additionalSpecs).toContain(phrase.includes("cotten") ? "cotten" : phrase.includes("unknown") ? "unknown" : "or");
    expect(line.warnings.join(" ")).toMatch(/review|confirm|selection/i);
    if (phrase.includes("cotten")) {
      expect(line.warnings.join(" ")).toContain("Possible fibre Cotton");
      expect(line.blendRows?.some(row => row.fibre === "Cotton" && row.percentage === "100")).toBe(false);
    }
  });
  it.each(["63/34/3\n\npoly/cotton/lyo", "63/34/3; Quantity: 3000 m; poly/cotton/lyo", "Count: 63/34/3; poly/cotton/lyo", "Article: 63/34/3 poly/cotton/lyo"])("does not pair across scope boundaries or stronger roles: %s", async phrase => {
    const lines = await readRequirements(completeCompositionInquiry(phrase), false);
    expect(lines.every(line => blendState(line).rows.every(row => !row.percentage))).toBe(true);
  });
  it.each(["CVC", "PC", "P/V", "cotton x polyester 65/35", "unknown/poly/cotton 60/40"])("leaves incomplete or context-dependent shorthand for review: %s", async phrase => {
    const [line] = await readRequirements(completeCompositionInquiry(phrase), false);
    expect(blendState(line).state).not.toBe("complete");
    expect(blendState(line).rows.every(row => !row.percentage)).toBe(true);
  });
  const families: [string[], string[], string[][]][] = [
    [["ctn", "poly"], ["60", "40"], [["Cotton", "60"], ["Polyester", "40"]]],
    [["modal", "linen", "spx"], ["62.5", "34.5", "3"], [["Modal", "62.5"], ["Linen", "34.5"], ["Spandex", "3"]]],
    [["ramie", "hemp", "nylon", "spandex"], ["40", "30", "27", "3"], [["Ramie", "40"], ["Hemp", "30"], ["Nylon", "27"], ["Spandex", "3"]]],
  ];
  const variations = families.flatMap(([names, values, expected]) => ["/", "-", "+", ":", ","].flatMap(separator => [
    [`${values.join(separator)} [${names.join("/")}]`, expected],
    [`Composition: ${names.join(separator)}\nRatio: ${values.join(separator)}`, expected],
  ] as [string, string[][]][]));
  it.each(variations)("generalizes ordered association: %s", async (phrase, expected) => {
    const [line] = await readRequirements(completeCompositionInquiry(phrase), false);
    expect(blendState(line).rows.map(row => [fibreKey(row.fibre), row.percentage])).toEqual(expected);
    expect(blendState(line).state).toBe("complete");
  });
  it("never sorts fibre names or assigns percentages across separate fabric items", async () => {
    const source = `Fabric 1: ${completeCompositionInquiry("cot/poly/spx 60/37/3")}\n\nFabric 2: ${completeCompositionInquiry("80/20 lyocel/linen")}`;
    const lines = await readRequirements(source, false);
    expect(lines).toHaveLength(2);
    expect(blendState(lines[0]).rows.map(row => [fibreKey(row.fibre), row.percentage])).toEqual([["Cotton", "60"], ["Polyester", "37"], ["Spandex", "3"]]);
    expect(blendState(lines[1]).rows.map(row => [row.fibre, row.percentage])).toEqual([["Lyocell", "80"], ["Linen", "20"]]);
  });
  it.each(orderedCompositions)("reconciles local/AI source-backed composition: %s", async phrase => {
    const source = completeCompositionInquiry(phrase), local = await readRequirements(source, false);
    const raw: AiFabric = { source, fields: [{ field: "blend", value: "63% Polyester 34% Cotton 3% Lyocell", sourcePhrases: [phrase], interpretation: "explicit" }], yarns: [], alternatives: [], issues: [] };
    const validated = validateAiExtraction(source, { fabrics: [raw] }).fabrics;
    const [line] = reconcileTextDrafts(source, local, validated, [raw]);
    expect(blendState(line).rows.map(row => [row.fibre, row.percentage])).toEqual([["Polyester", "63"], ["Cotton", "34"], ["Lyocell", "3"]]);
    expect(line.textCandidates?.filter(candidate => candidate.field === "blend").every(candidate => candidate.status === "accepted")).toBe(true);
  });
  it("keeps manual rows unless the existing explicit apply action selects blend", async () => {
    const [line] = await readRequirements(completeCompositionInquiry("cot/poly/spx 60/37/3"), false);
    const edited = updateBlend(line, [{ id: "manual", fibre: "Modal", percentage: "100" }]);
    const source = completeCompositionInquiry("80% lyocel/20% linen"), proposal = rereadSource(source);
    const kept = applySourceChanges(edited, proposal, []);
    expect(kept.blendRows).toEqual(edited.blendRows);
    const applied = applySourceChanges(edited, proposal, ["blend"]);
    expect(applied.blendRows?.map(row => [row.fibre, row.percentage])).toEqual([["Lyocell", "80"], ["Linen", "20"]]);
    expect(applied.warnings.join(" ")).not.toMatch(/incomplete composition|missing percentages/i);
  });
  it("does not treat a separate commercial percentage as an unknown fibre", async () => {
    const [line] = await readRequirements(completeCompositionInquiry("100% cot; price discount 20% discount"), false);
    expect(blendState(line).state).toBe("complete");
    expect(line.blendLegacyText).toBeUndefined();
  });
});
