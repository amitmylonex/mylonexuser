import { describe, expect, it } from "vitest";
import { parseText } from "../parse-text";

describe("honeycomb and waffle cases", () => {
  it("case 1: Need honeycomb fabric -> recognize Honeycomb", () => {
    const [line] = parseText("Please quote 100% cotton, 150 GSM, 58 inches, Need honeycomb fabric, 2000 m.");
    expect(line.draft.weaveType?.toLowerCase()).toBe("honeycomb");
    expect(line.warnings.join(" ")).not.toMatch(/conflicting weave/);
  });

  it("case 2: Need waffle fabric -> recognize Waffle", () => {
    const [line] = parseText("Please quote 100% cotton, 150 GSM, 58 inches, Need waffle fabric, 2000 m.");
    expect(line.draft.weaveType?.toLowerCase()).toBe("waffle");
    expect(line.warnings.join(" ")).not.toMatch(/conflicting weave/);
  });

  it("case 3: Honeycomb, also called waffle -> explanatory equivalent description", () => {
    const [line] = parseText("Please quote 100% cotton, 150 GSM, 58 inches, Honeycomb, also called waffle, 2000 m.");
    expect(line.draft.weaveType?.toLowerCase()).toBe("honeycomb");
    expect(line.draft.additionalSpecs).toMatch(/also called Waffle/i);
    expect(line.warnings.join(" ")).not.toMatch(/conflicting weave/);
  });

  it("case 4: Honeycomb or waffle; not decided -> unresolved alternatives", () => {
    const [line] = parseText("Please quote 100% cotton, 150 GSM, 58 inches, Honeycomb or waffle; not decided, 2000 m.");
    expect(line.draft.weaveType).toBeUndefined();
    expect(line.weaveAlternatives).toEqual(["Honeycomb", "Waffle"]);
    expect(line.warnings.join(" ")).toMatch(/Weave alternatives awaiting selection/i);
    expect(line.warnings.join(" ")).not.toMatch(/conflicting weave/);
  });

  it("case 5: Need honeycomb, not waffle -> Honeycomb requested, Waffle excluded", () => {
    const [line] = parseText("Please quote 100% cotton, 150 GSM, 58 inches, Need honeycomb, not waffle, 2000 m.");
    expect(line.draft.weaveType?.toLowerCase()).toBe("honeycomb");
    expect(line.weaveExclusions).toEqual(["Waffle"]);
    expect(line.draft.additionalSpecs).toMatch(/Weave exclusion:\s*No Waffle/i);
    expect(line.warnings.join(" ")).not.toMatch(/conflicting weave/);
  });

  it("current example: buyer alternatives awaiting selection without conflicting warning", () => {
    const [line] = parseText(
      "Please quote 100% cotton, 150 GSM, 58 inches, white, 2000 metres. We are deciding between honeycomb and waffle. Send both swatches; do not select either structure yet."
    );
    expect(line.draft.weaveType).toBeUndefined();
    expect(line.weaveAlternatives).toEqual(["Honeycomb", "Waffle"]);
    expect(line.warnings.join(" ")).toMatch(/Weave alternatives awaiting selection/i);
    expect(line.warnings.join(" ")).not.toMatch(/conflicting weave/);
    expect(line.draft.additionalSpecs).toMatch(/swatches/i);
  });
});
