import { vi } from "vitest";
vi.mock('../../../../../../adapters/http', () => ({ builderFetch: (...args: Parameters<typeof fetch>) => fetch(...args) }))
import { afterEach, describe, expect, it } from "vitest";
import { readRequirements } from "../read-requirements";
import { sourceChanges, applySourceChanges } from "../source-review";
import { validateAiExtraction } from "../../../../../../src/domains/rfq/text/ai-validation";
import { SIMPLE, SIMPLE_AI, YARNS, YARNS_AI, COMBINED, COMBINED_AI, field, extraction } from "../../../../../../src/domains/rfq/text/__tests__/ai-fixtures";
import type { AiExtraction } from "../../../../../../src/domains/rfq/text/ai-schema";
afterEach(() => vi.unstubAllGlobals());
async function read(source: string, raw: AiExtraction) {
  const validated = validateAiExtraction(source, raw);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true, data: { mode: "ai-assisted", ...validated } }) }));
  return readRequirements(source, true);
}
describe("complete AI response through validated displayed draft mapping", () => {
  it("separates every simple textile field, leaves absent GSM blank, and sends original text", async () => {
    const [line] = await read(SIMPLE, SIMPLE_AI);
    expect(line).toMatchObject({ original: SIMPLE, textExtractionMode: "ai-assisted", blend: "100% Cotton", count: "30x30", construction: "110x60", draft: { weaveType: "2/1 twill", width: "58 inches", quantity: 1000, productionCycle: "ready_stock", fabricState: "dyed" } });
    expect(line.draft.gsm).toBeUndefined();
    expect(line.warnings.join(" ")).not.toMatch(/ambiguous|numeric pair/);
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string).text).toBe(SIMPLE);
  });
  it("retains both yarn descriptions and a single common blend; greige width stays qualified", async () => {
    const [line] = await read(YARNS, YARNS_AI);
    expect(line).toMatchObject({ blend: "65% Polyester 35% Viscose", count: "20s × 20s", construction: "100 × 56", draft: { weaveType: "2/2 Twill", width: "63 inches" }, widthBasis: "greige" });
    for (const key of ["gsm", "quantity", "productionCycle", "fabricState"] as const) expect(line.draft[key]).toBeUndefined();
    expect(line.draft.additionalSpecs).toContain("Warp yarn source: 20’s P/V (65/35)");
    expect(line.draft.additionalSpecs).toContain("Weft yarn source: 20’s P/V (65/35)");
    expect(line.draft.additionalSpecs).toContain("Stated width: 63 inches · Greige width");
  });
  it("maps the combined A/B input into exactly two drafts without option or width leakage", async () => {
    const lines = await read(COMBINED, COMBINED_AI);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ count: "16 OE × 16 OE", construction: "96 × 60", blend: "", draft: { width: "65 inches", productionCycle: "ready_stock", weaveType: "2/2 Matty" } });
    expect(lines[1]).toMatchObject({ count: "20 CCW × 20 CCW", construction: "96 × 48", blend: "", draft: { weaveType: "3/1 Drill" } });
    expect(lines[1].draft.width).toBeUndefined(); expect(lines[1].draft.productionCycle).toBeUndefined();
    for (const line of lines) {
      expect(line.draft.additionalSpecs?.match(/Sourcing alternative/g)).toHaveLength(3);
      expect(line.warnings.join(" ")).not.toMatch(/ambiguous/);
    }
    expect(lines[0].original).not.toContain("CCW"); expect(lines[1].original).not.toContain("16 OE");
  });
  it.each(["500 M", "500 (M)"])("recognizes %s as quantity with no unrelated fields", async source => {
    const [line] = await read(source, extraction(source, [field("quantity", "500 m", source)]));
    expect(line.draft.quantity).toBe(500); expect(line.count).toBe(""); expect(line.construction).toBe("");
    expect(line.draft.gsm).toBeUndefined(); expect(line.draft.width).toBeUndefined();
  });
  it.each([200, 500])("preserves explicit total %i with per-colour amounts and flags inconsistent totals", async total => {
    const source = `100 (M) per colour; blue, black; total ${total} (M)`;
    const [line] = await read(source, extraction(source, [field("perColourQuantity", "100 m", "100 (M) per colour"), field("colour", "blue", "blue"), field("colour", "black", "black"), field("quantity", `${total} m`, `total ${total} (M)`)]));
    expect(line.draft.quantity).toBe(total === 200 ? total : undefined); expect(line.colours.map(item => item.metres)).toEqual(["100", "100"]);
    expect(line.warnings.join(" ").includes("mismatch")).toBe(total !== 200);
    expect(line.draft.fabricState).toBe("dyed");
    expect(line.fabricStateInferred).toBe(true);
  });
  it("keeps directional compositions separate when they differ", async () => {
    const source = YARNS.replace("× 20’s P/V (65/35)", "× 20’s P/V (55/45)");
    const raw = extraction(source, [field("blend", "65% Polyester 35% Viscose", "P/V (65/35)")]);
    raw.fabrics[0].yarns = [{ direction: "warp", source: "20’s P/V (65/35)", blend: "65% Polyester 35% Viscose" }, { direction: "weft", source: "20’s P/V (55/45)", blend: "55% Polyester 45% Viscose" }];
    const [line] = await read(source, raw);
    expect(line.blend).toBe(""); expect(line.warnings.join(" ")).toMatch(/not averaged or added/);
    expect(line.draft.additionalSpecs).toContain("55/45");
  });
  it("reviews new proposals without overwriting manual edits or another draft", async () => {
    const lines = await read(COMBINED, COMBINED_AI);
    lines[0].draft.gsm = 235; lines[0].count = "Buyer corrected count";
    const unchanged = structuredClone(lines[1]);
    const [proposal] = await read(SIMPLE, SIMPLE_AI);
    expect(sourceChanges(lines[0], proposal).some(item => item.key === "count")).toBe(true);
    const accepted = applySourceChanges(lines[0], proposal, ["weaveType"]);
    expect(accepted.count).toBe("Buyer corrected count"); expect(accepted.draft.gsm).toBe(235);
    expect(lines[0].original).toContain("A)"); expect(lines[1]).toEqual(unchanged);
    expect(vi.mocked(fetch).mock.calls.every(([url]) => url === "/api/buyer/inquiries/extract-text")).toBe(true);
  });
});
