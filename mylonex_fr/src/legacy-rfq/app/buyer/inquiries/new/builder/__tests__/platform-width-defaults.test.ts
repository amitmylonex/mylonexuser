import { describe, expect, it } from "vitest";
import { parsePlainDescription, parseText } from "../parse-text";
import { updateBlend } from "../blend-state";
import { buildBatch, lineIssues } from "../draft";
import { recomputePlatformWidth, applyPlatformWidthDefault } from "../platform-width";
import { batchSubmissionSchema } from "../../../../../../src/domains/rfq/batch/schema";
import { parseSheet } from "../parse-sheet";
import * as XLSX from "xlsx";

describe("Platform Width Defaults Regression Suite (Corrected Business Rules)", () => {
  describe("Combination 1: Finished (Dyed / RFD / Printed) WITHOUT Lycra → 58 inches", () => {
    it("defaults to 58 inches for dyed fabric without Lycra", () => {
      const line = parsePlainDescription("100% cotton, 140 GSM, 1000m, dyed, twill");
      expect(line.draft.width).toBe("58 inches");
      expect(line.widthProvenance).toBe("default");
      expect(line.widthMin).toBe(58);
      expect(line.widthMax).toBe(58);
      expect(line.widthDefaultNote).toBe("Defaulted to 58 inches for Dyed fabric; please review.");
    });

    it("defaults to 58 inches for RFD fabric without Lycra", () => {
      const line = parsePlainDescription("100% cotton, 140 GSM, 1000m, RFD, twill");
      expect(line.draft.width).toBe("58 inches");
      expect(line.widthProvenance).toBe("default");
      expect(line.widthDefaultNote).toBe("Defaulted to 58 inches for RFD fabric; please review.");
    });

    it("defaults to 58 inches for printed fabric without Lycra", () => {
      const line = parsePlainDescription("100% cotton, 140 GSM, 1000m, printed, digital, twill");
      expect(line.draft.width).toBe("58 inches");
      expect(line.widthProvenance).toBe("default");
      expect(line.widthDefaultNote).toBe("Defaulted to 58 inches for Printed fabric; please review.");
    });
  });

  describe("Combination 2: Finished (Dyed / RFD / Printed) WITH confirmed Lycra → 54–57 inches range", () => {
    it("defaults to 54–57 inches range for Dyed with 97% Cotton / 3% Lycra", () => {
      const line = parsePlainDescription("97% cotton / 3% Lycra, 180 GSM, 1000m, dyed, twill");
      expect(line.draft.width).toBe("54–57 inches");
      expect(line.widthProvenance).toBe("default");
      expect(line.widthMin).toBe(54);
      expect(line.widthMax).toBe(57);
      expect(line.widthDefaultNote).toBe("Defaulted to 54–57 inches range for Dyed fabric with Lycra; please review.");
    });

    it("defaults to 54–57 inches range for RFD with Spandex/Elastane aliases", () => {
      const spandexLine = parsePlainDescription("RFD, 95% cotton / 5% spandex, 220 GSM, 1500m");
      expect(spandexLine.draft.width).toBe("54–57 inches");
      expect(spandexLine.widthProvenance).toBe("default");
      expect(spandexLine.widthMin).toBe(54);
      expect(spandexLine.widthMax).toBe(57);

      const elastaneLine = parsePlainDescription("RFD, 97% cotton 3% elastane, 200 GSM, 1000m");
      expect(elastaneLine.draft.width).toBe("54–57 inches");
      expect(elastaneLine.widthProvenance).toBe("default");

      const spxLine = parsePlainDescription("Printed, 98% cotton 2% spx, 200 GSM, 1000m");
      expect(spxLine.draft.width).toBe("54–57 inches");
      expect(spxLine.widthProvenance).toBe("default");
    });
  });

  describe("Combination 3: Greige WITH confirmed Lycra → 67–72 inches range", () => {
    it("defaults to 67–72 inches range for Greige with 97% Cotton / 3% Lycra", () => {
      const line = parsePlainDescription("97% cotton / 3% Lycra, 200 GSM, 1000m, greige, twill");
      expect(line.draft.width).toBe("67–72 inches");
      expect(line.widthProvenance).toBe("default");
      expect(line.widthMin).toBe(67);
      expect(line.widthMax).toBe(72);
      expect(line.widthDefaultNote).toBe("Defaulted to 67–72 inches range for Greige with Lycra; please review.");
    });

    it("defaults to 67–72 inches range for Greige with recognized Spandex/Elastane/spx/EA aliases", () => {
      const spandexLine = parsePlainDescription("Greige, 95% cotton / 5% spandex, 220 GSM, 1500m");
      expect(spandexLine.draft.width).toBe("67–72 inches");
      expect(spandexLine.widthProvenance).toBe("default");
      expect(spandexLine.widthMin).toBe(67);
      expect(spandexLine.widthMax).toBe(72);

      const eaLine = parsePlainDescription("Greige, 96% cotton 4% EA, 200 GSM, 1000m");
      expect(eaLine.draft.width).toBe("67–72 inches");
      expect(eaLine.widthProvenance).toBe("default");
    });
  });

  describe("Combination 4: Greige WITHOUT Lycra → 63 inches", () => {
    it("defaults to 63 inches for Greige with 100% Cotton", () => {
      const line = parsePlainDescription("100% cotton, 200 GSM, 1000m, greige, twill");
      expect(line.draft.width).toBe("63 inches");
      expect(line.widthProvenance).toBe("default");
      expect(line.widthMin).toBe(63);
      expect(line.widthMax).toBe(63);
      expect(line.widthDefaultNote).toBe("Defaulted to 63 inches for Greige without Lycra; please review.");
    });

    it("defaults to 63 inches for Greige with 65% Polyester / 35% Viscose", () => {
      const line = parsePlainDescription("65% poly / 35% viscose, 200 GSM, 1000m, greige, twill");
      expect(line.draft.width).toBe("63 inches");
      expect(line.widthProvenance).toBe("default");
      expect(line.widthDefaultNote).toBe("Defaulted to 63 inches for Greige without Lycra; please review.");
    });
  });

  describe("Requirement 8: Unknown composition does NOT mean 'without Lycra'", () => {
    it("leaves width undefined when composition is completely unknown in Greige", () => {
      const line = parsePlainDescription("Greige fabric, 200 GSM, 1000m, twill");
      expect(line.draft.width).toBeUndefined();
      expect(line.widthProvenance).toBeUndefined();
      expect(line.widthDefaultNote).toBeUndefined();
    });

    it("leaves width undefined when composition is completely unknown in Dyed", () => {
      const line = parsePlainDescription("Dyed fabric, 200 GSM, 1000m, twill");
      expect(line.draft.width).toBeUndefined();
      expect(line.widthProvenance).toBeUndefined();
      expect(line.widthDefaultNote).toBeUndefined();
    });

    it("leaves width undefined when 'stretch' is mentioned without naming any fibre (mechanical stretch / unknown)", () => {
      const line = parsePlainDescription("Greige 4-way stretch twill, 200 GSM, 1000m");
      expect(line.draft.width).toBeUndefined();
      expect(line.widthProvenance).toBeUndefined();
      expect(line.widthDefaultNote).toBeUndefined();
    });

    it("leaves width undefined when only 'no Lycra' is stated without naming any fibre", () => {
      const line = parsePlainDescription("Greige fabric, no Lycra, 200 GSM, 1000m");
      expect(line.draft.width).toBeUndefined();
      expect(line.widthProvenance).toBeUndefined();
      expect(line.widthDefaultNote).toBeUndefined();
    });

    it("defaults to 63 inches when non-Lycra fibre is confirmed alongside negated Lycra ('100% cotton, no Lycra')", () => {
      const line = parsePlainDescription("Greige fabric, no Lycra, 100% cotton, 200 GSM, 1000m");
      expect(line.draft.width).toBe("63 inches");
      expect(line.widthProvenance).toBe("default");
      expect(line.widthDefaultNote).toBe("Defaulted to 63 inches for Greige without Lycra; please review.");
    });

    it("defaults to 63 inches for Greige with 100% polyester mechanical stretch (no Lycra)", () => {
      const line = parsePlainDescription("100% polyester mechanical stretch twill, 200 GSM, 1000m, greige");
      expect(line.draft.width).toBe("63 inches");
      expect(line.widthProvenance).toBe("default");
      expect(line.widthDefaultNote).toBe("Defaulted to 63 inches for Greige without Lycra; please review.");
    });

    it("defaults to 63 inches for Greige with 100% polyester T400 (T400 alone does not imply Lycra)", () => {
      const line = parsePlainDescription("100% polyester T400 stretch twill, 200 GSM, 1000m, greige");
      expect(line.draft.width).toBe("63 inches");
      expect(line.widthProvenance).toBe("default");
      expect(line.widthDefaultNote).toBe("Defaulted to 63 inches for Greige without Lycra; please review.");
    });

    it("does not treat Lycra as detected if it is an unresolved alternative rather than confirmed", () => {
      const line = parsePlainDescription("Greige, cotton or lycra; not decided, 200 GSM, 1000m");
      expect(line.draft.width).toBeUndefined();
      expect(line.widthProvenance).toBeUndefined();
    });
  });

  describe("Requirement 6: Missing or unresolved fabric state → no default", () => {
    it("leaves width undefined when fabric state is missing", () => {
      const line = parsePlainDescription("100% cotton, 140 GSM, 1000m, twill");
      expect(line.draft.width).toBeUndefined();
      expect(line.widthProvenance).toBeUndefined();
      expect(line.widthDefaultNote).toBeUndefined();
    });

    it("leaves width undefined when fabric state is conflicting", () => {
      const line = parsePlainDescription("100% cotton, dyed, greige, 140 GSM, 1000m");
      expect(line.draft.fabricState).toBeUndefined();
      expect(line.draft.width).toBeUndefined();
      expect(line.widthProvenance).toBeUndefined();
    });
  });

  describe("Requirement 1 & 2: Priority & Never overwriting explicit buyer widths", () => {
    it("preserves explicit 60 inches dyed width without default overwrite", () => {
      const line = parsePlainDescription("100% cotton, 140 GSM, 60 inches, 1000m, dyed");
      expect(line.draft.width).toBe("60 inches");
      expect(line.widthProvenance).toBe("extracted");
      expect(line.widthDefaultNote).toBeUndefined();
    });

    it("preserves explicit 150 cm width conversion without default replacement", () => {
      const line = parsePlainDescription("100% cotton, 140 GSM, 150 cm, 1000m, dyed");
      expect(line.draft.width).toContain("inches");
      expect(parseFloat(line.draft.width!)).toBeCloseTo(150 / 2.54, 1);
      expect(line.widthProvenance).toBe("extracted");
      expect(line.widthDefaultNote).toBeUndefined();
    });

    it("applies explicit shared width across fabrics instead of defaults", () => {
      const lines = parseText("A) 100% cotton, dyed, 1000m\nB) 100% cotton, greige, 1000m\nBoth fabrics 54 inches.");
      expect(lines).toHaveLength(2);
      expect(lines[0].draft.width).toBe("54 inches");
      expect(lines[1].draft.width).toBe("54 inches");
    });

    it("preserves review state on conflicting or invalid source width without falling back to defaults", () => {
      const conflicting = parsePlainDescription("100% cotton, dyed, 58 inches or 60 inches, 1000m");
      expect(conflicting.draft.width).toBeUndefined();
      expect(conflicting.widthProvenance).toBeUndefined();
      expect(conflicting.warnings.some(w => /width/i.test(w))).toBe(true);

      const unitless = parsePlainDescription("100% cotton, dyed, width: 58, 1000m");
      expect(unitless.draft.width).toBeUndefined();
      expect(unitless.widthProvenance).toBeUndefined();
      expect(unitless.warnings.some(w => /clear unit/i.test(w))).toBe(true);
    });
  });

  describe("Requirement 10: Editing and Recomputation", () => {
    it("updates width default from 63 to 67–72 inches range when Lycra is added to a defaulted Greige line", () => {
      const line = parsePlainDescription("100% cotton, 200 GSM, 1000m, greige");
      expect(line.draft.width).toBe("63 inches");
      expect(line.widthProvenance).toBe("default");

      // User adds 3% Lycra row to blend
      const updated = updateBlend(line, [
        { id: "1", fibre: "Cotton", percentage: "97" },
        { id: "2", fibre: "Lycra", percentage: "3" },
      ]);
      const recomputed = recomputePlatformWidth(updated);
      expect(recomputed.draft.width).toBe("67–72 inches");
      expect(recomputed.widthMin).toBe(67);
      expect(recomputed.widthMax).toBe(72);
      expect(recomputed.widthProvenance).toBe("default");
      expect(recomputed.widthDefaultNote).toBe("Defaulted to 67–72 inches range for Greige with Lycra; please review.");
    });

    it("updates width default from 67–72 inches to 63 inches when Lycra is removed from a defaulted Greige line", () => {
      const line = parsePlainDescription("97% cotton / 3% lycra, 200 GSM, 1000m, greige");
      expect(line.draft.width).toBe("67–72 inches");
      expect(line.widthProvenance).toBe("default");

      // User removes Lycra row from blend
      const updated = updateBlend(line, [{ id: "1", fibre: "Cotton", percentage: "100" }]);
      const recomputed = recomputePlatformWidth(updated);
      expect(recomputed.draft.width).toBe("63 inches");
      expect(recomputed.widthProvenance).toBe("default");
      expect(recomputed.widthDefaultNote).toBe("Defaulted to 63 inches for Greige without Lycra; please review.");
    });

    it("updates width default from Greige with Lycra (67–72) to 54–57 inches when state changes to Dyed/RFD/Printed", () => {
      const line = parsePlainDescription("97% cotton / 3% lycra, 200 GSM, 1000m, greige");
      expect(line.draft.width).toBe("67–72 inches");

      line.draft.fabricState = "dyed";
      const dyedRecomputed = recomputePlatformWidth(line);
      expect(dyedRecomputed.draft.width).toBe("54–57 inches");
      expect(dyedRecomputed.widthDefaultNote).toBe("Defaulted to 54–57 inches range for Dyed fabric with Lycra; please review.");

      line.draft.fabricState = "rfd";
      const rfdRecomputed = recomputePlatformWidth(line);
      expect(rfdRecomputed.draft.width).toBe("54–57 inches");

      line.draft.fabricState = "printed";
      const printedRecomputed = recomputePlatformWidth(line);
      expect(printedRecomputed.draft.width).toBe("54–57 inches");
    });

    it("updates width default from Greige without Lycra (63) to 58 inches when state changes to Dyed", () => {
      const line = parsePlainDescription("100% cotton, 200 GSM, 1000m, greige");
      expect(line.draft.width).toBe("63 inches");

      line.draft.fabricState = "dyed";
      const dyedRecomputed = recomputePlatformWidth(line);
      expect(dyedRecomputed.draft.width).toBe("58 inches");
      expect(dyedRecomputed.widthDefaultNote).toBe("Defaulted to 58 inches for Dyed fabric; please review.");
    });

    it("removes system default if fabric state becomes unresolved", () => {
      const line = parsePlainDescription("100% cotton, 200 GSM, 1000m, dyed");
      expect(line.draft.width).toBe("58 inches");

      delete line.draft.fabricState;
      const recomputed = recomputePlatformWidth(line);
      expect(recomputed.draft.width).toBeUndefined();
      expect(recomputed.widthProvenance).toBeUndefined();
      expect(recomputed.widthDefaultNote).toBeUndefined();
    });

    it("never overwrites a manually entered width when state or blend changes", () => {
      const line = parsePlainDescription("100% cotton, 200 GSM, 1000m, greige");
      line.draft.width = "72 inches";
      line.widthProvenance = "manual";
      delete line.widthDefaultNote;

      const updated = updateBlend(line, [
        { id: "1", fibre: "Cotton", percentage: "95" },
        { id: "2", fibre: "Lycra", percentage: "5" },
      ]);
      const recomputed = recomputePlatformWidth(updated);
      expect(recomputed.draft.width).toBe("72 inches");
      expect(recomputed.widthProvenance).toBe("manual");

      recomputed.draft.fabricState = "dyed";
      const dyedRecomputed = recomputePlatformWidth(recomputed);
      expect(dyedRecomputed.draft.width).toBe("72 inches");
      expect(dyedRecomputed.widthProvenance).toBe("manual");
    });

    it("respects intentional clearing and does not refill width", () => {
      const line = parsePlainDescription("100% cotton, 200 GSM, 1000m, dyed");
      expect(line.draft.width).toBe("58 inches");

      delete line.draft.width;
      line.widthProvenance = "cleared";
      delete line.widthDefaultNote;

      const attempted = applyPlatformWidthDefault(line);
      expect(attempted.draft.width).toBeUndefined();
      expect(attempted.widthProvenance).toBe("cleared");

      const recomputed = recomputePlatformWidth(line);
      expect(recomputed.draft.width).toBeUndefined();
    });
  });

  describe("Requirement 9: Multiple fabrics receive independent defaults", () => {
    it("assigns independent defaults across different states and compositions", () => {
      const source = [
        "Fabric 1: 100% cotton, dyed, 140 GSM, 1000m",
        "Fabric 2: 97% cotton / 3% lycra, greige, 200 GSM, 1000m",
        "Fabric 3: 100% cotton, greige, 200 GSM, 1000m",
        "Fabric 4: 95% cotton / 5% elastane, dyed, 200 GSM, 1000m",
      ].join("\n\n");

      const lines = parseText(source);
      expect(lines).toHaveLength(4);

      // Fabric 1: Dyed without Lycra -> 58 inches
      expect(lines[0].draft.width).toBe("58 inches");
      expect(lines[0].widthDefaultNote).toContain("Dyed fabric");

      // Fabric 2: Greige with Lycra -> 67–72 inches
      expect(lines[1].draft.width).toBe("67–72 inches");
      expect(lines[1].widthMin).toBe(67);
      expect(lines[1].widthMax).toBe(72);
      expect(lines[1].widthDefaultNote).toContain("Greige with Lycra");

      // Fabric 3: Greige without Lycra -> 63 inches
      expect(lines[2].draft.width).toBe("63 inches");
      expect(lines[2].widthDefaultNote).toContain("Greige without Lycra");

      // Fabric 4: Dyed with Lycra -> 54–57 inches
      expect(lines[3].draft.width).toBe("54–57 inches");
      expect(lines[3].widthMin).toBe(54);
      expect(lines[3].widthMax).toBe(57);
      expect(lines[3].widthDefaultNote).toContain("Dyed fabric with Lycra");
    });
  });

  describe("Excel Intake Defaults", () => {
    it("applies platform default width when Excel row omits width but provides fabric state and composition", () => {
      const ws = XLSX.utils.aoa_to_sheet([
        ["blend", "gsm", "weave", "fabric state", "quantity (m)"],
        ["100% Cotton", "140", "Plain", "Dyed", "1000"],
        ["97% Cotton 3% Lycra", "200", "Twill", "Greige", "1500"],
      ]);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

      const lines = parseSheet(buffer, "test.xlsx");
      expect(lines).toHaveLength(2);
      expect(lines[0].draft.width).toBe("58 inches");
      expect(lines[0].widthProvenance).toBe("default");

      expect(lines[1].draft.width).toBe("67–72 inches");
      expect(lines[1].widthProvenance).toBe("default");
    });
  });

  it.each([
    ["greige", "67–72 inches"],
    ["dyed", "54–57 inches"],
  ])("keeps GLM for review when %s with Lycra supplies only a default width range", (state, width) => {
    const line = parsePlainDescription(`97% cotton / 3% Lycra, 250 GLM, 1000m, ${state}, twill`);
    expect(line.draft.width).toBe(width);
    expect(line.widthProvenance).toBe("default");
    expect(line.draft.gsm).toBeUndefined();
    expect(line.gsmMin).toBeUndefined();
    expect(line.gsmMax).toBeUndefined();
    expect(line.weightInput?.rawText).toBe("250 GLM");
    expect(line.gsmQualifier).toBe("250 GLM (requires width for GSM)");
  });

  describe("Inquiry submission with range width and hidden fields compatibility", () => {
    it("submits successfully with range width (67–72 inches) for Greige with Lycra", () => {
      const line = parsePlainDescription("97% cotton / 3% lycra, 200 GSM, 1000m, greige, twill, made to order");
      expect(line.draft.width).toBe("67–72 inches");
      line.draft.endUse = "Shirting";

      const destination = {
        deliveryCountry: "India",
        deliveryCity: "Mumbai",
        deliveryState: "Maharashtra",
        deliveryPincode: "400001",
        contactPhone: "+91 9876543210",
      };

      const issues = lineIssues(line, destination);
      expect(issues).toEqual([]);

      const batch = buildBatch([line], destination, crypto.randomUUID());
      const validation = batchSubmissionSchema.safeParse(batch);
      expect(validation.success).toBe(true);
      expect(batch.lines[0].inquiry.width).toBe("67–72 inches");
    });
  });
});
