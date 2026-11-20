import { describe, expect, it } from "vitest";
import { readRequirements } from "../read-requirements";
import { blendState } from "../blend-state";
import { FIBRES } from "../../../../../../src/domains/rfq/text/fibres";
import { fibreKey } from "../../../../../../src/domains/rfq/blend/rows";
import { validateAiExtraction } from "../../../../../../src/domains/rfq/text/ai-validation";
import { buyerCommaForms, decimalCommaForms, ambiguousCommaForms, commaInquiry } from "../../../../../../src/domains/rfq/text/__tests__/composition-comma-fixtures";

async function assertRows(phrase: string, expected: string[][], complete: boolean) {
  const source = complete ? commaInquiry(phrase) : phrase;
  const [line, extra] = await readRequirements(source, false);
  expect(extra).toBeUndefined();
  expect(blendState(line).rows.map(row => [fibreKey(row.fibre), row.percentage]), phrase).toEqual(expected);
  expect(blendState(line).state).toBe("complete");
  expect(line.blendLegacyText).toBeFalsy();
  for (const e of line.sourceEvidence || []) expect(source.slice(e.start, e.end)).toBe(e.text);
  if (complete) {
    expect(line.draft.weaveType?.toLowerCase()).toBe("3/1 drill");
    expect(line.draft).toMatchObject({ gsm: 220, width: "60 inches", quantity: 2500, productionCycle: "made_to_order" });
  }
}
describe("comma and whitespace combinations in actual builder rows", () => {
  it.each(buyerCommaForms)("buyer form in short and full inquiries: %s", async (phrase, expected) => {
    await assertRows(phrase, expected, false);
    await assertRows(phrase, expected, true);
  });
  const commas = [",", ", ", " ,", " , "];
  const joins = [...commas.flatMap(numbers => commas.map(fibres => ({ numbers, fibres }))),
    ...commas.flatMap(comma => [{ numbers: " ", fibres: comma }, { numbers: comma, fibres: "\t" }]),
    { numbers: "\t", fibres: " " }, { numbers: " ", fibres: "\t" }];
  const aliases = Object.entries(FIBRES).flatMap(([family, values]) => [...new Set([family, ...values])].map(alias => ({ alias, family })));
  const matrix = aliases.flatMap(({ alias, family }, index) => joins.flatMap(({ numbers, fibres }, join) => [false, true].map(before => {
    const partner = family === "Cotton" ? "poly" : "cot";
    const names = join % 2 ? [partner, alias] : [alias, partner];
    const aliasFamily = /^rpe[st]$/i.test(alias) ? "recycled polyester" : family;
    const partnerFamily = family === "Cotton" ? "Polyester" : "Cotton";
    const expectedNames = join % 2 ? [partnerFamily, aliasFamily] : [aliasFamily, partnerFamily];
    const gap = (index + join) % 2 ? "\n" : " ";
    const ratio = ["97", "3"].join(numbers), list = names.join(fibres);
    return { alias, family, phrase: before ? `${ratio}${gap}${list}` : `${list}${gap}${ratio}`, expected: expectedNames.map((name, i) => [name, i ? "3" : "97"]) };
  })));
  // Keep every independent permutation, with one reported test per alias. Tens
  // of thousands of individual task updates can exhaust Vitest's RPC reporting
  // window even when assertions yield and pass. No timeouts are increased.
  const aliasMatrix = aliases.map(({ alias, family }) => ({ alias, family, forms: matrix.filter(form => form.alias === alias && form.family === family) }));
  it.each(aliasMatrix)("all shared aliases, independent separators: $alias ($family)", async ({ forms }) => {
    for (const { phrase, expected } of forms) {
      await new Promise<void>(resolve => setImmediate(resolve));
      await assertRows(phrase, expected, false);
      await assertRows(phrase, expected, true);
    }
  });
  it.each(decimalCommaForms)("uniquely associated decimal commas: %s", async (phrase, expected) => {
    await assertRows(phrase, expected, false);
    await assertRows(phrase, expected, true);
    const source = commaInquiry(phrase), value = expected.map(([name, amount]) => `${amount}% ${name}`).join(" ");
    const validated = validateAiExtraction(source, { fabrics: [{ source, fields: [{ field: "blend", value, sourcePhrases: [phrase], interpretation: "explicit" }], yarns: [], alternatives: [], issues: [] }] });
    expect(validated.fabrics[0].fields.some(field => field.field === "blend")).toBe(true);
  });
  it.each(ambiguousCommaForms)("never invents populated percentages: %s", async phrase => {
    for (const source of [phrase, commaInquiry(phrase)]) {
      const lines = await readRequirements(source, false);
      expect(lines.every(line => blendState(line).rows.every(row => !row.percentage))).toBe(true);
      expect(lines.every(line => blendState(line).state !== "complete")).toBe(true);
      expect(lines.some(line => line.original.includes(phrase))).toBe(true);
    }
  });
  it.each([",", ", ", " ,", " , "].flatMap(separator => ["40s x 40s - 142 x 72", "Count: 30/30"].map(technical => `${technical}${separator}100% cotton`)))("protects neighbouring technical numbers at any comma spacing: %s", async source => {
    const [line] = await readRequirements(`${source}; Plain weave, 180 GSM, 58 inches, navy, 1500 metres, made to order.`, false);
    expect(blendState(line).rows.map(row => [fibreKey(row.fibre), row.percentage])).toEqual([["Cotton", "100"]]);
    expect(line.draft).toMatchObject({ gsm: 180, width: "58 inches", quantity: 1500 });
  });
  it.each([
    ["cot, poly 60,20,20", "60.2% Cotton 20% Polyester"],
    ["cot, poly, spx 50,25,25,0", "50% Cotton 25% Polyester 25% Spandex"],
  ])("AI cannot choose a convenient comma interpretation: %s", (phrase, value) => {
    const source = commaInquiry(phrase);
    const raw = { fabrics: [{ source, fields: [{ field: "blend", value, sourcePhrases: [phrase], interpretation: "explicit" }], yarns: [], alternatives: [], issues: [] }] };
    expect(validateAiExtraction(source, raw).fabrics[0].fields.some(field => field.field === "blend")).toBe(false);
  });
});
