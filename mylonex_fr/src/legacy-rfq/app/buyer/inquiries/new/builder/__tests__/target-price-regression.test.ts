import { describe, expect, it } from "vitest";
import { parseText } from "../parse-text";
import { lineDraft } from "../draft";

export const EXACT_USER_INPUT = `100% lyocell, 30’s × 30’s - 104 × 70
2/1 twill
145 gsm
63" greige / 58" finished cuttable
Dyed, enzyme washed

1000 (M) per colour:
sage / beige / charcoal / navy / black
Total 5000 metres
Running production, estimated 25 days

Indicative target @289/-.
Price basis not specified yet.
Please send matching shade swatches.`;

describe("Target price and plain-text extraction regression", () => {
  it("reproduces the exact user inquiry into exactly one draft with all fields preserved", () => {
    const lines = parseText(EXACT_USER_INPUT);
    expect(lines).toHaveLength(1);
    const [line] = lines;

    // Fibre: generic Lyocell preserved; NOT relabeled as branded Tencel
    expect(line.blend).toMatch(/100%\s+Lyocell/i);
    expect(line.blend).not.toMatch(/Tencel/i);
    expect(line.blendRows?.[0]?.fibre).toBe("Lyocell");
    expect(line.blendRows?.[0]?.percentage).toBe("100");

    // Technical specifications
    expect(line.count).toMatch(/30['’]?s?\s*[×x*]\s*30['’]?s?/i);
    expect(line.construction).toMatch(/104\s*[×x*]\s*70/i);
    expect(line.draft.weaveType).toMatch(/2\/1\s*twill/i);
    expect(line.draft.gsm).toBe(145);

    // Width: 58 inches finished cuttable populated; 63 inches greige preserved separately
    expect(line.draft.width).toBe("58 inches");
    expect(line.widthBasis).toBe("finished");
    expect(line.draft.additionalSpecs).toMatch(/Stated width:\s*63\s*inches\s*·\s*Greige width/i);

    // Fabric state & finish
    expect(line.draft.fabricState).toBe("dyed");
    expect(line.finish.toLowerCase()).toMatch(/enzyme\s*wash/i);

    // Quantity & Colours: 5 colours × 1000m = 5000m
    expect(line.draft.quantity).toBe(5000);
    expect(line.colours).toHaveLength(5);
    const colourNames = line.colours.map(c => c.name.toLowerCase());
    expect(colourNames).toEqual(expect.arrayContaining(["sage", "beige", "charcoal", "navy", "black"]));
    expect(line.colours.every(c => c.metres === "1000")).toBe(true);

    // Production cycle & timeline
    expect(line.draft.productionCycle).toBe("running_production");
    expect(line.draft.requiredDeliveryDate).toBeUndefined(); // no invented calendar date
    expect(line.draft.additionalSpecs).toMatch(/25\s*days/i);

    // Target price interpretation:
    // Amount: 289
    // Purpose: target price
    // Qualifier: indicative
    // Pricing basis: unspecified
    expect(line.targetPriceAmount).toBe(289);
    expect(line.targetPriceBasis).toBe("unspecified");
    expect(line.targetPriceQualifier).toMatch(/indicative/i);
    expect(line.targetPriceQualifier).toMatch(/price basis not specified/i);
    // Not silently submitted as ₹289/m without confirmation
    expect(line.draft.targetPriceMax).toBeUndefined();

    // Notes and swatch request preserved
    expect(line.draft.additionalSpecs).toMatch(/swatch/i);
  });

  it("distinguishes price notation variants: @289/-, @ 289 /-, Target @289/-", () => {
    for (const phrase of ["Indicative target @289/-.", "target @ 289 /-", "@289/-", "target price @289/-"]) {
      const [line] = parseText(`100% cotton poplin, 58", 3000m\n${phrase}\nPrice basis not specified yet.`);
      expect(line.targetPriceAmount).toBe(289);
      expect(line.targetPriceBasis).toBe("unspecified");
      expect(line.draft.targetPriceMax).toBeUndefined();
    }
  });

  it("autofills explicit ₹/m prices directly into draft.targetPriceMax", () => {
    const [line1] = parseText("100% cotton poplin, 58\", 3000m\nBudget ₹289 per metre");
    expect(line1.targetPriceAmount).toBe(289);
    expect(line1.targetPriceBasis).toBe("per_metre");
    expect(line1.draft.targetPriceMax).toBe(289);

    const [line2] = parseText("100% cotton poplin, 58\", 3000m\nBelow INR 285 per metre");
    expect(line2.targetPriceAmount).toBe(285);
    expect(line2.targetPriceBasis).toBe("per_metre");
    expect(line2.draft.targetPriceMax).toBe(285);
    expect(line2.targetPriceQualifier).toMatch(/Below ₹285\/m/i);
  });

  it("never converts ₹420/kg into ₹/m", () => {
    const [line] = parseText("100% cotton single jersey, 180 gsm, 5000m\nTarget price ₹420/kg");
    expect(line.targetPriceAmount).toBe(420);
    expect(line.targetPriceBasis).toBe("per_kg");
    expect(line.draft.targetPriceMax).toBeUndefined(); // never becomes ₹/m
    expect(line.draft.additionalSpecs).toMatch(/₹420\/kg/i);
  });

  it("explicit 'basis not specified' overrides any contextual assumption of per metre", () => {
    const [line] = parseText("100% cotton poplin, 58\", 3000m\nTarget ₹289. Price basis not specified yet.");
    expect(line.targetPriceAmount).toBe(289);
    expect(line.targetPriceBasis).toBe("unspecified");
    expect(line.draft.targetPriceMax).toBeUndefined();
  });

  it("mapping: confirming per metre maps correctly to the existing targetPriceMax field", () => {
    const [line] = parseText(EXACT_USER_INPUT);
    expect(line.draft.targetPriceMax).toBeUndefined();

    // Buyer confirms basis as per metre in the builder
    line.draft.targetPriceMax = line.targetPriceAmount;
    line.targetPriceBasis = "per_metre";

    const submissionDraft = lineDraft(line);
    expect(submissionDraft.targetPriceMax).toBe(289);
  });
});
