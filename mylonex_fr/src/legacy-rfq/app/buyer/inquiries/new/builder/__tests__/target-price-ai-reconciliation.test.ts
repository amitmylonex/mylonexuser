import { describe, it, expect, vi, afterEach } from "vitest";
import { readRequirements } from "../read-requirements";
import { validateAiExtraction } from "../../../../../../src/domains/rfq/text/ai-validation";
import { extraction, field } from "../../../../../../src/domains/rfq/text/__tests__/ai-fixtures";
import type { AiExtraction } from "../../../../../../src/domains/rfq/text/ai-schema";
import { lineDraft } from "../draft";

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

describe("Target Price AI / Local Reconciliation & Persistence", () => {
  it("reconciles explicit INR per metre price with AI agreement", async () => {
    const source = "100% cotton poplin, 140 gsm, 58 inches, 3000m, Target price: 180 INR/meter";
    const raw = extraction(source, [
      field("blend", "100% Cotton", "100% cotton"),
      field("weaveType", "poplin", "poplin"),
      field("gsm", "140", "140 gsm"),
      field("width", "58 inches", "58 inches"),
      field("quantity", "3000 m", "3000m"),
      field("targetPriceMax", "180", "Target price: 180 INR/meter"),
    ]);

    const [line] = await readWithMockAi(source, raw);
    expect(line.targetPriceAmount).toBe(180);
    expect(line.targetPriceCurrency).toBe("INR");
    expect(line.targetPriceBasis).toBe("per_metre");
    expect(line.draft.targetPriceMax).toBe(180);
  });

  it("guards basis-unspecified target price against AI auto-assignment to ₹/m", async () => {
    const source = "100% cotton poplin, 140 gsm, 58 inches, 3000m, Target @200/- (price basis not specified yet)";
    const raw = extraction(source, [
      field("blend", "100% Cotton", "100% cotton"),
      field("weaveType", "poplin", "poplin"),
      field("gsm", "140", "140 gsm"),
      field("width", "58 inches", "58 inches"),
      field("quantity", "3000 m", "3000m"),
    ]);

    const [line] = await readWithMockAi(source, raw);
    expect(line.targetPriceAmount).toBe(200);
    expect(line.targetPriceBasis).toBe("unspecified");
    // Not silently mapped into draft.targetPriceMax
    expect(line.draft.targetPriceMax).toBeUndefined();
    expect(line.targetPriceQualifier).toMatch(/price basis not specified/i);
  });

  it("guards foreign currency (USD) from automatic currency conversion", async () => {
    const source = "100% cotton poplin, 140 gsm, 58 inches, 3000m, Target USD 15/m";
    const raw = extraction(source, [
      field("blend", "100% Cotton", "100% cotton"),
      field("weaveType", "poplin", "poplin"),
      field("gsm", "140", "140 gsm"),
      field("width", "58 inches", "58 inches"),
      field("quantity", "3000 m", "3000m"),
    ]);

    const [line] = await readWithMockAi(source, raw);
    expect(line.targetPriceAmount).toBe(15);
    expect(line.targetPriceCurrency).toBe("USD");
    expect(line.draft.targetPriceMax).toBeUndefined();
    expect(line.warnings.some(w => /conversion to ₹\/m is not performed automatically/i.test(w))).toBe(true);
  });

  it("persists buyer confirmed per metre target through submission mapping", async () => {
    const source = "100% cotton poplin, 140 gsm, 58 inches, 3000m, Target price - 200";
    const raw = extraction(source, [
      field("blend", "100% Cotton", "100% cotton"),
      field("weaveType", "poplin", "poplin"),
      field("gsm", "140", "140 gsm"),
      field("width", "58 inches", "58 inches"),
      field("quantity", "3000 m", "3000m"),
    ]);

    const [line] = await readWithMockAi(source, raw);
    expect(line.targetPriceAmount).toBe(200);
    expect(line.targetPriceBasis).toBe("unspecified");
    expect(line.draft.targetPriceMax).toBeUndefined();

    // Buyer clicks "Confirm as ₹/m"
    line.targetPriceBasis = "per_metre";
    line.draft.targetPriceMax = line.targetPriceAmount;
    line.targetPriceConfirmed = true;

    const submissionDraft = lineDraft(line);
    expect(submissionDraft.targetPriceMax).toBe(200);
  });
});
