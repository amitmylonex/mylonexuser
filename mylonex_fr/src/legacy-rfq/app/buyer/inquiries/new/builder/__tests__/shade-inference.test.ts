import { describe, expect, it } from "vitest";
import { parsePlainDescription, parseText } from "../parse-text";
import { lineDraft, missingRequired } from "../draft";
import { inferFabricStateFromShade } from "../shade-inference";

describe("Requested fabric shade to Dyed inference connection", () => {
  it("infers and selects Dyed when requested fabric shade exists and fabric state is unset", () => {
    const line = parsePlainDescription("100% Cotton poplin, 58 inches, 2000m. Navy blue.");
    expect(line.colours).toHaveLength(1);
    expect(line.colours[0].name.toLowerCase()).toBe("navy blue");
    expect(line.draft.fabricState).toBe("dyed");
    expect(line.fabricStateInferred).toBe(true);
    expect(missingRequired(line)).not.toContain("fabric state");
  });

  it("infers and selects Dyed for multiple requested shades", () => {
    const line = parsePlainDescription("Cotton twill, 40s x 40s, 58 inches. Navy 2000m, Black 1500m, Olive 1000m. Total 4500m.");
    expect(line.colours).toHaveLength(3);
    expect(line.draft.fabricState).toBe("dyed");
    expect(line.fabricStateInferred).toBe(true);
    expect(missingRequired(line)).not.toContain("fabric state");
  });

  it("preserves explicit source states (RFD, Greige, Printed, Dyed) without overwriting", () => {
    const rfdLine = parsePlainDescription("100% cotton twill, 58 inches, 2000m, RFD, navy.");
    expect(rfdLine.draft.fabricState).toBe("rfd");
    expect(rfdLine.fabricStateInferred).toBeFalsy();

    const greigeLine = parsePlainDescription("Cotton poplin, 40s x 40s, 58\", 1000m, greige. Blue 500m.");
    expect(greigeLine.draft.fabricState).toBe("greige");
    expect(greigeLine.fabricStateInferred).toBeFalsy();

    const printedLine = parsePlainDescription("Printed blue floral on white ground. 100% cotton lawn, 1000m.");
    expect(printedLine.draft.fabricState).toBe("printed");
    expect(printedLine.fabricStateInferred).toBeFalsy();

    const dyedLine = parsePlainDescription("Dyed navy cotton poplin, 58 inches, 150 GSM, 2000m.");
    expect(dyedLine.draft.fabricState).toBe("dyed");
    expect(dyedLine.fabricStateInferred).toBeFalsy();
  });

  it("excludes yarn colours from triggering fabric state inference", () => {
    // White warp yarn should be treated as yarn descriptor, not fabric shade
    const line = parsePlainDescription("Cotton twill, white warp yarn, 40s x 40s, 58\", 1000m.");
    expect(line.draft.fabricState).toBeUndefined();
    expect(line.fabricStateInferred).toBeFalsy();
    expect(missingRequired(line)).toContain("fabric state");
  });

  it("excludes reference colours and reference swatches from triggering fabric state inference", () => {
    const line = parsePlainDescription("100% cotton poplin, 60 inches, 2000m. Blue reference swatch.");
    expect(line.draft.fabricState).toBeUndefined();
    expect(line.fabricStateInferred).toBeFalsy();
    expect(missingRequired(line)).toContain("fabric state");
  });

  it("excludes future shades for explicitly RFD or Greige fabric", () => {
    const rfdLine = parsePlainDescription("100% cotton twill, 58\", 2000m. RFD fabric; final shade navy after approval.");
    expect(rfdLine.draft.fabricState).toBe("rfd");
    expect(rfdLine.fabricStateInferred).toBeFalsy();
    expect(rfdLine.draft.additionalSpecs).toMatch(/future shade: navy/i);

    const greigeLine = parsePlainDescription("Greige cotton twill, 58\", 2000m. Shade after approval: Black.");
    expect(greigeLine.draft.fabricState).toBe("greige");
    expect(greigeLine.fabricStateInferred).toBeFalsy();
  });

  it("applies the inference strictly to the corresponding fabric line in multi-line RFQs", () => {
    const source = `A) Cotton twill, 40s x 40s, 58 inches, 2000m, navy blue.\nB) Viscose twill, 30s x 30s, 54 inches, 1500m.`;
    const lines = parseText(source);
    expect(lines).toHaveLength(2);

    const [lineA, lineB] = lines;
    // Line A has requested shade
    expect(lineA.colours.some((c) => /navy/i.test(c.name))).toBe(true);
    expect(lineA.draft.fabricState).toBe("dyed");
    expect(lineA.fabricStateInferred).toBe(true);

    // Line B has no colours
    expect(lineB.colours).toHaveLength(0);
    expect(lineB.draft.fabricState).toBeUndefined();
    expect(lineB.fabricStateInferred).toBeFalsy();
  });

  it("preserves manual corrections and buyer-selected states", () => {
    const line = parsePlainDescription("100% Cotton, 58 inches, 2000m, Navy.");
    expect(line.draft.fabricState).toBe("dyed");
    expect(line.fabricStateInferred).toBe(true);

    // Buyer manually selects RFD
    line.draft.fabricState = "rfd";
    line.fabricStateInferred = false;

    // Running inference again must not overwrite the buyer's manual correction
    inferFabricStateFromShade(line);
    expect(line.draft.fabricState).toBe("rfd");
    expect(line.fabricStateInferred).toBe(false);
  });

  it("preserves draft submission behavior and lineDraft projection", () => {
    const line = parsePlainDescription("100% Cotton, 58 inches, 2000m, Navy.");
    const draft = lineDraft(line);
    expect(draft.fabricState).toBe("dyed");
    expect(draft.colorInfo).toBe("Navy");
    expect(draft.colorInfoList).toEqual(["Navy"]);
  });
});
