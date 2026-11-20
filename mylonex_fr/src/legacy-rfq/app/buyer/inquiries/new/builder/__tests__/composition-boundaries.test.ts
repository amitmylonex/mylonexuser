import { describe, expect, it } from "vitest";
import { readRequirements } from "../read-requirements";
import { blendState } from "../blend-state";
import { fibreKey } from "../../../../../../src/domains/rfq/blend/rows";
import { orderedCompositions } from "../../../../../../src/domains/rfq/text/composition-lists";
import { TextAnalysis } from "../../../../../../src/domains/rfq/text/analysis";
import { validateAiExtraction } from "../../../../../../src/domains/rfq/text/ai-validation";
import type { AiFabric } from "../../../../../../src/domains/rfq/text/ai-schema";
import { reconcileTextDrafts } from "../reconcile-text";
import { compositionFailures, requestedOrderedForms } from "../../../../../../src/domains/rfq/text/__tests__/composition-boundary-fixtures";
const pairs = (line: Awaited<ReturnType<typeof readRequirements>>[number]) => blendState(line).rows.map(row => [fibreKey(row.fibre), row.percentage]);

describe("composition sentence and neighbouring field boundaries", () => {
  it.each(compositionFailures)("exact manual failure $id", async item => {
    const candidates = orderedCompositions(new TextAnalysis(item.source).text);
    const [line, extra] = await readRequirements(item.source, false);
    expect(candidates).toHaveLength(1);
    expect(candidates[0].review).toBeUndefined();
    expect(extra).toBeUndefined();
    expect(pairs(line)).toEqual(item.pairs);
    expect(line.blendLegacyText).toBeFalsy();
    expect(line.draft.weaveType?.toLowerCase()).toBe(item.weave.toLowerCase());
    expect(line.draft).toMatchObject({ gsm: item.gsm, width: `${item.width} inches`, quantity: item.quantity });
    const blendEvidence = line.sourceEvidence?.filter(e => e.field === "blend") || [];
    expect(blendEvidence.some(e => e.text === item.phrase)).toBe(true);
    for (const e of line.sourceEvidence || []) expect(item.source.slice(e.start, e.end)).toBe(e.text);
    const raw: AiFabric = { source: item.source, fields: [{ field: "blend", value: item.pairs.map(([name, amount]) => `${amount}% ${name}`).join(" "),
      sourcePhrases: [item.phrase], interpretation: "explicit" }], yarns: [], alternatives: [], issues: [] };
    const validated = validateAiExtraction(item.source, { fabrics: [raw] }).fabrics;
    expect(validated[0].fields.some(field => field.field === "blend")).toBe(true);
    expect(pairs(reconcileTextDrafts(item.source, [line], validated, [raw])[0])).toEqual(item.pairs);
  });
  it.each(requestedOrderedForms)("source-order association: %s", async (phrase, expected) => {
    const [line] = await readRequirements(`Please quote ${phrase}. Plain weave, 180 GSM, 58 inches, navy, 2000 metres, made to order.`, false);
    expect(pairs(line)).toEqual(expected);
  });
  const families = [
    { names: ["cot", "lin"], canonical: ["Cotton", "Linen"], values: ["80", "20"] },
    { names: ["poly", "cott", "spdx"], canonical: ["Polyester", "Cotton", "Spandex"], values: ["62.5", "34.5", "3"] },
    { names: ["modal", "lyocel", "hemp", "spx"], canonical: ["Modal", "Lyocell", "Hemp", "Spandex"], values: ["40", "30", "27", "3"] },
    { names: ["silk", "wool", "nylon", "ramie", "cupro"], canonical: ["Silk", "Wool", "Nylon", "Ramie", "Cupro"], values: ["30", "25", "20", "15", "10"] },
  ];
  const matrix = families.flatMap(family => [false, true].flatMap(reverse => ["/", ":", "-", ",", "+", " ", "\t"].flatMap((separator, sep) => [false, true].flatMap(spaced => {
    const names = reverse ? [...family.names].reverse() : family.names;
    const canonical = reverse ? [...family.canonical].reverse() : family.canonical;
    const join = spaced ? ` ${separator} ` : separator;
    const amounts = family.values.map(value => sep % 2 ? `${value}%` : value).join(join);
    const fibres = names.join(join);
    return [`${amounts} [${fibres}]`, `${fibres}\n${amounts}`, `Blend: (${fibres}) = ${amounts}`, `${amounts}\n${fibres}`].map((phrase, position) => ({
      phrase, expected: canonical.map((name, index) => [name, family.values[index]]),
      ending: [". Plain weave", ", 3/1 drill", ", 30s x 30s / 100 x 72, Plain weave", "; Plain weave"][position],
    }));
  }))));
  it.each(matrix)("matrix: $phrase $ending", async ({ phrase, expected, ending }) => {
    const source = `Please quote ${phrase}${ending}, 180 GSM, 58 inches, navy, 2000 metres, made to order.`;
    const [line, extra] = await readRequirements(source, false);
    expect(extra).toBeUndefined();
    expect(pairs(line)).toEqual(expected);
    expect(blendState(line).state).toBe("complete");
    for (const e of line.sourceEvidence || []) expect(source.slice(e.start, e.end)).toBe(e.text);
  });
  it.each([
    "cot/lin 80/20/3.", "cot/lin/spx 80/20.", "cot/lin 80/20 or 70/30.", "cot/lin 80/20, 70/30.",
    "80/20 cot/lin/unknown-fibre.", "unknown-fibre/cot/lin 80/20.", "cot/lin 2:1.", "cot/lin; 80/20.",
    "cot/lin Count: 80/20.", "cot/lin 30s x 30s / 100 x 72.", "cot/lin 2/1 twill.", "cot/lin 165.1 cm.",
    "cot/lin 80/20/3gsm.", "cot or lin 80/20.", "cot/lin not wanted; 80/20.", "cot/lin.",
  ])("keeps uncertain or non-composition numbers incomplete: %s", async phrase => {
    const lines = await readRequirements(`Please quote ${phrase} 180 GSM, 58 inches, navy, 2000 metres, made to order.`, false);
    expect(lines.every(line => blendState(line).state !== "complete")).toBe(true);
    expect(lines.every(line => pairs(line).every(([, value]) => !value))).toBe(true);
  });
  it.each(["65/34", "65/38"])("preserves non-100 totals at sentence end: %s", async amounts => {
    const [line] = await readRequirements(`Please quote cot/lin ${amounts}. Plain weave, 180 GSM, 58 inches, navy, 2000 metres.`, false);
    expect(pairs(line)).toEqual([["Cotton", "65"], ["Linen", amounts.slice(3)]]);
    expect(blendState(line).state).toBe(amounts.endsWith("34") ? "incomplete" : "error");
  });
});
