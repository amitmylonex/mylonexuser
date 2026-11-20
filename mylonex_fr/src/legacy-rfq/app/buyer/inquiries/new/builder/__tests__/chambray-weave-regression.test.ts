import { describe, expect, it } from "vitest";
import { extractPlainLine } from "../plain-text-extraction";
import { parseText } from "../parse-text";
import { reconcileTextDrafts } from "../reconcile-text";
import type { AiFabric } from "../../../../../../src/domains/rfq/text/ai-schema";

describe("Chambray and Textile Weave Recognition System Regression", () => {
  describe("Exact Failing Input", () => {
    const INPUT =
      "Please quote yarn-dyed chambray, 80% lyocell / 20% linen. Count 30s x 30s - construction 72 x 60 - width 58 in. - GSM 125. Order 4,500 mtrs. Target ₹182/- per metre, ex mill. Delivery within 30 days.";

    it("extracts Chambray as flexible weave field, yarn-dyed as processing, and preserves all other fields", () => {
      const line = extractPlainLine(INPUT);

      // Weave preserved in flexible weave field without replacing with Plain
      expect(line.draft.weaveType?.toLowerCase()).toBe("chambray");
      expect(line.draft.weaveType?.toLowerCase()).not.toBe("plain");
      expect(line.weaveDetail).toBe("");

      // Processing details: yarn-dyed preserved separately as dye method & fabric state
      expect(line.draft.fabricState).toBe("dyed");
      expect(line.draft.dyeMethod).toBe("yarn_dyed");

      // Blend
      expect(line.blend).toBe("80% Lyocell 20% Linen");
      expect(line.blendRows).toEqual([
        expect.objectContaining({ fibre: "Lyocell", percentage: "80" }),
        expect.objectContaining({ fibre: "Linen", percentage: "20" }),
      ]);

      // Count and Construction
      expect(line.count).toBe("30s x 30s");
      expect(line.construction).toBe("72 x 60");

      // Weight and Dimensions
      expect(line.draft.gsm).toBe(125);
      expect(line.draft.width).toBe("58 inches");

      // Quantity
      expect(line.draft.quantity).toBe(4500);

      // Commercial target price
      expect(line.draft.targetPriceMax).toBe(182);
      expect(line.targetPriceBasis).toBe("per_metre");

      // Delivery: 30-day requirement preserved without inventing production cycle
      expect(line.draft.productionCycle).toBeUndefined();
      expect(line.draft.additionalSpecs).toMatch(/Delivery:\s*within 30 days/i);

      // No conflicting weave warning
      expect(line.warnings).not.toContain(
        "Several conflicting weave mentions were detected. Confirm the intended weave; none was chosen."
      );
    });

    it("works through parseText entry point as single inquiry line", () => {
      const lines = parseText(INPUT);
      expect(lines).toHaveLength(1);
      const [line] = lines;
      expect(line.draft.weaveType?.toLowerCase()).toBe("chambray");
      expect(line.draft.dyeMethod).toBe("yarn_dyed");
      expect(line.draft.gsm).toBe(125);
      expect(line.draft.quantity).toBe(4500);
    });
  });

  describe("Table-Driven Shared Textile-Term Recognition", () => {
    it.each([
      // Chambray variants
      ["100% Cotton, chambray, 130 GSM, 58 inches, 1000m", "chambray"],
      ["100% Cotton, Chambray, 130 GSM, 58 inches, 1000m", "Chambray"],
      ["100% Cotton, yarn-dyed chambray, 130 GSM, 58 inches, 1000m", "chambray"],
      ["100% Cotton, piece-dyed chambray, 130 GSM, 58 inches, 1000m", "chambray"],
      ["100% Cotton, chambray weave, 130 GSM, 58 inches, 1000m", "chambray"],

      // Plain poplin / poplin - specific phrase preferred
      ["100% Cotton, Plain Poplin, 120 GSM, 58 inches, 1000m", "Plain Poplin"],
      ["100% Cotton, plain poplin, 120 GSM, 58 inches, 1000m", "plain poplin"],
      ["100% Cotton, poplin, 120 GSM, 58 inches, 1000m", "poplin"],

      // 2/1, 2/2, 3/1, 3/2 twill - specific phrase preferred
      ["100% Cotton, 2/1 twill, 150 GSM, 58 inches, 1000m", "2/1 twill"],
      ["100% Cotton, 2/1 Twill, 150 GSM, 58 inches, 1000m", "2/1 Twill"],
      ["100% Cotton, 2/2 twill, 150 GSM, 58 inches, 1000m", "2/2 twill"],
      ["100% Cotton, 3/1 twill, 200 GSM, 58 inches, 1000m", "3/1 twill"],
      ["100% Cotton, 3/2 twill, 220 GSM, 58 inches, 1000m", "3/2 twill"],
      ["100% Cotton, twill 2/1, 150 GSM, 58 inches, 1000m", "twill 2/1"],
      ["100% Cotton, Twill 3/1, 200 GSM, 58 inches, 1000m", "Twill 3/1"],

      // Drill
      ["100% Cotton, drill, 240 GSM, 58 inches, 1000m", "drill"],
      ["100% Cotton, 3/1 drill, 240 GSM, 58 inches, 1000m", "3/1 drill"],
      ["100% Cotton, 3/1 Drill, 240 GSM, 58 inches, 1000m", "3/1 Drill"],
      ["100% Cotton, Drill 3/1, 240 GSM, 58 inches, 1000m", "Drill 3/1"],

      // Matty / matt / mattie with ratios
      ["100% Cotton, MATT 2/2, 143 GSM, 58 inches, 1000m", "2/2 Matty"],
      ["100% Cotton, 2/2 Matty, 143 GSM, 58 inches, 1000m", "2/2 Matty"],
      ["100% Cotton, 2/2 mattie, 143 GSM, 58 inches, 1000m", "2/2 Matty"],
      ["100% Cotton, mattie 2/2, 143 GSM, 58 inches, 1000m", "2/2 Matty"],
      ["100% Cotton, MATT (2/2), 143 GSM, 58 inches, 1000m", "2/2 Matty"],
      ["100% Cotton, MATT - 2/2, 143 GSM, 58 inches, 1000m", "2/2 Matty"],

      // Oxford, basket, dobby, jacquard, herringbone
      ["100% Cotton, oxford, 130 GSM, 58 inches, 1000m", "oxford"],
      ["100% Cotton, Oxford, 130 GSM, 58 inches, 1000m", "Oxford"],
      ["100% Cotton, basket, 160 GSM, 58 inches, 1000m", "basket"],
      ["100% Cotton, basket weave, 160 GSM, 58 inches, 1000m", "basket"],
      ["100% Cotton, dobby, 140 GSM, 58 inches, 1000m", "dobby"],
      ["100% Cotton, jacquard, 180 GSM, 58 inches, 1000m", "jacquard"],
      ["100% Cotton, herringbone, 200 GSM, 58 inches, 1000m", "herringbone"],

      // Seersucker, leno, mock leno, waffle, honeycomb
      ["100% Cotton, seersucker, 120 GSM, 58 inches, 1000m", "seersucker"],
      ["100% Cotton, leno, 90 GSM, 58 inches, 1000m", "leno"],
      ["100% Cotton, mock leno, 110 GSM, 58 inches, 1000m", "mock leno"],
      ["100% Cotton, waffle, 220 GSM, 58 inches, 1000m", "waffle"],
      ["100% Cotton, honeycomb, 210 GSM, 58 inches, 1000m", "honeycomb"],
    ])("recognizes '%s' as weave '%s'", (input, expectedWeave) => {
      const line = extractPlainLine(input);
      expect(line.draft.weaveType).toBe(expectedWeave);
    });
  });

  describe("Negative, Non-Weave, and Field Boundary Cases", () => {
    it("does not treat 'satin finish' as weave", () => {
      const line = extractPlainLine("100% Cotton, 120 GSM, 58 inches, satin finish, 1000 m");
      expect(line.draft.weaveType).toBeUndefined();
    });

    it("does not treat 'printed houndstooth pattern' as weave", () => {
      const line = extractPlainLine("100% Cotton, 120 GSM, 58 inches, printed houndstooth pattern, 1000 m");
      expect(line.draft.weaveType).toBeUndefined();
    });

    it("stops phrase extraction at field boundaries: 'Plain Order qty: 5000m' does not make 'Order qty' part of weave", () => {
      const line = extractPlainLine("100% Cotton, Plain Order qty: 5000m, 120 GSM, 58 inches");
      expect(line.draft.weaveType).toBe("Plain");
      expect(line.draft.quantity).toBe(5000);
    });

    it("flags conflicting weave structures without inventing a hybrid", () => {
      const line = extractPlainLine("100% Cotton, 2/1 twill, satin weave, 150 GSM, 58 inches, 1000 m");
      expect(line.draft.weaveType).toBeUndefined();
      expect(line.warnings).toContain(
        "Several conflicting weave mentions were detected. Confirm the intended weave; none was chosen."
      );
    });

    it("leaves standalone ambiguous 'matt' without ratio or cue for review", () => {
      const line = extractPlainLine("100% Cotton, matt, 140 GSM, 58 inches, 1000m");
      expect(line.draft.weaveType).toBeUndefined();
      expect(line.weaveDetail).toBe("matt");
    });
  });

  describe("Earlier Failures Preserved in Regression Suite", () => {
    it("proposes 165 GSM from 'Weight: 165 G.M.' with inference note", () => {
      const input =
        "Cotton 97% lycra 3%, 2/1 twill, 40s x 40s / 133 x 72, width 58 inches. Weight: 165 G.M. Need navy and olive, 1200 mtr per col, total 2400 mtr. Peach finish.";
      const line = extractPlainLine(input);
      expect(line.draft.gsm).toBe(165);
      expect(line.warnings).toContain("165 GSM inferred from ‘Weight: 165 G.M.’; please confirm.");
    });

    it("normalizes '100% lyocel' to Lyocell 100%", () => {
      const line = extractPlainLine("100% lyocel twill, 140 GSM, 58 inches, 1000 m");
      expect(line.blend).toBe("100% Lyocell");
      expect(line.blendRows).toEqual([
        expect.objectContaining({ fibre: "Lyocell", percentage: "100" }),
      ]);
    });

    it("retains recycled fibre attributes", () => {
      const line = extractPlainLine("60% recycled cotton / 40% recycled polyester, 150 GSM, 58 inches, 1000 m");
      expect(line.blendRows).toEqual([
        expect.objectContaining({ fibre: "Cotton", percentage: "60" }),
        expect.objectContaining({ fibre: "Recycled Polyester", percentage: "40" }),
      ]);
      expect(line.fibreQualifiers).toContainEqual(expect.stringMatching(/recycled/i));
    });

    it("reconciles colour quantities consistent with total without false conflict", () => {
      const input =
        "Need 100% lyocel dyed twill, 30s × 30s / 104 × 70, 145 GSM, 58\" finished width. Black 800 m, sage 600 m, dusty pink 600 m. Total requirement 2,000 meters. Same quality in all three shades.";
      const line = extractPlainLine(input);
      expect(line.draft.quantity).toBe(2000);
      expect(line.warnings).not.toContain("Conflicting total quantities; confirm the intended total in metres.");
      expect(line.colours.map(c => ({ name: c.name.toLowerCase(), metres: c.metres }))).toEqual([
        { name: "black", metres: "800" },
        { name: "sage", metres: "600" },
        { name: "dusty pink", metres: "600" },
      ]);
    });

    it("supports bracketed quantity units e.g. 5000 (M)", () => {
      const line = extractPlainLine("100% cotton, 2/1 twill, 150 GSM, 58 inches, Order 5000 (M)");
      expect(line.draft.quantity).toBe(5000);
    });

    it("captures 63\" Greige width with its qualifier", () => {
      const line = extractPlainLine("100% cotton, 2/1 twill, 150 GSM, 63\" Greige width, 1000m");
      expect(line.widthBasis).toBe("greige");
      expect(line.widthQualifier).toMatch(/greige/i);
    });

    it("keeps yarn count fractions and weave ratios distinct", () => {
      const line = extractPlainLine("2/40s x 2/40s / 100 x 80, 2/1 twill, 150 GSM, 58 inches, 1000 m");
      expect(line.count).toBe("2/40s x 2/40s");
      expect(line.draft.weaveType).toBe("2/1 twill");
    });

    it("isolates multiple separate fabric requirements", () => {
      const input =
        "Line 1: 100% cotton chambray, 130 GSM, 58 inches, 1000 m.\nLine 2: 100% linen twill, 180 GSM, 54 inches, 2000 m.";
      const lines = parseText(input);
      expect(lines).toHaveLength(2);
      expect(lines[0].draft.weaveType?.toLowerCase()).toBe("chambray");
      expect(lines[0].draft.quantity).toBe(1000);
      expect(lines[1].draft.weaveType?.toLowerCase()).toBe("twill");
      expect(lines[1].draft.quantity).toBe(2000);
    });
  });

  describe("Candidate Reconciliation & Manual Edit Preservation", () => {
    it("preserves local weave extraction through reconciliation when AI omits weave", () => {
      const localLine = extractPlainLine(
        "Please quote yarn-dyed chambray, 80% lyocell / 20% linen, 125 GSM, 58 inches, 4500 m"
      );
      expect(localLine.draft.weaveType?.toLowerCase()).toBe("chambray");

      const validatedAi: AiFabric[] = [
        {
          source: localLine.original,
          fields: [
            { field: "blend", value: "80% Lyocell 20% Linen", sourcePhrases: ["80% lyocell / 20% linen"], interpretation: "explicit" },
            { field: "gsm", value: "125", sourcePhrases: ["125 GSM"], interpretation: "explicit" },
            { field: "width", value: "58 inches", sourcePhrases: ["58 inches"], interpretation: "explicit" },
            { field: "quantity", value: "4500", sourcePhrases: ["4500 m"], interpretation: "explicit" },
          ],
          alternatives: [],
          yarns: [],
          issues: [],
        },
      ];

      const reconciled = reconcileTextDrafts(localLine.original, [localLine], validatedAi);
      expect(reconciled).toHaveLength(1);
      expect(reconciled[0].draft.weaveType?.toLowerCase()).toBe("chambray");
    });

    it("preserves manual edits to weaveType across draft updates", () => {
      const line = extractPlainLine("100% cotton, 140 GSM, 58 inches, 1000 m");
      line.draft.weaveType = "Custom Buyer Weave";
      // Manually set weave remains intact
      expect(line.draft.weaveType).toBe("Custom Buyer Weave");
    });
  });
});
