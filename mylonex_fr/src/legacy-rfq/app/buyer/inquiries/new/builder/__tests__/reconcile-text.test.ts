import { vi } from "vitest";
vi.mock('../../../../../../adapters/http', () => ({ builderFetch: (...args: Parameters<typeof fetch>) => fetch(...args) }))
import { describe, expect, it, afterEach } from "vitest";
import { parseText } from "../parse-text";
import { readRequirements } from "../read-requirements";
import { reconcileTextDrafts } from "../reconcile-text";
import { validateAiExtraction } from "../../../../../../src/domains/rfq/text/ai-validation";
import { extraction, field, COMBINED, COMBINED_AI } from "../../../../../../src/domains/rfq/text/__tests__/ai-fixtures";
import type { AiExtraction } from "../../../../../../src/domains/rfq/text/ai-schema";
import captures from "../../../../../../src/domains/rfq/text/__tests__/reconciliation-provider-capture.json";
import { applySourceChanges } from "../source-review";
afterEach(() => vi.unstubAllGlobals());
export const EXACT_PV = `20's P/V (65/35) x 20's P/V (65/35) x 100 x 56 x 63" Griege width, 2/2 Twill`;
const capture = captures.find(item => item.name === "pv")!.raw as AiExtraction;
async function read(source: string, raw: AiExtraction) {
  const validated = validateAiExtraction(source, raw);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { mode: "ai-assisted", ...validated, proposals: raw.fabrics } }) }));
  return readRequirements(source, true);
}
describe("source-aligned local + AI reconciliation through complete draft intake", () => {
  it("extracts the exact ASCII P/V requirement locally without duplicate compositions or whole-sentence counts", async () => {
    vi.stubGlobal("fetch", vi.fn());
    const [line] = await readRequirements(EXACT_PV, false);
    expect(line).toMatchObject({ blend: "65% Polyester 35% Viscose", count: "20s × 20s", construction: "100 x 56", draft: { weaveType: "2/2 Twill", width: "63 inches" }, widthBasis: "greige" });
    for (const name of ["gsm", "quantity", "productionCycle", "fabricState"] as const) expect(line.draft[name]).toBeUndefined();
    expect(line.textCandidates).toContainEqual(expect.objectContaining({ field: "width", value: "63 inches", qualifier: "Griege width", status: "review", origin: "local" }));
    expect(line.draft.additionalSpecs).toContain("Warp yarn source: 20's P/V (65/35)");
    expect(line.warnings.join(" ")).not.toMatch(/numeric pair|unassigned|ambiguous/);
    expect(fetch).not.toHaveBeenCalled();
  });
  it("reconciles the actual provider reply into ONE complete editable P/V draft", async () => {
    const lines = await read(EXACT_PV, capture); expect(lines).toHaveLength(1);
    const [line] = lines;
    expect(line).toMatchObject({ original: EXACT_PV, blend: "65% Polyester 35% Viscose", count: "20s × 20s", construction: "100 × 56", draft: { weaveType: "2/2 Twill", width: "63 inches" }, widthBasis: "greige" });
    expect(line.draft.fabricState).toBeUndefined();
    expect(line.textCandidates?.filter(candidate => candidate.field === "blend").map(candidate => candidate.origin)).toEqual(["local", "ai"]);
    expect(line.textCandidates?.filter(candidate => candidate.field === "width").every(candidate => candidate.status === "review")).toBe(true);
    expect(line.colours).toHaveLength(0);
  });
  it("retains local-only measurements alongside AI-only finish, with no blank overwrites", async () => {
    const source = '100% cotton twill; 145 GSM, 58 inches, 500 M; calendared treatment';
    const [line] = await read(source, extraction(source, [field("weaveType", "twill", "twill"), field("finish", "calendared", "calendared treatment")]));
    expect(line.draft).toMatchObject({ gsm: 145, width: "58 inches", quantity: 500 }); expect(line.blend).toBe("100% Cotton"); expect(line.finish).toBe("Calendared");
  });
  it("normalizes equivalent units and pairs to one value while retaining both origins", async () => {
    const source = 'count: 20x20; construction: 100x56; 147.32 cm; 500 M';
    const [line] = await read(source, extraction(source, [field("count", "20 × 20", "count: 20x20"), field("construction", "100 × 56", "construction: 100x56"), field("width", "58 inches", "147.32 cm")]));
    expect(line.draft.width).toBe("58 inches"); expect(line.count).toBe("20 × 20"); expect(line.construction).toBe("100 × 56");
    expect(line.textCandidates?.filter(candidate => candidate.field === "width" && candidate.status === "accepted")).toHaveLength(2);
  });
  it("does not treat agreement on unsupported GSM as proof", async () => {
    const source = 'cotton twill 130';
    const [line] = await read(source, extraction(source, [field("gsm", "130", "130")]));
    expect(line.draft.gsm).toBeUndefined(); expect(line.textCandidates).toContainEqual(expect.objectContaining({ field: "gsm", origin: "ai", status: "unsupported" }));
  });
  it("does not turn an unsupported model width into agreement with a different qualified source width", async () => {
    const raw = extraction(EXACT_PV, [field("width", "99 inches", '63" Griege width')]);
    const [line] = await read(EXACT_PV, raw);
    expect(line.draft.width).toBe("63 inches");
    expect(line.textCandidates).toContainEqual(expect.objectContaining({ origin: "ai", field: "width", value: "99 inches", status: "unsupported" }));
    expect(line.textCandidates).toContainEqual(expect.objectContaining({ origin: "local", field: "width", value: "63 inches", status: "review" }));
  });
  it("keeps identical numbers in different semantic fields independent", async () => {
    const source = '145 GSM, 145 inches, quantity: 145 M; target INR 145/m';
    const [line] = await read(source, extraction(source, [field("gsm", "145", "145 GSM"), field("width", "145 inches", "145 inches"), field("quantity", "145 m", "quantity: 145 M"), field("targetPriceMax", "145", "target INR 145/m")]));
    expect(line.draft).toMatchObject({ gsm: 145, width: "145 inches", quantity: 145, targetPriceMax: 145 });
    expect(line.count).toBe(""); expect(line.construction).toBe("");
  });
  it("keeps explicit conflicts and their competing values for review", async () => {
    const source = 'count: 20x20; count: 30x30; 58 inches, 60 inches';
    const [line] = await read(source, extraction(source, [field("count", "20x20", "count: 20x20"), field("count", "30x30", "count: 30x30"), field("width", "58 inches", "58 inches"), field("width", "60 inches", "60 inches")]));
    expect(line.count).toBe(""); expect(line.draft.width).toBeUndefined();
    expect(new Set(line.textCandidates?.filter(candidate => candidate.field === "width").map(candidate => candidate.value))).toEqual(new Set(["58 inches", "60 inches"]));
    expect(line.warnings.join(" ")).toMatch(/conflict/i);
  });
  it("aligns reverse-ordered AI entries by literal labels and spans, preserving OPTION ownership", async () => {
    const reversed = structuredClone(COMBINED_AI); reversed.fabrics.reverse();
    const lines = await read(COMBINED, reversed); expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ count: "16 OE × 16 OE", construction: "96 × 60", draft: { width: "65 inches", productionCycle: "ready_stock" } });
    expect(lines[1]).toMatchObject({ count: "20 CCW × 20 CCW", construction: "96 × 48" });
    expect(lines[1].draft.width).toBeUndefined(); expect(lines[1].draft.productionCycle).toBeUndefined();
    for (const line of lines) { expect(line.blend).toBe(""); expect(line.original.match(/^OPTION \d/gm)).toHaveLength(3); }
  });
  it("flags soft grouping disagreement without zipping entries or appending AI drafts", () => {
    const source = "Cotton twill. Also need linen plain.";
    const raw = extraction(source, [field("weaveType", "twill", "twill")]);
    const validated = validateAiExtraction(source, raw);
    const lines = reconcileTextDrafts(source, parseText(source), validated.fabrics, raw.fabrics);
    expect(lines).toHaveLength(2); expect(lines.every(line => line.textExtractionMode === "deterministic")).toBe(true);
    expect(lines[0].warnings.join(" ")).toMatch(/boundaries disagree/);
  });
  it("does not average different yarn compositions and preserves both descriptions", async () => {
    const source = EXACT_PV.replace("x 20's P/V (65/35)", "x 20's P/V (55/45)");
    const [line] = await readRequirements(source, false);
    expect(line.blend).toBe(""); expect(line.draft.additionalSpecs).toContain("55/45"); expect(line.warnings.join(" ")).toMatch(/not averaged or added/);
  });
  it.each([
    ["2/2 Twill; Greige width: 63 inches; 24s P/V (60/40) × 24s P/V (60/40) - 108 × 60", "24s × 24s", "108 × 60", "60% Polyester 40% Viscose"],
    ["20 CCW P/V (65/35) x 20 CCW P/V (65/35) x 96 x 48; 3/1 Drill", "20 CCW × 20 CCW", "96 x 48", "65% Polyester 35% Viscose"],
    ["16 OE (compact) × 16 OE (compact) / 96 × 60; 2/2 Matty", "16 OE (compact) × 16 OE (compact)", "96 × 60", ""],
  ])("preserves the specification grammar for new wording: %s", async (text, count, construction, blend) => {
    const [line] = await readRequirements(text, false);
    expect(line.count).toBe(count); expect(line.construction).toBe(construction); expect(line.blend).toBe(blend);
    expect(line.draft.gsm).toBeUndefined(); expect(line.draft.quantity).toBeUndefined(); expect(line.draft.productionCycle).toBeUndefined();
  });
  it("keeps finished width independent of a greige-width candidate and of unselected option widths", async () => {
    const source = '63 inches greige width; finished width: 58 inches; 2/2 Twill\nOPTION 1 100 M per colour, 60 inches\nOPTION 2 200 M per colour, 62 inches';
    const [line] = await read(source, extraction(source, [field("width", "58 inches", "finished width: 58 inches")]));
    expect(line.draft.width).toBe("58 inches"); expect(line.draft.fabricState).toBeUndefined();
    expect(line.textCandidates?.some(candidate => candidate.field === "perColourQuantity")).toBe(false);
    expect(line.textCandidates?.filter(candidate => candidate.field === "width").map(candidate => candidate.value)).not.toContain("60 inches");
  });
  it("preserves manual fields and other lines until source changes are selected", async () => {
    const lines = await read(COMBINED, COMBINED_AI), before = structuredClone(lines[1]);
    lines[0].draft.gsm = 235; lines[0].count = "Buyer count";
    const [proposal] = await read(EXACT_PV, capture);
    const next = applySourceChanges(lines[0], proposal, ["weaveType"]);
    expect(next.draft.gsm).toBe(235); expect(next.count).toBe("Buyer count"); expect(lines[1]).toEqual(before);
    expect(next.original).toBe(EXACT_PV); expect(next.textCandidates).toEqual(proposal.textCandidates);
    expect(vi.mocked(fetch).mock.calls.every(([url]) => url === "/api/buyer/inquiries/extract-text")).toBe(true);
  });
});
