import { describe, expect, it } from "vitest";
import { readRequirements } from "../read-requirements";
import { lineDraft } from "../draft";
import { CARGO_INQUIRY, MATT_INQUIRY } from "../../../../../../src/domains/rfq/weave/__tests__/buyer-followup-fixtures";
import { detectWovenWeaves } from "../../../../../../src/domains/rfq/weave/detect";
import { validateAiExtraction } from "../../../../../../src/domains/rfq/text/ai-validation";
import { reconcileTextDrafts } from "../reconcile-text";
import type { AiFabric } from "../../../../../../src/domains/rfq/text/ai-schema";

describe("exact manual buyer weave failures", () => {
  it.each([[CARGO_INQUIRY, "2/1 Twill Ripstop"], [MATT_INQUIRY, "2/2 Matty"]])("freshly extracts the complete buyer source", async (source, weave) => {
    const lines = await readRequirements(source, false);
    expect(lines).toHaveLength(1);
    const [line] = lines;
    expect(lineDraft(line).weaveType).toBe(weave);
    expect(line.warnings.some(warning => /conflicting weave/i.test(warning))).toBe(false);
    if (source === CARGO_INQUIRY) {
      expect(line.weaveDetection?.mentions.map(mention => [mention.start, mention.end, mention.normalizedTerm])).toEqual([
        [34, 52, "2/1 twill ripstop"], [220, 228, "ripstop"], [236, 243, "ripstop"],
      ]);
      expect(line.draft).toMatchObject({ width: "58 inches", gsm: 185, quantity: 1500, productionCycle: "made_to_order" });
      expect(line.colours.map(colour => [colour.name.toLowerCase(), colour.metres])).toEqual([["olive", "800"], ["charcoal", "700"]]);
      expect(line.count).toBe("40s × 40s");
      expect(line.construction).toBe("133 × 72");
      expect(line.finish).toBe("Peach");
    } else {
      expect(detectWovenWeaves(source).mentions.map(mention => mention.matchedTerm)).toEqual(["MATT 2/2"]);
      expect(line.sourceEvidence).toContainEqual(expect.objectContaining({ field: "exclusion", text: "not want plain weave or 2/1 twill" }));
      expect(line.sourceEvidence?.filter(item => item.field === "width").map(item => item.text)).toEqual(["165.1 cm"]);
      expect(line.draft).toMatchObject({ width: "65 inches", gsm: 220, quantity: 2500, productionCycle: "ready_stock" });
      expect(line.blendRows).toContainEqual(expect.objectContaining({ fibre: "Cotton", percentage: "100" }));
      expect(lineDraft(line).additionalSpecs).toMatch(/recycled cotton/i);
    }
  });
  it.each([[CARGO_INQUIRY, "2/1 Twill Ripstop", "2/1 twill rib-stop"], [MATT_INQUIRY, "2/2 Matty", "MATT 2/2"]])("reconciles canonical AI weave proposals against exact buyer spans", async (source, value, proof) => {
    const local = await readRequirements(source, false);
    const raw: AiFabric = { source, fields: [{ field: "weaveType", value, sourcePhrases: [proof], interpretation: "explicit" }], yarns: [], alternatives: [], issues: [] };
    const validated = validateAiExtraction(source, { fabrics: [raw] }).fabrics;
    const [line] = reconcileTextDrafts(source, local, validated, [raw]);
    expect(line.draft.weaveType).toBe(value);
    expect(line.original).toBe(source);
    expect(line.weaveDetection?.mentions.map(item => item.matchedTerm)).toContain(proof);
    expect(line.textCandidates?.filter(candidate => candidate.field === "weaveType").every(candidate => candidate.status === "accepted")).toBe(true);
    expect(line.draft.width).toBe(local[0].draft.width);
    expect(line.draft.gsm).toBe(local[0].draft.gsm);
    expect(line.draft.quantity).toBe(local[0].draft.quantity);
    expect(lineDraft(line).additionalSpecs).toContain(source === MATT_INQUIRY ? "recycled cotton" : "rib-stop");
  });
  it.each(["Plain or twill; not decided", "2/1 Twill or 3/1 Twill", "Twill or Satin"])("keeps genuine conflicts: %s", async phrase => {
    const [line] = await readRequirements(`Please quote 100% cotton. ${phrase}. Width 165.1 cm, 220 GSM, 2500 m, ready stock.`, false);
    expect(line.draft.weaveType).toBeUndefined();
    expect(line.warnings.join(" ")).toMatch(/conflicting weave/);
  });
  it.each(["Ripstop. Not rib knit.", "2/1 Twill Ripstop. Ripstop means reinforced fabric, not rib knit.",
    "Ripstop, rib-stop and ribstop fabric. Not rib knit."])("keeps earlier positive Ripstop: %s", async phrase => {
    const [line] = await readRequirements(`100% cotton, ${phrase} Width 165.1 cm, 220 GSM, 2500 m, ready stock.`, false);
    expect(line.draft.weaveType).toBe(phrase.startsWith("2/1") ? "2/1 Twill Ripstop" : "Ripstop");
    expect(line.warnings.join(" ")).not.toMatch(/conflicting weave/);
  });
  it.each(["do not want", "don't want", "do not need", "no", "without"])("scopes coordinated negation from %s", async negative => {
    const [line] = await readRequirements(`Please quote 2/2 Matty in 100% cotton. Width 165.1 cm. We ${negative} plain weave or 2/1 twill. Need 2500 m, 220 GSM.`, false);
    expect(line.draft.weaveType).toBe("2/2 Matty");
    expect(line.draft.width).toBe("65 inches");
    expect(line.weaveDetection?.mentions.map(item => item.matchedTerm)).toEqual(["2/2 Matty"]);
  });
  it.each(["165.1 cm", "147.32 cm", "58.5 inches"])("keeps explicit decimal width %s intact through sentence grouping", async width => {
    const lines = await readRequirements(`Please quote 100% cotton, plain weave. Width ${width}. Weight 220 g/m². Need 2500 m. Ready stock.`, false);
    expect(lines).toHaveLength(1);
    expect(lines[0].draft.width).toBe(width === "165.1 cm" ? "65 inches" : width === "147.32 cm" ? "58 inches" : "58.5 inches");
    expect(lines[0].warnings.join(" ")).not.toMatch(/clear unit/);
  });
});
