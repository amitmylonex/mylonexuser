import { describe, expect, it, vi, afterEach } from "vitest";
import { extractGsm } from "../../../../../../src/domains/rfq/text/gsm";
import { emptyFields } from "../../../../../../src/domains/rfq/text/ai-grounding";
import { parseText } from "../parse-text";
import { assessLineReadiness } from "../readiness";
import { lineDraft } from "../draft";
import { readRequirements } from "../read-requirements";
import { validateAiExtraction } from "../../../../../../src/domains/rfq/text/ai-validation";
import { extraction, field } from "../../../../../../src/domains/rfq/text/__tests__/ai-fixtures";
import type { AiExtraction } from "../../../../../../src/domains/rfq/text/ai-schema";

afterEach(() => vi.unstubAllGlobals());

async function readWithMockAi(source: string, raw: AiExtraction) {
  const validated = validateAiExtraction(source, raw);
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      data: {
        mode: "ai-assisted",
        ...validated,
        proposals: raw.fabrics,
      },
    }),
  }));
  return readRequirements(source, true);
}

describe("GSM Extended Punctuated Grammar & Area-Unit Regressions", () => {
  const EXACT_CASES = [
    ["270 G.M. / SQMT", 270],
    ["270 G.M./SQ.M.", 270],
    ["270 GM / SQ MT", 270],
    ["270 GMS / SQ. M.", 270],
    ["270 grams per square metre", 270],
    ["270 gram / sqm", 270],
    ["270 g / m²", 270],
    ["WEIGHT - 270 - G.M. / SQMT", 270],
    ["FABRIC WEIGHT: 270 (GM/SQMT)", 270],
    ["Weight [G.M. / SQMT] = 270", 270],
    ["G.M. / SQMT: 270", 270],
    ["GSM - 270", 270],
    ["G.S.M. = 270", 270],
    ["GSM: 270 G.M.", 270],
    ["WEIGHT - 270 - GM / SQMT", 270],
  ] as const;

  for (const [source, expected] of EXACT_CASES) {
    it(`extracts exact GSM ${expected} from "${source}"`, () => {
      const fields = emptyFields();
      extractGsm(source, fields);
      expect(fields.gsm).toBe(expected);
      expect(fields.evidence.some(e => e.field === "gsm" && e.kind === "explicit")).toBe(true);
    });
  }

  describe("Gram and square-metre token matrix", () => {
    const GRAM_VARIANTS = [
      "g", "g.", "gm", "gm.", "g.m", "g.m.", "g m", "gms", "gms.", "g.m.s.", "gram", "grams",
    ];

    const AREA_VARIANTS = [
      "m²", "m2", "m^2", "sqm", "sq.m", "sq.m.", "sq m", "sq. m.", "sqmt", "sqmt.",
      "sq mt", "sq. mt.", "sq mtr", "sq mtrs", "sq meter", "sq meters", "sq metre", "sq metres",
      "square meter", "square meters", "square metre", "square metres",
    ];

    it("recognizes all 12 gram variants combined with area variants across realistic RFQ lines", () => {
      GRAM_VARIANTS.forEach((gram, gIdx) => {
        const area = AREA_VARIANTS[gIdx % AREA_VARIANTS.length];
        const val = 150 + gIdx * 10;
        const text = `100% cotton, ${val} ${gram}/${area}, 58 inches, 2000m`;
        const fields = emptyFields();
        extractGsm(text, fields);
        expect(fields.gsm).toBe(val);
      });
    });

    it("recognizes all 22 square-metre area variants combined with gram variants", () => {
      AREA_VARIANTS.forEach((area, aIdx) => {
        const gram = GRAM_VARIANTS[aIdx % GRAM_VARIANTS.length];
        const val = 100 + aIdx * 5;
        const sep = aIdx % 2 === 0 ? " / " : " per ";
        const text = `Cotton twill, weight: ${val} ${gram}${sep}${area}, 58", 1500m`;
        const fields = emptyFields();
        extractGsm(text, fields);
        expect(fields.gsm).toBe(val);
      });
    });

    it("supports parenthesized and bracketed units", () => {
      const inputs = [
        ["100% cotton, 240 (g/m²), 58 inches", 240],
        ["Weight [G.M. / SQ.M.] = 195", 195],
        ["Fabric weight: 260 [gm / sqmt]", 260],
        ["310 (GMS / SQ. M.) canvas", 310],
      ] as const;

      for (const [source, val] of inputs) {
        const fields = emptyFields();
        extractGsm(source, fields);
        expect(fields.gsm).toBe(val);
      }
    });
  });

  describe("Distinguishing mass from area weight (negative & ambiguous cases)", () => {
    const NEGATIVE_CASES = [
      ["Sample weight 270 G.M.", "sample weight in grams is not fabric GSM"],
      ["Courier parcel 500 grams.", "package weight in grams"],
      ["Roll weight 25 kg.", "gross roll mass in kg"],
      ["Fabric linear weight 270 GM/M.", "linear weight per running metre"],
      ["270 grams per yard.", "linear mass per yard"],
      ["Product code GM-270.", "product code identifier"],
      ["Quantity 270m.", "length in metres"],
    ] as const;

    for (const [input, reason] of NEGATIVE_CASES) {
      it(`does not assign GSM for: "${input}" (${reason})`, () => {
        const fields = emptyFields();
        extractGsm(input, fields);
        expect(fields.gsm).toBeUndefined();
        expect(fields.gsmMin).toBeUndefined();
        expect(fields.gsmMax).toBeUndefined();
      });
    }

    it("keeps generic 'Weight 270 GM, area not stated' reviewable without setting exact GSM", () => {
      const text = "Weight 270 GM, area not stated.";
      const fields = emptyFields();
      extractGsm(text, fields);
      expect(fields.gsm).toBeUndefined();
      expect(fields.evidence.some(e => e.field === "gsm" && e.kind === "unresolved")).toBe(true);
      expect(fields.warnings.some(w => /without an area unit/i.test(w))).toBe(true);
    });
  });

  describe("Preserving qualified values (ranges, bounds, tolerances, revisions, approx)", () => {
    it("preserves continuous range: 270–280 G.M./SQMT", () => {
      const fields = emptyFields();
      extractGsm("270–280 G.M./SQMT", fields);
      expect(fields.gsm).toBeUndefined();
      expect(fields.gsmMin).toBe(270);
      expect(fields.gsmMax).toBe(280);
      expect(fields.gsmQualifier).toBe("Range: 270–280 g/m²");
    });

    it("preserves strict lower bound: Above 270 G.M./SQMT", () => {
      const fields = emptyFields();
      extractGsm("Above 270 G.M./SQMT", fields);
      expect(fields.gsm).toBeUndefined();
      expect(fields.gsmBound).toEqual({ value: 270, operator: ">", label: "Above" });
      expect(fields.gsmMin).toBe(270);
    });

    it("preserves inclusive lower bound: At least 270 G.M./SQMT", () => {
      const fields = emptyFields();
      extractGsm("At least 270 G.M./SQMT", fields);
      expect(fields.gsm).toBeUndefined();
      expect(fields.gsmBound).toEqual({ value: 270, operator: ">=", label: "At least" });
      expect(fields.gsmMin).toBe(270);
    });

    it("preserves approximate value: Around 270 G.M./SQMT", () => {
      const fields = emptyFields();
      extractGsm("Around 270 G.M./SQMT", fields);
      expect(fields.gsm).toBe(270);
      expect(fields.gsmQualifier).toContain("around 270");
    });

    it("preserves tolerance: 270 ±5 G.M./SQMT", () => {
      const fields = emptyFields();
      extractGsm("270 ±5 G.M./SQMT", fields);
      expect(fields.gsm).toBeUndefined();
      expect(fields.gsmTolerance).toBe(5);
      expect(fields.gsmMin).toBe(265);
      expect(fields.gsmMax).toBe(275);
    });

    it("preserves revision: Change 270 to 280 G.M./SQMT", () => {
      const fields = emptyFields();
      extractGsm("Change 270 to 280 G.M./SQMT", fields);
      expect(fields.gsm).toBe(280);
    });
  });

  describe("End-to-end buyer RFQ parsing and pipeline integration", () => {
    it("extracts exact GSM 270 from user screenshot RFQ into editable line draft", () => {
      const text = `QLTY - 2/20x2/30 /120x70 - 2/1 Twill
FINISH - Lam + Moisture Management
SHADE - Dk Blue
QTY - 45000 Mts
WEIGHT - 270 - GM / SQMT`;

      const lines = parseText(text);
      expect(lines).toHaveLength(1);
      const [line] = lines;

      // Actual GSM field in draft is populated with 270
      expect(line.draft.gsm).toBe(270);

      // Weave: 2/1 Twill
      expect(line.draft.weaveType).toBe("2/1 Twill");

      // Finish: Lam + Moisture Management
      expect(line.finish).toBe("Lam + Moisture Management");

      // Quantity: 45000
      expect(line.draft.quantity).toBe(45000);

      // Readiness: GSM is not missing
      const readiness = assessLineReadiness(line);
      expect(readiness.missing).not.toContain("GSM");

      // Submission draft preserves GSM
      const draft = lineDraft(line);
      expect(draft.gsm).toBe(270);
    });

    it("reconciles punctuated G.M. / SQMT with AI extraction mode", async () => {
      const source = `100% Cotton Twill
270 G.M. / SQMT
58 inches
10000 mtrs`;

      const raw = extraction(source, [
        field("blend", "100% Cotton", "100% Cotton"),
        field("weaveType", "Twill", "Twill"),
        field("gsm", "270", "270 G.M. / SQMT"),
        field("width", "58 inches", "58 inches"),
        field("quantity", "10000 m", "10000 mtrs"),
      ]);

      const [line] = await readWithMockAi(source, raw);
      expect(line.draft.gsm).toBe(270);
      expect(line.textCandidates?.some(c => c.field === "gsm" && c.value === "270" && c.status === "accepted")).toBe(true);
    });
  });

  describe("MyloNex RFQ Builder GSM Extraction Requirements", () => {
    const FAILING_INPUT =
      "Cotton 97% lycra 3%, 2/1 twill, 40s x 40s / 133 x 72, width 58 inches. Weight: 165 G.M. Need navy and olive, 1200 mtr per col, total 2400 mtr. Peach finish.";

    it("satisfies the exact failing input with local extraction alone", async () => {
      const result = await readRequirements(FAILING_INPUT, false);
      expect(result).toHaveLength(1);
      const line = result[0];

      // 1. Expected: Populate GSM = 165
      expect(line.draft.gsm).toBe(165);

      // 2. Preserve source wording and show concise note
      expect(line.warnings).toContain("165 GSM inferred from ‘Weight: 165 G.M.’; please confirm.");
      const gsmEvidence = line.sourceEvidence?.find(e => e.field === "gsm");
      expect(gsmEvidence).toBeDefined();
      expect(gsmEvidence?.kind).toBe("inferred");
      expect(gsmEvidence?.text).toBe("Weight: 165 G.M.");
      expect(gsmEvidence?.reason).toBe("165 GSM inferred from ‘Weight: 165 G.M.’; please confirm.");

      const gsmCandidate = line.textCandidates?.find(c => c.field === "gsm");
      expect(gsmCandidate).toBeDefined();
      expect(gsmCandidate?.value).toBe("165");
      expect(gsmCandidate?.kind).toBe("inferred");
      expect(gsmCandidate?.status).toBe("accepted");
      expect(gsmCandidate?.sourcePhrases).toEqual(["Weight: 165 G.M."]);

      // 3. Preserve other extractions
      // Blend: Cotton 97%, Lycra 3%
      expect(line.blend).toBe("97% Cotton 3% Lycra");
      expect(line.blendRows).toEqual([
        expect.objectContaining({ fibre: "Cotton", percentage: "97" }),
        expect.objectContaining({ fibre: "Lycra", percentage: "3" }),
      ]);
      // Weave: 2/1 twill
      expect(line.draft.weaveType?.toLowerCase()).toBe("2/1 twill");
      // Count: 40s x 40s
      expect(line.count).toBe("40s x 40s");
      // Construction: 133 x 72
      expect(line.construction).toBe("133 x 72");
      // Width: 58 inches
      expect(line.draft.width).toBe("58 inches");
      // Colours and quantities: navy and olive, 1200 mtr per col, total 2400 mtr
      expect(line.colours.map(c => c.name)).toEqual(expect.arrayContaining(["Navy", "Olive"]));
      expect(line.colours.map(c => c.metres)).toEqual(["1200", "1200"]);
      expect(line.draft.quantity).toBe(2400);
      // Finish: Peach
      expect(line.finish).toBe("Peach");

      // 4. Weight: 165 G.M. must be captured and not dumped into unparsed residual text
      expect(line.draft.additionalSpecs || "").not.toContain("Weight: 165 G.M.");
    });

    describe("Requirement 1: Recognize explicit GSM notation variants", () => {
      const VARIANTS = [
        "165 GSM",
        "GSM: 165",
        "165 G.S.M.",
        "165 g/m²",
        "165 g/m2",
        "165 gm/m2",
        "165 grams per square metre",
        "165 grams per square meter",
      ];

      for (const variant of VARIANTS) {
        it(`normalizes "${variant}" to GSM 165`, () => {
          const text = `100% cotton, 2/1 twill, 40s x 40s, ${variant}, 58 inches, 1000m`;
          const fields = emptyFields();
          extractGsm(text, fields);
          expect(fields.gsm).toBe(165);
          expect(fields.evidence.some(e => e.field === "gsm" && e.kind === "explicit")).toBe(true);
        });
      }
    });

    describe("Requirement 2: Contextual handling of informal weight shorthand", () => {
      it("infers GSM from 'Weight: 165 G.M.' in fabric context", () => {
        const text = "Cotton 97% lycra 3%, 2/1 twill, 40s x 40s, width 58 inches. Weight: 165 G.M. Peach finish.";
        const fields = emptyFields();
        extractGsm(text, fields);
        expect(fields.gsm).toBe(165);
        expect(fields.evidence.some(e => e.field === "gsm" && e.kind === "inferred")).toBe(true);
      });

      it("infers GSM from 'Fabric weight 165 gm' in fabric context", () => {
        const text = "Cotton 97% lycra 3%, 2/1 twill, 40s x 40s, width 58 inches. Fabric weight 165 gm.";
        const fields = emptyFields();
        extractGsm(text, fields);
        expect(fields.gsm).toBe(165);
        expect(fields.evidence.some(e => e.field === "gsm" && e.kind === "inferred")).toBe(true);
      });

      it("infers GSM from 'wt: 165' in fabric context", () => {
        const text = "Cotton 97% lycra 3%, 2/1 twill, 40s x 40s, width 58 inches, wt: 165.";
        const fields = emptyFields();
        extractGsm(text, fields);
        expect(fields.gsm).toBe(165);
        expect(fields.evidence.some(e => e.field === "gsm" && e.kind === "inferred")).toBe(true);
      });

      it("extracts GSM from 'gsm approx 165'", () => {
        const text = "gsm approx 165, 100% cotton twill, 58 inches";
        const fields = emptyFields();
        extractGsm(text, fields);
        expect(fields.gsm).toBe(165);
        expect(fields.gsmQualifier).toContain("around 165");
      });

      it("does not infer GSM from bare 'gm' without fabric specification context", () => {
        const text = "Fabric weight: 220 gm";
        const fields = emptyFields();
        extractGsm(text, fields);
        expect(fields.gsm).toBeUndefined();
        expect(fields.evidence.some(e => e.field === "gsm" && e.kind === "unresolved")).toBe(true);
      });
    });

    describe("Requirement 3: Protect other numeric meanings", () => {
      const PROTECTED_CASES = [
        ["Sample weight: 165 gm, 100% cotton", "sample weight must not become GSM"],
        ["Parcel weight: 500 g, 100% cotton", "parcel weight must not become GSM"],
        ["Roll weight: 25 kg, 100% cotton", "roll weight must not become GSM"],
        ["165 grams per running metre, 100% cotton", "linear mass must not become GSM"],
        ["Price ₹165/m, 100% cotton twill", "price must not become GSM"],
        ["Order 165 metres, 100% cotton poplin", "order metres must not become GSM"],
        ["Width 165 cm, 100% cotton poplin", "width cm must not become GSM"],
        ["Quality code 165, 100% cotton twill", "quality code must not become GSM"],
        ["40s x 40s / 133 x 72, 2/1 twill", "yarn counts and construction must not become GSM"],
      ] as const;

      for (const [source, desc] of PROTECTED_CASES) {
        it(`protects non-GSM number: ${desc}`, () => {
          const fields = emptyFields();
          extractGsm(source, fields);
          expect(fields.gsm).toBeUndefined();
        });
      }
    });

    describe("Requirement 4: Handle ranges and uncertainty", () => {
      it("supports continuous range '180–190 GSM'", () => {
        const fields = emptyFields();
        extractGsm("180–190 GSM, 100% cotton poplin", fields);
        expect(fields.gsm).toBeUndefined();
        expect(fields.gsmMin).toBe(180);
        expect(fields.gsmMax).toBe(190);
        expect(fields.gsmQualifier).toBe("Range: 180–190 g/m²");
      });

      it("supports continuous range 'GSM 180 to 190'", () => {
        const fields = emptyFields();
        extractGsm("GSM: 180 to 190, 100% cotton poplin", fields);
        expect(fields.gsm).toBeUndefined();
        expect(fields.gsmMin).toBe(180);
        expect(fields.gsmMax).toBe(190);
        expect(fields.gsmQualifier).toBe("Range: 180–190 g/m²");
      });

      it("supports 'Weight: 180–190 G.M.' in clear fabric context", () => {
        const fields = emptyFields();
        extractGsm("Cotton 97% lycra 3%, 2/1 twill, 40s x 40s, Weight: 180–190 G.M.", fields);
        expect(fields.gsm).toBeUndefined();
        expect(fields.gsmMin).toBe(180);
        expect(fields.gsmMax).toBe(190);
      });

      it("supports tolerance '165 ± 5 GSM'", () => {
        const fields = emptyFields();
        extractGsm("165 ± 5 GSM, 100% cotton twill", fields);
        expect(fields.gsm).toBeUndefined();
        expect(fields.gsmTolerance).toBe(5);
        expect(fields.gsmMin).toBe(160);
        expect(fields.gsmMax).toBe(170);
      });

      it("does not reject explicit GSM outside typical range solely by heuristic", () => {
        const fields = emptyFields();
        extractGsm("Heavy industrial canvas, 950 GSM, 60 inches", fields);
        expect(fields.gsm).toBe(950);
      });
    });

    describe("Requirement 5: Respect conflicts, user edits, and provenance", () => {
      it("prioritizes explicit GSM over weaker informal weight shorthand", () => {
        const text = "Weight: 165 G.M. Actually require 180 GSM, 100% cotton twill";
        const fields = emptyFields();
        extractGsm(text, fields);
        expect(fields.gsm).toBe(180);
        expect(fields.evidence.some(e => e.field === "gsm" && e.kind === "explicit")).toBe(true);
      });

      it("flags conflicting explicit GSM values for review", () => {
        const text = "165 GSM, but also 200 GSM in notes, 100% cotton";
        const fields = emptyFields();
        extractGsm(text, fields);
        expect(fields.gsm).toBeUndefined();
        expect(fields.warnings.some(w => /conflicting values/i.test(w))).toBe(true);
      });

      it("preserves manual edits over re-extraction in draft", async () => {
        const lines = parseText(FAILING_INPUT);
        expect(lines[0].draft.gsm).toBe(165);

        // User manually edits GSM in UI to 170
        lines[0].draft.gsm = 170;

        // Assessing readiness preserves manual override
        const readiness = assessLineReadiness(lines[0]);
        expect(readiness.missing).not.toContain("GSM");

        // Submission draft retains 170
        const draft = lineDraft(lines[0]);
        expect(draft.gsm).toBe(170);
      });
    });
  });
});
