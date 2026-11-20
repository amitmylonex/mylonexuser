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

describe("Representative AI/Local Reconciliation Across Sourcing Categories", () => {
  it("reconciles WhatsApp shorthand with colour-adjacent quantity", async () => {
    const source = "65/35 poly/viscose twill 200 gsm 58inch dyed navy 5000m best rate pls";
    const raw = extraction(source, [
      field("blend", "65% Polyester 35% Viscose", "65/35 poly/viscose"),
      field("weaveType", "twill", "twill"),
      field("gsm", "200", "200 gsm"),
      field("width", "58 inches", "58inch"),
      field("quantity", "5000 m", "5000m"),
      field("fabricState", "dyed", "dyed"),
    ]);

    const [line] = await readWithMockAi(source, raw);
    expect(line.draft.quantity).toBe(5000);
    expect(line.draft.gsm).toBe(200);
    expect(line.draft.width).toBe("58 inches");
    expect(line.draft.weaveType).toBe("twill");
    expect(line.blend).toBe("65% Polyester 35% Viscose");
    expect(line.colours.some(c => c.name.toLowerCase() === "navy")).toBe(true);
  });

  it("reconciles Hinglish inquiry with conversational structure", async () => {
    const source = "Sir poly viscose 65/35 twill fabric required 220 gsm dyed navy 3000 meter order quantity best price btao";
    const raw = extraction(source, [
      field("blend", "65% Polyester 35% Viscose", "poly viscose 65/35"),
      field("weaveType", "twill", "twill"),
      field("gsm", "220", "220 gsm"),
      field("quantity", "3000 m", "3000 meter"),
      field("fabricState", "dyed", "dyed"),
    ]);

    const [line] = await readWithMockAi(source, raw);
    expect(line.draft.quantity).toBe(3000);
    expect(line.draft.gsm).toBe(220);
    expect(line.blend).toBe("65% Polyester 35% Viscose");
    expect(line.draft.weaveType).toBe("twill");
    expect(line.colours.some(c => c.name.toLowerCase() === "navy")).toBe(true);
  });

  it("reconciles formal RFQ with Weave Architecture header", async () => {
    const source = `Article Description: Executive Poplin Shirting
Fiber Composition: 100% Cotton
Yarn Count: 50s x 50s
Construction Density: 133 x 72
Weave Architecture: Poplin
Nominal Weight: 120 GSM
Finished Usable Width: 58 inches
Required Volume: 5000 meters
Destination: Surat, Gujarat`;

    const raw = extraction(source, [
      field("customFabricName", "Executive Poplin Shirting", "Article Description: Executive Poplin Shirting"),
      field("blend", "100% Cotton", "Fiber Composition: 100% Cotton"),
      field("count", "50s x 50s", "Yarn Count: 50s x 50s"),
      field("construction", "133 x 72", "Construction Density: 133 x 72"),
      field("weaveType", "Poplin", "Weave Architecture: Poplin"),
      field("gsm", "120", "Nominal Weight: 120 GSM"),
      field("width", "58 inches", "Finished Usable Width: 58 inches"),
      field("quantity", "5000 m", "Required Volume: 5000 meters"),
    ]);

    const [line] = await readWithMockAi(source, raw);
    expect(line.draft.weaveType).toBe("Poplin");
    expect(line.count).toBe("50s x 50s");
    expect(line.construction).toBe("133 x 72");
    expect(line.draft.gsm).toBe(120);
    expect(line.draft.width).toBe("58 inches");
    expect(line.draft.quantity).toBe(5000);
    expect(line.blend).toBe("100% Cotton");
  });

  it("reconciles per-colour shade splits preserving explicit total and individual shades", async () => {
    const source = "65/35 Poly-Viscose uniform twill, 200 GSM, 58 inches finished, dyed. Total quantity: 6000m (2000m Navy, 2000m Black, 2000m White).";
    const raw = extraction(source, [
      field("blend", "65% Polyester 35% Viscose", "65/35 Poly-Viscose"),
      field("weaveType", "twill", "twill"),
      field("gsm", "200", "200 GSM"),
      field("width", "58 inches", "58 inches finished"),
      field("quantity", "6000 m", "Total quantity: 6000m"),
      field("fabricState", "dyed", "dyed"),
    ]);

    const [line] = await readWithMockAi(source, raw);
    expect(line.draft.quantity).toBe(6000);
    expect(line.draft.gsm).toBe(200);
    expect(line.draft.width).toBe("58 inches");
    expect(line.colours.length).toBe(3);
    const colourNames = line.colours.map(c => c.name);
    expect(colourNames).toContain("Navy");
    expect(colourNames).toContain("Black");
    expect(colourNames).toContain("White");
  });
});
