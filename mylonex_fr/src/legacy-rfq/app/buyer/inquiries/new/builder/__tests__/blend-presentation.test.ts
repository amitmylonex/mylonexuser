import { describe, expect, it } from "vitest";
import { readRequirements } from "../read-requirements";
import { lineDraft, missingRequired } from "../draft";
import { blendState } from "../blend-state";
import { parseText } from "../parse-text";
import { detectSourcingAlternatives, analyzeAlternativesComposition, validateAlternatives } from "../../../../../../src/domains/rfq/text/alternatives";
import { updateLineAlternatives } from "../alternatives-actions";

describe("simplified blend presentation & direct editable composition", () => {
  it("populates '100% cotton' directly into Cotton / 100 in editable rows", async () => {
    const input = '100% cotton, 60" width, 200 gsm, Plain, 5000m';
    const [line] = await readRequirements(input, false);
    expect(line.blend).toBe("100% Cotton");
    expect(line.blendRows).toEqual([
      expect.objectContaining({ fibre: "Cotton", percentage: "100" }),
    ]);
    const state = blendState(line);
    expect(state.state).toBe("complete");
    expect(missingRequired(line)).not.toContain("blend");
  });

  it("populates '65% polyester 35% viscose' directly into two editable rows", async () => {
    const input = '65% polyester 35% viscose, 58" width, 220 gsm, Twill, 3000m';
    const [line] = await readRequirements(input, false);
    expect(line.blendRows).toEqual([
      expect.objectContaining({ fibre: "Polyester", percentage: "65" }),
      expect.objectContaining({ fibre: "Viscose", percentage: "35" }),
    ]);
    const state = blendState(line);
    expect(state.state).toBe("complete");
    expect(missingRequired(line)).not.toContain("blend");
  });

  it("organic-cotton/BCI alternatives populate compact alternative rows without reducing to generic Cotton", async () => {
    const input = `A) 16 OE / 16 OE   96 / 60, 65" greige width, 2/2 Matty (OL)
Qty 4000m
OPTION 1: 100% organic cotton
OPTION 2: BCI cotton`;
    const [line] = await readRequirements(input, false);
    // Not reduced to generic "Cotton"
    expect(line.blend).toBe("");
    expect(line.sourcingAlternatives).toHaveLength(2);
    expect(line.sourcingAlternatives?.[0]).toMatchObject({
      label: "Alternative 1",
      description: "Organic cotton",
      percentage: "100",
      fibre: "Cotton",
    });
    expect(line.sourcingAlternatives?.[1]).toMatchObject({
      label: "Alternative 2",
      description: "BCI cotton",
      percentage: "",
      fibre: "Cotton",
    });

    // Required Blend is marked incomplete because Alternative 2 percentage is unstated
    expect(missingRequired(line)).toContain("blend");
    const val = validateAlternatives(line.sourcingAlternatives!);
    expect(val.state).toBe("prompt");

    // Retains both alternatives in Notes / additionalSpecs
    expect(line.draft.additionalSpecs).toContain("OPTION 1: 100% organic cotton");
    expect(line.draft.additionalSpecs).toContain("OPTION 2: BCI cotton");
    // Does not convert alternative into simultaneous certification requirement
    expect(line.draft.additionalSpecs).not.toContain("Organic requirement: 100% organic cotton");
  });

  it("allows editing each alternative and confirms blend when both reach 100%", async () => {
    const input = `A) 16 OE / 16 OE   96 / 60, 65" greige width, 2/2 Matty (OL)
Qty 4000m
OPTION 1: 100% organic cotton
OPTION 2: BCI cotton`;
    const [line] = await readRequirements(input, false);
    // User fills 100% for Alternative 2
    const updatedAlts = [
      line.sourcingAlternatives![0],
      { ...line.sourcingAlternatives![1], percentage: "100" },
    ];
    const updated = updateLineAlternatives(line, updatedAlts);
    expect(validateAlternatives(updated.sourcingAlternatives!).state).toBe("complete");
    expect(missingRequired(updated)).not.toContain("blend");

    // Submission mapping preserves confirmed pure Cotton fibre and notes
    const draft = lineDraft(updated);
    expect(draft.pureFiber).toBe("Cotton");
    expect(draft.materialType).toBe("pure");
    expect(draft.additionalSpecs).toContain("Alternative 1: 100% Organic cotton");
    expect(draft.additionalSpecs).toContain("Alternative 2: 100% BCI cotton");
  });

  it("flags missing entries when opening phrase mentions 3 separate qualities but only 1 fabric is supplied", () => {
    const input = `3 separate qualities:
A) 16 OE / 16 OE   96 / 60, 65" greige width, 2/2 Matty (OL)
Qty 4000m
OPTION 1: 100% organic cotton
OPTION 2: BCI cotton`;
    const lines = parseText(input);
    // Does NOT invent 2 empty qualities
    expect(lines).toHaveLength(1);
    expect(lines[0].warnings).toContain(
      "Source mentions 3 separate qualities, but only 1 fabric was supplied. Review for missing entries."
    );
  });

  it("does not merge different-composition alternatives into competing blends", async () => {
    const input = `Fabric requirement
OPTION 1: 100% cotton
OPTION 2: 100% polyester`;
    const [line] = await readRequirements(input, false);
    // Does NOT merge into "100% Cotton / 100% Polyester"
    expect(line.blend).toBe("");
    expect(line.sourcingAlternatives).toHaveLength(2);
    expect(missingRequired(line)).toContain("blend");
  });

  it("analyzeAlternativesComposition correctly identifies common fibre and conflicts", () => {
    const sameFibreDiffPct = detectSourcingAlternatives("OPTION 1: 100% organic cotton\nOPTION 2: BCI cotton");
    expect(analyzeAlternativesComposition(sameFibreDiffPct)).toEqual({
      commonFibre: "Cotton",
      commonPercentage: undefined,
      conflict: false,
      alts: [
        { fibre: "Cotton", percentage: "100" },
        { fibre: "Cotton", percentage: "" },
      ],
    });

    const diffFibres = detectSourcingAlternatives("OPTION 1: 100% cotton\nOPTION 2: 100% polyester");
    expect(analyzeAlternativesComposition(diffFibres).conflict).toBe(true);

    const sameFibresSamePct = detectSourcingAlternatives("OPTION 1: 100% cotton\nOPTION 2: 100% BCI cotton");
    expect(analyzeAlternativesComposition(sameFibresSamePct)).toEqual({
      commonFibre: "Cotton",
      commonPercentage: "100",
      conflict: false,
      alts: [
        { fibre: "Cotton", percentage: "100" },
        { fibre: "Cotton", percentage: "100" },
      ],
    });
  });
});
