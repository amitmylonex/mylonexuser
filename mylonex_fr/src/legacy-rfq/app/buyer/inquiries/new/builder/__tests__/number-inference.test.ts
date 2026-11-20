import { describe, expect, it } from "vitest";
import { parseDescription, parseText } from "../parse-text";
import { lineDraft } from "../draft";
import { batchInquirySchema } from "../../../../../../src/domains/rfq/batch/schema";
import { wovenProductionPayload } from "../../../../../../src/domains/rfq/__tests__/fixtures";
import { evidenceSchema } from "../../../../../../src/domains/rfq/text/types";

const source = 'Need 100% cotton plain poplin. 58", 130,\n20 x 20 / 52 x 48. Require 10,000 mtrs.\nSoft finish, suitable for shirts.';
describe("evidence-based inference for remaining numbers", () => {
  it("proposes the lone context-supported GSM without satisfying the required field", () => {
    const lines = parseText(source); expect(lines).toHaveLength(1);
    const line = lines[0];
    expect(line).toMatchObject({ blend: "100% Cotton", count: "20 x 20", construction: "52 x 48", finish: "Soft" });
    expect(line.draft).toMatchObject({ width: "58 inches", quantity: 10000, weaveType: "plain poplin", endUse: "Shirting" });
    expect(line.draft.gsm).toBeUndefined();
    const item = line.sourceEvidence?.find(value => value.field === "gsm");
    expect(item).toMatchObject({ kind: "inferred", text: "130", value: 130, unit: "g/m²" });
    expect(item?.reason).toContain("explicit width");
    expect(item?.reason).toContain("construction");
    expect(line.original.slice(item!.start, item!.end)).toBe("130");
    expect(line.warnings.join(" ")).toContain("inferred");
  });
  it("uses explicit quantities below 1000 and does not assume an unknown quantity unit", () => {
    const [small] = parseText("Need 300 metres, cotton poplin, 130");
    expect(small.draft.quantity).toBe(300);
    expect(small.draft.gsm).toBeUndefined();
    expect(small.sourceEvidence).toEqual(expect.arrayContaining([
      expect.objectContaining({ field: "quantity", kind: "explicit", text: "300 metres" }),
      expect.objectContaining({ field: "gsm", kind: "inferred", value: 130 }),
    ]));
    const [unknown] = parseText("130 gsm cotton poplin. Need 500.");
    expect(unknown.draft.gsm).toBe(130); expect(unknown.draft.quantity).toBeUndefined();
    expect(unknown.sourceEvidence).toContainEqual(expect.objectContaining({ field: "quantity", kind: "unresolved", value: 500, text: "500" }));
    expect(unknown.sourceEvidence?.find(item => item.kind === "unresolved")?.unit).toBeUndefined();
    expect(unknown.draft.additionalSpecs).toContain("500");
    expect(unknown.warnings.join(" ")).toContain("unit is unknown");
  });
  it("uses a source-established quantity convention but no global metre default", () => {
    const line = parseDescription("130 gsm cotton poplin. All order quantities are in metres. Need 500.");
    expect(line.draft.quantity).toBe(500);
    expect(line.sourceEvidence).toContainEqual(expect.objectContaining({ field: "quantity", kind: "inferred", unit: "m", value: 500 }));
    expect(parseDescription("cotton poplin. Need 500.").draft.gsm).toBeUndefined();
  });
  it("retains competing numbers rather than resolving them by numeric size", () => {
    const line = parseDescription("Cotton poplin, 130, 300");
    expect(line.draft.gsm).toBeUndefined(); expect(line.draft.quantity).toBeUndefined();
    expect(line.sourceEvidence?.filter(item => item.kind === "unresolved").map(item => item.value)).toEqual([130, 300]);
    expect(line.draft.additionalSpecs).toContain("130, 300");
    expect(parseDescription('cotton poplin, 58", need 300 m, 130, 600').draft.gsm).toBeUndefined();
  });
  it("prefers 50–500 without treating it as a limit or sufficient evidence", () => {
    expect(parseDescription("130").draft.gsm).toBeUndefined();
    expect(parseDescription("cotton poplin, 130").draft.gsm).toBeUndefined();
    for (const gsm of [40, 600, 900]) {
      const line = parseDescription(`cotton poplin, 58 inches, 20x20/52x48, need 300 m, ${gsm}`);
      expect(line.draft.gsm).toBe(gsm);
      expect(line.sourceEvidence?.find(item => item.field === "gsm")?.reason).toContain("outside");
    }
    expect(parseDescription("cotton poplin, need 300 m, 600").draft.gsm).toBeUndefined();
  });
  it("never overrides explicit GSM or repairs explicit ranges/conflicts with bare numbers", () => {
    for (const weight of ["GSM: 150", "150 gsm", "130–150 gsm", "130 gsm and 150 gsm"]) {
      const line = parseDescription(`cotton poplin, 58 inches, need 300 m, ${weight}, 140`);
      expect(line.sourceEvidence?.some(item => item.field === "gsm" && item.kind === "inferred")).toBe(false);
      expect(line.draft.gsm).toBe(weight.includes("–") || weight.includes("and") ? undefined : 150);
    }
  });
  it.each([
    "130% cotton", "130 percent cotton", "65/35 poly cotton", "count 130s", "count 130 or 140", "yarn count 130 x 130",
    "EPI 130", "130 PPI", "3/1 twill", "20x20/52x48", "width 130", "dimensions 130 x 58", "130 cm",
    "₹130/m", "130/m", "130 per metre", "target price 130", "INR 130/m", "rate 130", "2026-11-20", "20 Nov 2026", "November 20, 2026", "Nov 20, 26", "MOQ 130", "stock 130", "stock 100 or 130", "stock 100 m, 130", "sample 130", "swatch 130", "130 wide", "-130",
    "navy 130", "colour splits: teal 130", "500 kg", "130 rolls", "130 pieces", "tolerance ±130", "Article FAB-130", "delivery 130",
  ])("does not reuse numbers from protected specifications: %s", fragment => {
    const line = parseDescription(`cotton poplin, 58 inches, need 300 m, ${fragment}`);
    expect(line.draft.gsm).toBeUndefined();
    expect(line.sourceEvidence?.some(item => item.kind === "inferred")).toBe(false);
  });
  it.each(["130 GLM", "130 oz"])("converts supported non-GSM weight without treating as unlabelled inference: %s", fragment => {
    const line = parseDescription(`cotton poplin, 58 inches, need 300 m, ${fragment}`);
    expect(line.draft.gsm).toBeDefined();
    expect(line.sourceEvidence?.some(item => item.reason?.includes("unlabeled number"))).toBe(false);
  });
  it("persists classification and marks edited inference as historical at submission", () => {
    const line = parseDescription(source);
    const data = lineDraft(line);
    const payload = batchInquirySchema.parse({ ...wovenProductionPayload, ...data, fabricState: "rfd" });
    expect(payload.extractionEvidence).toContainEqual(expect.objectContaining({ field: "gsm", kind: "inferred", value: 130, applied: true }));
    line.draft.gsm = 135;
    const edited = batchInquirySchema.parse({ ...wovenProductionPayload, ...lineDraft(line), fabricState: "rfd" });
    expect(edited.gsm).toBe(135);
    expect(edited.extractionEvidence).toContainEqual(expect.objectContaining({ field: "gsm", kind: "inferred", value: 130, applied: false }));
    expect(edited.additionalSpecs).toContain("buyer edited");
    expect(evidenceSchema.safeParse({ field: "gsm", text: "130", start: 0, end: 3 }).success).toBe(true);
  });
});
