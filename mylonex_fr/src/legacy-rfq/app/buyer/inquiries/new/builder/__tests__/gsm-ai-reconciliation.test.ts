import { describe, it, expect, vi, afterEach } from "vitest";
import { readRequirements } from "../read-requirements";
import { validateAiExtraction } from "../../../../../../src/domains/rfq/text/ai-validation";
import { extraction, field } from "../../../../../../src/domains/rfq/text/__tests__/ai-fixtures";
import type { AiExtraction } from "../../../../../../src/domains/rfq/text/ai-schema";

afterEach(() => vi.unstubAllGlobals());

async function readWithMockAi(source: string, raw: AiExtraction) {
  const validated = validateAiExtraction(source, raw);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      data: {
        mode: "ai-assisted",
        ...validated,
        proposals: raw.fabrics,
      },
    }),
  }));
  return readRequirements(source, true);
}

describe("GSM AI / Local Reconciliation", () => {
  it("reconciles exact GSM notation with AI agreement and preserves decimal", async () => {
    const source = "100% Cotton poplin, 145.5 g/m², 58 inches, dyed navy, 1000m";
    const raw = extraction(source, [
      field("blend", "100% Cotton", "100% Cotton"),
      field("weaveType", "poplin", "poplin"),
      field("gsm", "145.5", "145.5 g/m²"),
      field("width", "58 inches", "58 inches"),
      field("quantity", "1000 m", "1000m"),
      field("fabricState", "dyed", "dyed"),
    ]);

    const [line] = await readWithMockAi(source, raw);
    expect(line.draft.gsm).toBe(145.5);
    expect(line.textCandidates?.some(c => c.field === "gsm" && c.value === "145.5" && c.status === "accepted")).toBe(true);
  });

  it("surfaces conflicting GSM interpretations between AI and local for buyer review", async () => {
    const source = "Cotton fabric, 220 GSM, 58 inches, 2000m";
    // AI incorrectly extracted 180 from somewhere else or halluncinated
    const raw = extraction(source, [
      field("blend", "Cotton", "Cotton"),
      field("gsm", "180", "220 GSM"),
      field("width", "58 inches", "58 inches"),
      field("quantity", "2000 m", "2000m"),
    ]);

    const [line] = await readWithMockAi(source, raw);
    // When there is a conflict between local (220) and AI (180), it must not silently overwrite
    expect(line.textCandidates?.some(c => c.field === "gsm")).toBe(true);
  });

  it("preserves local qualified GSM range when AI suggests collapsed single number", async () => {
    const source = "Cotton twill, 180–190 GSM, 58 inches, 3000m";
    const raw = extraction(source, [
      field("blend", "Cotton", "Cotton"),
      field("weaveType", "twill", "twill"),
      field("gsm", "185", "180–190 GSM"),
      field("width", "58 inches", "58 inches"),
      field("quantity", "3000 m", "3000m"),
    ]);

    const [line] = await readWithMockAi(source, raw);
    // Local range must be retained
    expect(line.gsmMin).toBe(180);
    expect(line.gsmMax).toBe(190);
    expect(line.gsmQualifier).toBe("Range: 180–190 g/m²");
  });

  it("preserves local qualified bound when AI assists other fields", async () => {
    const source = "Poplin fabric, at least 180 GSM, 58 inches, 5000m, dyed white";
    const raw = extraction(source, [
      field("blend", "100% Cotton", "Poplin fabric"),
      field("width", "58 inches", "58 inches"),
      field("quantity", "5000 m", "5000m"),
      field("fabricState", "dyed", "dyed"),
    ]);

    const [line] = await readWithMockAi(source, raw);
    expect(line.gsmBound).toEqual({ value: 180, operator: ">=", label: "At least" });
    expect(line.gsmMin).toBe(180);
  });
});
