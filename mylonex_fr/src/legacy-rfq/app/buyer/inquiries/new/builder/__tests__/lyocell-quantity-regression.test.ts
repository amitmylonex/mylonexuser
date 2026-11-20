import { describe, expect, it } from "vitest";
import { readRequirements } from "../read-requirements";
import { assessLineReadiness } from "../readiness";
import { lineDraft, missingRequired } from "../draft";
import { parseText } from "../parse-text";

describe("Lyocell Normalization & Quantity Breakdown Regressions", () => {
  const EXACT_FAILING_INPUT =
    'Need 100% lyocel dyed twill, 30s × 30s / 104 × 70, 145 GSM, 58" finished width. Black 800 m, sage 600 m, dusty pink 600 m. Total requirement 2,000 meters. Same quality in all three shades.';

  it("satisfies the exact failing input with local extraction alone (Regression Case A)", async () => {
    const lines = await readRequirements(EXACT_FAILING_INPUT, false);
    expect(lines).toHaveLength(1);
    const line = lines[0];

    // Blend: Lyocell 100%
    expect(line.blend).toBe("100% Lyocell");
    expect(line.blendRows).toEqual([
      expect.objectContaining({ fibre: "Lyocell", percentage: "100" }),
    ]);

    // Weave: Twill
    expect(line.draft.weaveType?.toLowerCase()).toBe("twill");

    // Count & Construction: 30s × 30s / 104 × 70
    expect(line.count).toBe("30s × 30s");
    expect(line.construction).toBe("104 × 70");

    // GSM: 145
    expect(line.draft.gsm).toBe(145);

    // Width: 58 inches; finished width
    expect(line.draft.width).toBe("58 inches");
    expect(line.widthBasis).toBe("finished");

    // Fabric state: Dyed
    expect(line.draft.fabricState).toBe("dyed");

    // Quantity: 2000 metres (consistent with breakdown 800 + 600 + 600)
    expect(line.draft.quantity).toBe(2000);

    // Colours and individual colour quantities preserved
    expect(line.colours).toHaveLength(3);
    const black = line.colours.find(c => c.name.toLowerCase() === "black");
    const sage = line.colours.find(c => c.name.toLowerCase() === "sage");
    const dustyPink = line.colours.find(c => c.name.toLowerCase() === "dusty pink");

    expect(black).toBeDefined();
    expect(black?.metres).toBe("800");

    expect(sage).toBeDefined();
    expect(sage?.metres).toBe("600");

    expect(dustyPink).toBeDefined();
    expect(dustyPink?.metres).toBe("600");

    // No conflicting-total warning or mismatch warning
    expect(line.warnings).not.toContain("Conflicting total quantities; confirm the intended total in metres.");
    expect(line.warnings.some(w => /quantity mismatch/i.test(w))).toBe(false);

    // Production cycle remains blank
    expect(line.draft.productionCycle).toBeUndefined();

    // Required fields: blend and quantity are both fulfilled
    const missing = missingRequired(line);
    expect(missing).not.toContain("blend");
    expect(missing).not.toContain("quantity");

    // Readiness
    const readiness = assessLineReadiness(line);
    expect(readiness.missing).not.toContain("Blend");
    expect(readiness.missing).not.toContain("Quantity");

    // Summary calculation
    const summaryTotal = lines.reduce((sum, l) => sum + (l.draft.quantity || 0), 0);
    expect(summaryTotal).toBe(2000);

    // Draft persistence
    const draft = lineDraft(line);
    expect(draft.quantity).toBe(2000);
    expect(draft.gsm).toBe(145);
    expect(draft.fabricState).toBe("dyed");
  });

  it("yields identical result with correctly spelled 'lyocell' (Regression Case B)", async () => {
    const input =
      'Need 100% lyocell dyed twill, 30s × 30s / 104 × 70, 145 GSM, 58" finished width. Black 800 m, sage 600 m, dusty pink 600 m. Total requirement 2,000 meters. Same quality in all three shades.';
    const [line] = await readRequirements(input, false);

    expect(line.blend).toBe("100% Lyocell");
    expect(line.draft.quantity).toBe(2000);
    expect(line.colours.map(c => ({ name: c.name.toLowerCase(), metres: c.metres }))).toEqual([
      { name: "black", metres: "800" },
      { name: "sage", metres: "600" },
      { name: "dusty pink", metres: "600" },
    ]);
    expect(line.warnings).not.toContain("Conflicting total quantities; confirm the intended total in metres.");
  });

  it("calculates total 2000 m from colour quantities when no explicit total exists (Regression Case C)", async () => {
    const input = "100% lyocel twill. Black 800 m, sage 600 m, dusty pink 600 m.";
    const [line] = await readRequirements(input, false);

    expect(line.blend).toBe("100% Lyocell");
    expect(line.draft.quantity).toBe(2000);
    expect(line.colours).toHaveLength(3);
    expect(line.warnings.some(w => /Total quantity calculated as 2000 m/i.test(w))).toBe(true);
    expect(line.warnings).not.toContain("Conflicting total quantities; confirm the intended total in metres.");
  });

  it("flags discrepancy when explicit total disagrees with colour breakdown (Regression Case D)", async () => {
    const input = "100% lyocell. Black 800 m, sage 600 m, dusty pink 600 m. Total 2500 m.";
    const [line] = await readRequirements(input, false);

    expect(line.draft.quantity).toBeUndefined(); // Stated total conflicts with allocations.
    expect(line.colours.map(c => c.metres)).toEqual(["800", "600", "600"]);
    expect(line.warnings).toContain(
      "Quantity mismatch: colour quantities total 2000 m; explicit total is 2500 m. Both values were preserved."
    );
  });

  it("preserves explicit total 2000 m without treating partial breakdown as a conflict (Regression Case E)", async () => {
    const input = "100% lyocell. Total 2000 m, including black 800 m.";
    const [line] = await readRequirements(input, false);

    expect(line.draft.quantity).toBe(2000);
    expect(line.colours).toHaveLength(1);
    expect(line.colours[0].metres).toBe("800");
    expect(line.warnings.some(w => /quantity mismatch/i.test(w))).toBe(false);
    expect(line.warnings).not.toContain("Conflicting total quantities; confirm the intended total in metres.");
  });

  it("extracts total 2400 m for 1200 m per colour and explicit total (Regression Case F)", async () => {
    const input = "100% lyocell. Navy and olive, 1200 m per col, total 2400 m.";
    const [line] = await readRequirements(input, false);

    expect(line.draft.quantity).toBe(2400);
    expect(line.colours).toHaveLength(2);
    expect(line.colours.every(c => c.metres === "1200")).toBe(true);
    expect(line.warnings.some(w => /quantity mismatch/i.test(w))).toBe(false);
    expect(line.warnings).not.toContain("Conflicting total quantities; confirm the intended total in metres.");
  });

  it("supports '80% lyocel / 20% linen. Require 2.5K mtrs.' (Regression Case G)", async () => {
    const input = "80% lyocel / 20% linen. Require 2.5K mtrs.";
    const [line] = await readRequirements(input, false);

    expect(line.blend).toBe("80% Lyocell 20% Linen");
    expect(line.blendRows).toEqual([
      expect.objectContaining({ fibre: "Lyocell", percentage: "80" }),
      expect.objectContaining({ fibre: "Linen", percentage: "20" }),
    ]);
    expect(line.draft.quantity).toBe(2500);
  });

  it("keeps totals, colours, and blends isolated across multiple fabrics (Regression Case H)", async () => {
    const input = `1. 100% lyocel twill, black 800m, sage 600m, total 1400m.
2. 100% cotton poplin, navy 1000m, olive 1000m, total 2000m.`;
    const lines = await readRequirements(input, false);
    expect(lines).toHaveLength(2);

    const [fab1, fab2] = lines;
    expect(fab1.blend).toBe("100% Lyocell");
    expect(fab1.draft.quantity).toBe(1400);
    expect(fab1.colours.map(c => ({ name: c.name.toLowerCase(), metres: c.metres }))).toEqual([
      { name: "black", metres: "800" },
      { name: "sage", metres: "600" },
    ]);

    expect(fab2.blend).toBe("100% Cotton");
    expect(fab2.draft.quantity).toBe(2000);
    expect(fab2.colours.map(c => ({ name: c.name.toLowerCase(), metres: c.metres }))).toEqual([
      { name: "navy", metres: "1000" },
      { name: "olive", metres: "1000" },
    ]);
  });

  describe("Fibre notation variants and modifier isolation", () => {
    it.each([
      ["100% lyocel", "100% Lyocell"],
      ["100 % lyocell", "100% Lyocell"],
      ["lyocell 100%", "100% Lyocell"],
      ["100% lyocel dyed twill", "100% Lyocell"],
      ["80% lyocel / 20% linen", "80% Lyocell 20% Linen"],
    ])("recognizes '%s' as '%s' without incorporating adjacent weave/state words", (input, expected) => {
      const lines = parseText(input);
      expect(lines[0].blend).toBe(expected);
      expect(lines[0].blendRows?.[0]?.fibre).toBe("Lyocell");
      expect(lines[0].fibreQualifiers || []).toEqual([]);
    });

    it("does not invent percentages when none are provided", () => {
      const lines = parseText("Lyocel twill, 145 GSM, 58 inches");
      expect(lines[0].blend).toBe("Lyocell");
      expect(lines[0].compositionUncertain).toBe(true);
      expect(lines[0].warnings.some(w => /Confirm fibre percentages/i.test(w))).toBe(true);
    });
  });

  describe("Preserving manual edits and clearing stale warnings", () => {
    it("preserves manually edited quantity and blend", async () => {
      const lines = parseText(EXACT_FAILING_INPUT);
      expect(lines[0].draft.quantity).toBe(2000);

      // User manually edits quantity to 3000
      lines[0].draft.quantity = 3000;
      const draft = lineDraft(lines[0]);
      expect(draft.quantity).toBe(3000);
    });
  });
});
