import { describe, expect, it } from "vitest";
import { imageTextLine } from "../image-text-line";
import { lineDraft, missingRequired, newLine } from "../draft";
import { blendState } from "../blend-state";

export const photoText = "Original/reference: 55% silk / 45% rayon.\nWe need: 55% polyester / 45% rayon.\nSuggest suitable replacements for silk.\n[unclear: linen or like], Bemberg with Rayon.\nSend production price for both options.";
describe("reviewed image text → one current RFQ line", () => {
  it("maps the requested blend and retains reference, uncertain suggestions and pricing in notes", () => {
    const line = imageTextLine(photoText);
    // Rayon is preserved as stated; it does not establish the specific viscose process.
    expect(blendState(line).rows.map(row => [row.fibre, row.percentage])).toEqual([["Polyester", "55"], ["Rayon", "45"]]);
    expect(line.draft.deliveryNotes).toBe(photoText);
    expect(line.original).toBe(photoText);
    expect(missingRequired(line)).toEqual(["GSM", "weave", "width", "fabric state", "quantity", "production cycle"]);
    expect(line.count).toBe(""); expect(line.construction).toBe(""); expect(line.colours).toEqual([]);
    expect(line.draft.requiredDeliveryDate).toBeUndefined(); expect(line.draft.targetPriceMax).toBeUndefined();
    expect(line.draft.referenceImageUrls).toBeUndefined();
    expect(line.warnings.join()).toContain("handwriting");
    expect(lineDraft(line).blendComposition).not.toContain("Silk");
  });
  it("uses the edited text and never stale image extraction fields", () => {
    const line = imageTextLine(photoText.replace("55% polyester / 45% rayon", "60% polyester / 40% rayon") + "\nRequested blend: 60% polyester / 40% rayon; GSM: 175; width: 60 inches; 2000 m; RFD; plain weave; ready stock");
    expect(line.draft).toMatchObject({ gsm: 175, width: "60 inches", quantity: 2000, fabricState: "rfd", weaveType: "Plain", productionCycle: "ready_stock" });
    expect(line.blend).toContain("60% Polyester"); expect(line.blend).not.toContain("55%");
  });
  it("does not map an original-only blend or a tentative alternative", () => {
    expect(imageTextLine("Original: 55% silk / 45% rayon\nSuggest 55% linen / 45% rayon instead").blend).toBe("");
    expect(imageTextLine("Suggest 55% polyester / 45% rayon as an alternative").blend).toBe("");
  });
  it("keeps same-line original and requested compositions distinct", () => {
    const line = imageTextLine("Original 55% silk / 45% rayon but we need 55% polyester / 45% rayon");
    expect(line.blend).toContain("55% Polyester"); expect(line.blend).not.toContain("Silk");
  });
  it("leaves uncertainty, ranges, unitless values and inferred measurements blank", () => {
    const line = imageTextLine("55% polyester / 45% rayon; 58 inches; 3000 m; 150\nGSM: [unclear: 180]\nWeave: twill?\nWidth correction: [unclear]");
    expect(line.draft.gsm).toBeUndefined(); expect(line.draft.width).toBeUndefined(); expect(line.draft.weaveType).toBeUndefined();
    expect(line.draft.quantity).toBe(3000);
    expect(imageTextLine("100% Cotton, 58 inches, 3000 m, 150").draft.gsm).toBeUndefined();
    expect(imageTextLine("100% Cotton; GSM 150-180; width 58; need 2000").draft.gsm).toBeUndefined();
    expect(imageTextLine("100% Cotton; GSM 150-180; width 58; need 2000").draft.quantity).toBeUndefined();
  });
  it("maps explicit count, construction, finish, delivery and target price using existing fields", () => {
    const line = imageTextLine("100% Cotton; count: 40s x 40s; construction: 110 x 70; soft finish; deliver by 2027-03-20; target price: INR 95/m");
    expect(line.count).toBe("40s × 40s"); expect(line.construction).toBe("110 × 70"); expect(line.finish).toBe("soft finish");
    expect(line.draft.requiredDeliveryDate).toBe("2027-03-20"); expect(line.draft.targetPriceMax).toBe(95);
  });
  it("creates fresh IDs without mutating buyer lines or adding attachments", () => {
    const existing = newLine(); existing.draft.gsm = 200; const snapshot = structuredClone(existing);
    const first = imageTextLine(photoText), second = imageTextLine(photoText);
    expect(first.id).not.toBe(second.id); expect(existing).toEqual(snapshot);
    expect(lineDraft(first).referenceImageUrls).toBeUndefined();
  });
  it("retains unfamiliar explicit weave/finish wording without filling an unreadable correction or guessing PPI", () => {
    const line = imageTextLine("100% Cotton; weave: supplier honeycomb; finish: silicone; EPI 110 PPL 70; deliver by 2027-99-99");
    expect(line.draft.weaveType).toBe("supplier honeycomb"); expect(line.finish).toBe("silicone");
    expect(line.construction).toBe(""); expect(line.draft.requiredDeliveryDate).toBeUndefined();
    const correction = imageTextLine("100% Cotton; GSM 180; width 58 inches; correction [unclear]");
    expect(correction.blend).toBe(""); expect(correction.draft.gsm).toBeUndefined(); expect(correction.draft.width).toBeUndefined();
  });
  it("keeps long context intact and rejects empty or oversized reviewed text", () => {
    const text = "Suggest a suitable silk replacement. ".repeat(40);
    const line = imageTextLine(text);
    expect(line.draft.deliveryNotes).toBe(text.trim()); expect(line.original).toBe(text.trim());
    expect(line.warnings.join()).toContain("Shorten");
    expect(() => imageTextLine(" ")).toThrow(); expect(() => imageTextLine("a".repeat(16001))).toThrow();
  });
});
