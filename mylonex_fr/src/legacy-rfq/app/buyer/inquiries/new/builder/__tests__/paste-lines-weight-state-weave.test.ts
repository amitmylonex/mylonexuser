import { expect, it } from "vitest";
import { readRequirements } from "../read-requirements";

const read = async (source: string) => (await readRequirements(source, false))[0];
const cotton = "100% cotton twill, dyed, 3000 m";

it("converts labelled GLM using the stated width and keeps its literal source", async () => {
  const line = await read(cotton + "\nLinear weight: 250 GLM\nWidth: 58 inches");
  expect(line.draft.gsm).toBe(169.7);
  expect(line.weightInput).toMatchObject({ unit: "glm", value: 250, rawText: "250 GLM" });
});

it.each(["", "\nWidth: 58 to 60 inches", "\nWidth: 58 inches\nWidth: 63 inches"])(
  "leaves GSM open for labelled GLM with missing or ambiguous width %s",
  async width => {
    const line = await read(cotton + "\nWeight: 250 GLM" + width);
    expect(line.draft.gsm).toBeUndefined();
    expect(line.weightInput?.rawText).toBe("250 GLM");
  },
);

it.each([
  ["GSM: 200", 200],
  ["180 to 190 GSM", undefined],
] as const)("preserves the separately stated area weight %s", async (areaWeight, gsm) => {
  const line = await read(cotton + "\nWeight: 250 GLM\nWidth: 150 cm\n" + areaWeight);
  expect(line.draft.gsm).toBe(gsm);
  expect(line.gsmProvenance).toBe("extracted");
  if (gsm === undefined) expect([line.gsmMin, line.gsmMax]).toEqual([180, 190]);
});

it("keeps an explicit dyed state when Grey TBC is a shade", async () => {
  const line = await read("100% cotton, Dobby, 140 GSM, 58 inches\nColours: Navy 500 m, Black 300 m, Grey TBC\nState: Dyed");
  expect(line.draft.fabricState).toBe("dyed");
  expect(line.draft.quantity).toBeUndefined();
});

it("recognizes greige before the order amount while preserving width-only context", async () => {
  const greige = await read("Need honeycomb 100% cotton 260 gsm 58 inches greige 7250 m");
  expect(greige.draft.fabricState).toBe("greige");
  const widthOnly = await read('100% cotton honeycomb, 260 GSM, 63" greige width, 7250 m');
  expect(widthOnly.draft.fabricState).toBeUndefined();
  const conflicted = await read('100% cotton honeycomb, 260 GSM, 63", greige or dyed, 7250 m');
  expect(conflicted.draft.fabricState).toBeUndefined();
});

it.each([["2/2 TWL", "2/2 Twill"], ["Oxford", "Oxford"]])(
  "keeps the explicit weave %s before the yarn label",
  async (weave, expected) => {
    const line = await read("100% cotton\nWeave: " + weave + '\nYarn count: 40/2 x 40/2\nWidth: 58"\nQuantity: 5000 m');
    expect(line.draft.weaveType).toBe(expected);
  },
);

it("uses the stated twill repeat for denim fabric and keeps both source mentions", async () => {
  const line = await read("denim fabric - 9 oz - 100% cotton - 3/1 twill - 58 inches - dyed indigo - 5000m");
  expect(line.draft.weaveType).toBe("3/1 twill");
  expect(line.sourceEvidence?.filter(item => item.field === "weave").map(item => item.text)).toEqual(["denim", "3/1 twill"]);
  const alternative = await read("denim fabric or 3/1 twill, 100% cotton, 58 inches, 5000 m");
  expect(alternative.draft.weaveType).toBeUndefined();
});
