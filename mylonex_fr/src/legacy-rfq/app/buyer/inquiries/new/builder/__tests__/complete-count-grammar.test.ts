import { describe, expect, it } from "vitest";
import { parsePlainDescription, parseText } from "../parse-text";

const technical = (source: string) => {
  const line = parsePlainDescription(source);
  return { count: line.count, construction: line.construction, weave: line.draft.weaveType, source: line.original, warnings: line.warnings };
};
describe("complete yarn atoms and contextual count/construction relationships", () => {
  const yarns = "20’s P/V (65/35) x 20’s P/V (65/35)";
  it.each([" x ", " ", "\n", " / ", " - "])("separates the density after complete P/V yarns with %j", separator => {
    const source = `${yarns}${separator}100 x 56 x 63” Griege width, 2/2 Twill\nQuantity would be above 5000m`;
    const line = technical(source);
    expect(line).toMatchObject({ count: "20s × 20s", construction: "100 x 56", weave: "2/2 Twill", source });
    expect(line.count).not.toContain("100");
    expect(line.warnings.join(" ")).not.toMatch(/65\/35.*ambiguous|numeric pairs.*65\/35/);
  });
  it("maps line-separated by pairs using the complete cotton fabric context", () => {
    const lines = parseText("100% cotton\n20 by 16\n108 by 56\nNon lycra\nDyed peach finish\n30k mts - 3 colours\nNeed price n delivery");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ count: "20 × 16", construction: "108 × 56" });
    expect(lines[0].draft.weaveType).toBeUndefined();
  });
  it.each([
    ["Count: 80D/72/2 by 80D/72/2; Construction: 132 by 80; Plain", "80D/72/2 × 80D/72/2", "132 × 80"],
    ["2/40's Cotton Combed TFO Knotless × 2/40's Cotton Combed TFO Knotless / 108 × 60; Plain", "2/40's Cotton Combed TFO Knotless × 2/40's Cotton Combed TFO Knotless", "108 × 60"],
    ["16 OE by 16 OE / 96 by 60; 2/2 Matty", "16 OE × 16 OE", "96 × 60"],
    ["20 CCW × 20 CCW - 96 x 48; 3/1 Drill", "20 CCW × 20 CCW", "96 x 48"],
    ["Count: 24s-16s; Construction: 132 by 72; Plain", "24s × 16s", "132 × 72"],
    ["80D/72/2 × 100D/96/2 / 168 x 96; plain weave", "80D/72/2 × 100D/96/2", "168 x 96"],
  ])("retains complete compound/descriptor atoms: %s", (source, count, construction) => {
    expect(technical(source)).toMatchObject({ count, construction, source });
  });
  it("retains a single explicit typed compound atom without inventing a density or ambiguity", () => {
    const line = technical("Count: 80D/72/2; Weave: Plain");
    expect(line.count).toBe("80D/72/2"); expect(line.construction).toBe("");
    expect(line.warnings.join(" ")).not.toMatch(/72\/2.*ambiguous/);
  });
  it.each(["30x30 110x60", "20-30", "20s-30s", "3/1 Drill", "2/2 Matty"])("does not treat insufficient or non-count syntax as a complete specification: %s", source => {
    const line = technical(source);
    expect(line.construction).toBe("");
    expect(line.count).toBe("");
  });
  it.each(["Count: 20s-30s", "Count: 20-30", "Yarn count 20s - 30s; Plain"])("leaves a labelled hyphen ambiguous without a complete construction or directional context: %s", source => {
    const line = technical(source);
    expect(line.count).toBe(""); expect(line.construction).toBe("");
    expect(line.warnings.join(" ")).toMatch(/count pair or a range|Only one directional/);
  });
  it("accepts a labelled count hyphen only when the complete density group supports the pair meaning", () => {
    const line = technical("Count: 24s-16s / 132 by 72; Plain");
    expect(line).toMatchObject({ count: "24s × 16s", construction: "132 × 72" });
  });
  it.each(["Construction: 120x76", "Order qty: 5000m"])("does not absorb the next field through a slash: %s", next => {
    const count = "80D/72/2 x 2/40's Cotton Combed TFO Knotless";
    const line = technical(`Count: ${count} / ${next}`);
    expect(line.count).toBe(count);
    expect(line.count).not.toMatch(/construction|order qty/i);
    if (next.startsWith("Construction")) expect(line.construction).toBe("120x76");
  });
});
