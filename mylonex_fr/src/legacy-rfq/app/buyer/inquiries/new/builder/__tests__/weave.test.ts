import { describe, expect, it } from "vitest";
import { parseDescription, parseText } from "../parse-text";
import { lineDraft } from "../draft";
import { batchInquirySchema } from "../../../../../../src/domains/rfq/batch/schema";
import { wovenProductionPayload } from "../../../../../../src/domains/rfq/__tests__/fixtures";

describe("pasted weave text reaches RFQ payload", () => {
  it("preserves source whitespace independently of matching", () => {
    const source = "  100% Cotton, RIGHT–HAND   TWILL, 120 gsm, 58 inches  ";
    const [line] = parseText(source);
    expect(line.original).toBe(source);
    expect(line.weaveDetection?.originalText).toBe(source);
    expect(line.draft.weaveType).toBe("RIGHT–HAND   TWILL");
  });
  it("submits exact multiword text through existing validation", () => {
    const original = "100% Cotton, 3x1 TWILL, 120 gsm, 58 inches, rfd, 1000 m, ready stock";
    const line = parseDescription(original);
    expect(line.draft.weaveType).toBe("3x1 TWILL");
    expect(line.original).toBe(original);
    const parsed = batchInquirySchema.parse({ ...wovenProductionPayload, ...lineDraft(line), endUse: "Shirting" });
    expect(parsed.weaveType).toBe("3x1 TWILL");
    expect(parsed.additionalSpecs).toContain("Weave mention: 3x1 TWILL");
  });
  it("keeps unknown candidates unconfirmed until buyer review", () => {
    const line = parseDescription("weave: Zephyrlock; 120 gsm, 58 inches");
    expect(line.draft.weaveType).toBeUndefined();
    expect(line.weaveDetection?.mentions[0].status).toBe("candidate_needs_review");
    expect(line.warnings.join(" ")).toContain("not automatically confirmed");
    line.draft.weaveType = "Zephyrlock"; // Explicit buyer selection/edit.
    const parsed = batchInquirySchema.parse({ ...wovenProductionPayload, weaveType: lineDraft(line).weaveType });
    expect(parsed.weaveType).toBe("Zephyrlock");
  });
  it("retains multiple mentions separately and never silently picks a winner", () => {
    const line = parseDescription("dobby or satin, 120 gsm, 58 inches");
    expect(line.draft.weaveType).toBeUndefined();
    expect(line.weaveDetection?.mentions.map(item => item.matchedTerm)).toEqual(["dobby", "satin"]);
    expect(lineDraft(line).additionalSpecs).toContain("Weave mention: dobby");
    expect(lineDraft(line).additionalSpecs).toContain("Weave mention: satin");
  });
  it("preserves other specs, no weave stays blank, invalid free text is rejected", () => {
    const line = parseDescription("Blend: 65/35 poly-cotton; 2/1 twill, count: 40s x 40s, 120 gsm, 58 inches, colour: blue, finish: peach, rfd, 1000 m, ready stock");
    expect(line.blend).toBe("65% Polyester 35% Cotton");
    expect(line.draft).toMatchObject({ weaveType: "2/1 twill", gsm: 120, width: "58 inches", fabricState: "rfd", quantity: 1000, productionCycle: "ready_stock" });
    expect(line.original).toContain("count: 40s x 40s");
    expect(parseDescription("100% Cotton, 120 gsm, 58 inches").draft.weaveType).toBeUndefined();
    for (const weaveType of ["", " ", "x".repeat(201), "bad\u0000weave"])
      expect(batchInquirySchema.safeParse({ ...wovenProductionPayload, weaveType }).success).toBe(false);
  });
});
