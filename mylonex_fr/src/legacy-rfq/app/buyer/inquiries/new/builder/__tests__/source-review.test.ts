import { describe, expect, it, vi } from "vitest";
import { parseDescription, parsePlainDescription } from "../parse-text";
import { applySourceChanges, canEditTextSource, rereadSource, sourceChanges, sourceSelectionSignature } from "../source-review";
import { lineDraft, missingRequired, duplicateLine, newLine } from "../draft";
import { updateBlend } from "../blend-state";
import { imageTextLine } from "../image-text-line";
import { parseSheet } from "../parse-sheet";

const original = '100% cotton poplin, 130 gsm, 58 inches, RFD, 500 m, ready stock; end use: Shirting';
const updated = '100% polyester twill, 220 gsm, 60 inches, dyed, 900 m, made to order; end use: Uniform';
describe("per-draft pasted source review", () => {
  it("re-reads one draft locally and leaves all current fields, IDs and other drafts unchanged", () => {
    const first = parsePlainDescription(original), other = parsePlainDescription("100% linen, 150 gsm");
    const before = structuredClone([first, other]);
    const fetch = vi.spyOn(globalThis, "fetch");
    try {
      const proposal = rereadSource(updated);
      expect(proposal.original).toBe(updated);
      expect(proposal.draft).toMatchObject({ gsm: 220, quantity: 900, width: "60 inches" });
      expect(sourceChanges(first, proposal)).toContainEqual(expect.objectContaining({ key: "gsm", current: "130", proposed: "220" }));
      expect([first, other]).toEqual(before);
      expect(fetch).not.toHaveBeenCalled();
    } finally { fetch.mockRestore(); }
  });
  it("keeps manual fields and related data unless their proposed replacements are selected", () => {
    const current = parsePlainDescription(original);
    current.draft.gsm = 235;
    current.draft.deliveryNotes = "Keep this buyer note";
    current.draft.referenceImageUrls = ["https://example.com/photo.jpg"];
    current.counterSampleCourier = "AWB 456";
    const before = structuredClone(current);
    const confirmed = applySourceChanges(current, rereadSource(updated), ["quantity"]);
    expect(confirmed.id).toBe(current.id);
    expect(confirmed.original).toBe(updated);
    expect(confirmed.draft).toMatchObject({ gsm: 235, quantity: 900, width: "58 inches", deliveryNotes: "Keep this buyer note", referenceImageUrls: current.draft.referenceImageUrls });
    expect(confirmed.counterSampleCourier).toBe("AWB 456");
    expect(confirmed.blend).toBe(current.blend);
    expect(current).toEqual(before);
    expect(confirmed.sourceEvidence).toContainEqual(expect.objectContaining({ field: "gsm", text: "220 gsm", applied: false }));
    expect(confirmed.sourceEvidence).toContainEqual(expect.objectContaining({ field: "quantity", applied: true }));
    expect(confirmed.warnings.join(" ")).toContain("Current values kept");
    for (const item of confirmed.sourceEvidence ?? []) expect(updated.slice(item.start, item.end)).toBe(item.text);
  });
  it("allows explicit replacement of a manual edit and uses the existing payload mapper", () => {
    const current = parsePlainDescription(original);
    current.draft.gsm = 235;
    const confirmed = applySourceChanges(current, rereadSource(updated), ["gsm", "blend", "fabricState", "endUse"]);
    expect(confirmed.draft.gsm).toBe(220);
    expect(lineDraft(confirmed)).toMatchObject({ pureFiber: "Polyester", gsm: 220, fabricState: "dyed", endUse: "Uniform" });
    expect(lineDraft(confirmed).additionalSpecs).toContain(updated);
    expect(lineDraft(confirmed).additionalSpecs).not.toContain(`Original description: ${original}`);
  });
  it("compares fibre rows and colours by values instead of regenerated IDs", () => {
    const current = updateBlend(parsePlainDescription(original), [{ id: "manual", fibre: "Silk", percentage: "100" }]);
    const proposal = rereadSource(original);
    expect(sourceChanges(current, proposal)).toContainEqual(expect.objectContaining({ key: "blend", current: "100% Silk", proposed: "100% Cotton" }));
    expect(applySourceChanges(current, proposal, []).blendRows).toEqual(current.blendRows);
    const colour = parsePlainDescription("blue 500m, RFD");
    const duplicate = duplicateLine(colour);
    expect(sourceChanges(colour, duplicate)).toEqual([]);
  });
  it("preserves swatches, notes and counter-sample choices when accepting updated colours", () => {
    const current = parsePlainDescription("blue 500m, RFD");
    const selectedBeforeUpload = sourceSelectionSignature(current, "colours");
    current.colours[0].swatchUrl = "https://example.com/swatch.jpg";
    expect(sourceSelectionSignature(current, "colours")).not.toBe(selectedBeforeUpload);
    current.counterSamplePreference = "closest";
    current.unsureColours = true;
    const confirmed = applySourceChanges(current, rereadSource("blue 200m, black 300m, RFD"), ["colours"]);
    expect(confirmed.colours[0]).toMatchObject({ id: current.colours[0].id, metres: "200", swatchUrl: "https://example.com/swatch.jpg" });
    expect(confirmed.colours[1]).toMatchObject({ name: "Black", metres: "300" });
    expect(confirmed.counterSamplePreference).toBe("closest"); expect(confirmed.unsureColours).toBe(true);
  });
  it("can confirm source only, or explicitly clear a field the new source does not establish", () => {
    const current = parsePlainDescription(original), proposal = rereadSource("cotton poplin");
    const kept = applySourceChanges(current, proposal, []);
    expect(kept.draft).toEqual(current.draft); expect(kept.original).toBe("cotton poplin");
    const cleared = applySourceChanges(current, proposal, ["gsm"]);
    expect(cleared.draft.gsm).toBeUndefined(); expect(missingRequired(cleared)).toContain("GSM");
  });
  it("rejects empty or oversized source without touching a current draft", () => {
    expect(() => rereadSource(" \n ")).toThrow("Enter source text");
    expect(() => rereadSource("a".repeat(32001))).toThrow("32,000");
  });
  it("offers editing on new and previously saved plain-text imports only", () => {
    expect(canEditTextSource(parsePlainDescription(original))).toBe(true);
    expect(canEditTextSource(parseDescription(original))).toBe(true); // legacy pasted draft
    expect(canEditTextSource({ ...parsePlainDescription(original), voiceSourceId: crypto.randomUUID() })).toBe(false);
    expect(canEditTextSource(newLine())).toBe(false);
    expect(canEditTextSource(imageTextLine(original))).toBe(false);
    const sheet = parseSheet(new TextEncoder().encode("Blend,GSM\n100% Cotton,130").buffer, "fabrics.csv")[0];
    expect(canEditTextSource(sheet)).toBe(false);
  });
});
