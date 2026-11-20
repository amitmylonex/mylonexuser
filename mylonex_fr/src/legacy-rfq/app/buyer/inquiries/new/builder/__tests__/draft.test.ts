import { describe, expect, it } from "vitest";
import { newLine, duplicateLine, lineDraft, missingRequired, lineDetailIssues, lineIssues, buildBatch } from "../draft";
import { batchSubmissionSchema } from "../../../../../../src/domains/rfq/batch/schema";
const destination = {
  deliveryCountry: "India",
  deliveryState: "Gujarat",
  deliveryCity: "Surat",
  deliveryPincode: "395007",
  contactPhone: "+91 9999988888",
};
const line = () => ({
  ...newLine(),
  blend: "100% Cotton",
  draft: {
    gsm: 120,
    weaveType: "Poplin" as const,
    width: "58 inches",
    fabricState: "rfd" as const,
    quantity: 3000,
    productionCycle: "ready_stock" as const,
    endUse: "Shirting" as const,
  },
});
describe("multi-line RFQ draft validation and mapping", () => {
  it("requires all seven fields and rejects invalid widths, quantities and weight", () => {
    expect(missingRequired(newLine())).toHaveLength(7);
    expect(missingRequired(line())).toEqual([]);
    const invalid = line();
    Object.assign(invalid.draft, { width: "0", gsm: -1, quantity: 1.2 });
    expect(missingRequired(invalid)).toEqual(["GSM", "width", "quantity"]);
  });
  it("keeps end use and conditional dye/print requirements in the readiness calculation", () => {
    const dyed = line();
    dyed.draft.fabricState = "dyed" as never;
    expect(missingRequired(dyed)).toEqual([]);
    expect(lineDetailIssues(dyed).join(" ")).toContain("Colours");
    expect(lineIssues(line(), {})).not.toEqual([]);
    expect(lineDetailIssues(line())).toEqual([]);
  });
  it("duplicates editable content with independent IDs and no mutation to the original", () => {
    const first = line();
    const second = duplicateLine(first);
    second.draft.quantity = 100;
    expect(second.id).not.toBe(first.id);
    expect(first.draft.quantity).toBe(3000);
    let lines = [first, second];
    lines = lines.map((item) => (item.id === second.id ? { ...item, blend: "Linen" } : item));
    expect(lines[0].blend).toBe("100% Cotton");
    lines = lines.filter((item) => item.id !== first.id);
    expect(lines).toEqual([expect.objectContaining({ blend: "Linen" })]);
  });
  it("maps pure fibres, count, construction, colours, swatches and notes into existing fields", () => {
    const input = {
      ...line(),
      count: "20s × 16s + 70D",
      construction: "108 × 56",
      finish: "Teflon",
      original: "Original buyer text",
      colours: [{ id: "navy", name: "Navy", metres: "3000", swatchUrl: "https://example.com/navy.jpg" }],
    };
    const mapped = lineDraft(input, destination);
    expect(mapped).toMatchObject({ materialType: "pure", pureFiber: "Cotton", colorInfoList: ["Navy"], deliveryCity: "Surat" });
    expect(mapped.templateSpecs).toContainEqual({ specKey: "epi", valueNum: 108 });
    expect(mapped.additionalSpecs).toContain("Finish: Teflon");
    expect(mapped.additionalSpecs).toContain("Colour quantity: Navy: 3000 m");
    expect(mapped.additionalSpecs).toContain("Original buyer text");
  });
  it("builds one batch without creating inquiries and validates every line", () => {
    const lines = [line(), line()];
    const key = crypto.randomUUID();
    expect(batchSubmissionSchema.safeParse(buildBatch(lines, destination, key)).success).toBe(true);
    lines[1].draft.quantity = 0;
    expect(batchSubmissionSchema.safeParse(buildBatch(lines, destination, key)).success).toBe(false);
  });
  it("preserves both counter-sample preferences and optional courier details in existing additional specifications", () => {
    for (const preference of ["exact", "closest"] as const) {
      const first = line();
      const sample = {
        ...first,
        draft: { ...first.draft, sendCounterSample: true },
        counterSamplePreference: preference,
        counterSampleCourier: "Blue Dart · AWB 123456",
      };
      const mapped = lineDraft(sample, destination);
      expect(mapped.sendCounterSample).toBe(true);
      expect(mapped.additionalSpecs).toContain(preference === "exact" ? "Match it exactly" : "Closest available");
      expect(mapped.additionalSpecs).toContain("Blue Dart · AWB 123456");
      expect(batchSubmissionSchema.safeParse(buildBatch([sample], destination, crypto.randomUUID())).success).toBe(true);
      const off = lineDraft({ ...sample, draft: { ...sample.draft, sendCounterSample: false } }, destination);
      expect(off.sendCounterSample).toBe(false);
      expect(off.additionalSpecs || "").not.toContain("AWB");
    }
  });
  it("keeps the courier field optional and does not append counter-sample details repeatedly", () => {
    const first = line();
    const sample = { ...first, draft: { ...first.draft, sendCounterSample: true }, counterSamplePreference: "closest" as const };
    expect(batchSubmissionSchema.safeParse(buildBatch([sample], destination, crypto.randomUUID())).success).toBe(true);
    expect(lineDraft(sample, destination)).toEqual(lineDraft(sample, destination));
    expect(lineDraft(sample).additionalSpecs?.match(/Counter sample/g)).toHaveLength(1);
  });
});
