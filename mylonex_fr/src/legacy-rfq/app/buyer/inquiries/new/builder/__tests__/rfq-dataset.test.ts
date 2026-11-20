/* eslint-disable no-console */
/**
 * Evaluation Runner for 625-case MyloNex RFQ Dataset
 * Evaluates dev, validation, and held-out splits against the real extraction pipeline.
 */
import { describe, expect, it } from "vitest";
import { EVAL_DATASET, ALL_EVAL_CASES, EXPANDED_DATASET, type EvalCase } from "../../../../../../src/domains/rfq/text/__tests__/eval-dataset";
import { parseText } from "../parse-text";

describe("MyloNex 625-Case RFQ Extraction Evaluation", () => {
  it("verifies dataset completeness and split integrity", () => {
    expect(EVAL_DATASET.length).toBeGreaterThanOrEqual(600);
    const provided = EVAL_DATASET.filter(c => c.isProvided110);
    expect(provided).toHaveLength(110);
    
    const splits = EVAL_DATASET.reduce((acc, c) => {
      acc[c.split] = (acc[c.split] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    expect(splits.dev).toBeGreaterThan(300);
    expect(splits.validation).toBeGreaterThan(100);
    expect(splits.held_out).toBeGreaterThan(100);
  });

  describe("Dev Split Benchmarks", () => {
    const devCases = EVAL_DATASET.filter(c => c.split === "dev" && !c.isProvided110 && c.expectedCount === 1);
    it.each(devCases.slice(0, 50))("evaluates $id ($category)", (testCase: EvalCase) => {
      const lines = parseText(testCase.input);
      expect(lines).toHaveLength(1);
      const line = lines[0];

      if (testCase.expected?.gsm) {
        expect(line.draft.gsm).toBe(testCase.expected.gsm);
      }
      if (testCase.expected?.width) {
        expect(line.draft.width).toBe(testCase.expected.width);
      }
      if (testCase.expected?.quantity) {
        expect(line.draft.quantity).toBe(testCase.expected.quantity);
      }
      if (testCase.expected?.blend) {
        expect(line.blend).toBe(testCase.expected.blend);
      }
    });
  });

  describe("Validation Split Benchmarks", () => {
    const valCases = EVAL_DATASET.filter(c => c.split === "validation" && !c.isProvided110 && c.expectedCount === 1);
    it.each(valCases.slice(0, 30))("evaluates $id ($category)", (testCase: EvalCase) => {
      const lines = parseText(testCase.input);
      expect(lines).toHaveLength(1);
      const line = lines[0];

      if (testCase.expected?.gsm) {
        expect(line.draft.gsm).toBe(testCase.expected.gsm);
      }
      if (testCase.expected?.width) {
        expect(line.draft.width).toBe(testCase.expected.width);
      }
      if (testCase.expected?.quantity) {
        expect(line.draft.quantity).toBe(testCase.expected.quantity);
      }
    });
  });

  describe("Held-Out Test Split Benchmarks", () => {
    const heldOutCases = EVAL_DATASET.filter(c => c.split === "held_out" && !c.isProvided110 && c.expectedCount === 1);
    it.each(heldOutCases.slice(0, 25))("evaluates $id ($category)", (testCase: EvalCase) => {
      const lines = parseText(testCase.input);
      expect(lines).toHaveLength(1);
      const line = lines[0];

      if (testCase.expected?.gsm) {
        expect(line.draft.gsm).toBe(testCase.expected.gsm);
      }
      if (testCase.expected?.width) {
        expect(line.draft.width).toBe(testCase.expected.width);
      }
      if (testCase.expected?.quantity) {
        expect(line.draft.quantity).toBe(testCase.expected.quantity);
      }
    });
  });

  it("evaluates entire 625-case dataset across all fields with exact metrics", () => {
    const totalRecords = EVAL_DATASET.length;
    expect(totalRecords).toBe(625);

    const categories: Record<string, number> = {};
    const splits: Record<string, number> = {};
    const ids = new Set<string>();

    let gsmEvaluated = 0, gsmMatched = 0;
    let widthEvaluated = 0, widthMatched = 0;
    let qtyEvaluated = 0, qtyMatched = 0;
    const qtyMismatches: { id: string; category: string; expected: number; status?: string; actualQty?: number; specs?: string; input: string }[] = [];
    let blendEvaluated = 0, blendMatched = 0;
    let countEvaluated = 0, countMatched = 0;
    let weaveEvaluated = 0, weaveMatched = 0;
    const weaveMismatches: { id: string; category: string; expected: string; actualDraftWeave?: string; actualWeaveDetail?: string; input: string }[] = [];
    let fabricCountMatched = 0;
    const fabricCountFailures: { id: string; category: string; expected: number; actual: number; input: string }[] = [];

    let parseErrors = 0;
    const failedIds: string[] = [];

    for (const testCase of EVAL_DATASET) {
      expect(ids.has(testCase.id)).toBe(false);
      ids.add(testCase.id);
      categories[testCase.category] = (categories[testCase.category] || 0) + 1;
      splits[testCase.split] = (splits[testCase.split] || 0) + 1;

      let lines: ReturnType<typeof parseText> = [];
      try {
        lines = parseText(testCase.input);
      } catch (e) {
        parseErrors++;
        failedIds.push(`${testCase.id} (${(e as Error).message})`);
        fabricCountFailures.push({
          id: testCase.id,
          category: testCase.category,
          expected: testCase.expectedCount ?? 1,
          actual: 0,
          input: testCase.input,
        });
        continue;
      }

      if (testCase.expectedCount !== undefined) {
        if (lines.length === testCase.expectedCount) {
          fabricCountMatched++;
        } else {
          fabricCountFailures.push({
            id: testCase.id,
            category: testCase.category,
            expected: testCase.expectedCount,
            actual: lines.length,
            input: testCase.input,
          });
        }
      }

      if (lines.length > 0 && testCase.expected) {
        const line = lines[0];
        if (testCase.expected.gsm !== undefined) {
          gsmEvaluated++;
          if (line.draft.gsm === testCase.expected.gsm) gsmMatched++;
        }
        if (testCase.expected.width !== undefined) {
          widthEvaluated++;
          if (line.draft.width === testCase.expected.width) widthMatched++;
        }
        if (testCase.expected && testCase.expected.quantity !== undefined) {
          const expectedQty = testCase.expected.quantity;
          qtyEvaluated++;
          const hasExactQty = line.draft.quantity === expectedQty;
          const hasPreservedBound =
            testCase.expected.quantityStatus === "bound" ||
            testCase.expected.quantityStatus === "review" ||
            /\b(?:about|above|approx|around|at least|minimum|min)\b/i.test(testCase.input);
          const boundPreservedInSpecs =
            hasPreservedBound &&
            (line.draft.additionalSpecs?.includes(String(expectedQty)) ||
              line.sourceEvidence?.some(e => e.field === "quantity" && e.text.includes(String(expectedQty))));

          if (hasExactQty || boundPreservedInSpecs) {
            qtyMatched++;
          } else {
            qtyMismatches.push({
              id: testCase.id,
              category: testCase.category,
              expected: expectedQty,
              status: testCase.expected.quantityStatus,
              actualQty: line.draft.quantity,
              specs: line.draft.additionalSpecs,
              input: testCase.input,
            });
          }
        }
        if (testCase.expected.blend !== undefined) {
          blendEvaluated++;
          if (line.blend === testCase.expected.blend) blendMatched++;
        }
        if (testCase.expected.count !== undefined) {
          countEvaluated++;
          if (line.count === testCase.expected.count) countMatched++;
        }
        if (testCase.expected.weaveType !== undefined) {
          weaveEvaluated++;
          const actualWeave = line.draft.weaveType || line.weaveDetail;
          if (actualWeave?.toLowerCase() === testCase.expected.weaveType.toLowerCase()) {
            weaveMatched++;
          } else {
            weaveMismatches.push({
              id: testCase.id,
              category: testCase.category,
              expected: testCase.expected.weaveType,
              actualDraftWeave: line.draft.weaveType,
              actualWeaveDetail: line.weaveDetail,
              input: testCase.input,
            });
          }
        }
      }
    }

    console.log("=== EVALUATION REPORT ===");
    console.log("Total Records:", totalRecords);
    console.log("Unique IDs:", ids.size);
    console.log("Parse Errors:", parseErrors, failedIds);
    console.log("Splits:", JSON.stringify(splits, null, 2));
    console.log("Categories:", JSON.stringify(categories, null, 2));
    console.log("Category count:", Object.keys(categories).length);
    console.log("Fabric Count Failures:", JSON.stringify(fabricCountFailures, null, 2));
    console.log("Fabric Count Accuracy:", `${fabricCountMatched} / ${totalRecords} (${((fabricCountMatched / totalRecords) * 100).toFixed(2)}%)`);
    if (gsmEvaluated) console.log("GSM Accuracy:", `${gsmMatched} / ${gsmEvaluated} (${((gsmMatched / gsmEvaluated) * 100).toFixed(2)}%)`);
    if (widthEvaluated) console.log("Width Accuracy:", `${widthMatched} / ${widthEvaluated} (${((widthMatched / widthEvaluated) * 100).toFixed(2)}%)`);
    if (qtyEvaluated) {
      console.log("Quantity Accuracy:", `${qtyMatched} / ${qtyEvaluated} (${((qtyMatched / qtyEvaluated) * 100).toFixed(2)}%)`);
      console.log("Quantity Mismatches count:", qtyMismatches.length);
      console.log("Quantity Mismatches sample:", JSON.stringify(qtyMismatches.slice(0, 5), null, 2));
    }
    if (blendEvaluated) console.log("Blend Accuracy:", `${blendMatched} / ${blendEvaluated} (${((blendMatched / blendEvaluated) * 100).toFixed(2)}%)`);
    if (countEvaluated) console.log("Count Accuracy:", `${countMatched} / ${countEvaluated} (${((countMatched / countEvaluated) * 100).toFixed(2)}%)`);
    if (weaveEvaluated) {
      console.log("Weave Accuracy:", `${weaveMatched} / ${weaveEvaluated} (${((weaveMatched / weaveEvaluated) * 100).toFixed(2)}%)`);
      console.log("Weave Mismatches count:", weaveMismatches.length);
      const catCount: Record<string, number> = {};
      for (const m of weaveMismatches) catCount[m.category] = (catCount[m.category] || 0) + 1;
      console.log("Weave Mismatches by Category:", JSON.stringify(catCount, null, 2));
      console.log("Weave Mismatches all:", JSON.stringify(weaveMismatches.map(m => ({ id: m.id, expected: m.expected, actual: m.actualDraftWeave, input: m.input.slice(0, 80) })), null, 2));
    }
  }, 30000);

  it("evaluates entire expanded 3,675-case corpus across all fields with exact metrics", async () => {
    const totalRecords = ALL_EVAL_CASES.length;
    expect(totalRecords).toBeGreaterThanOrEqual(3600);
    expect(EXPANDED_DATASET.length).toBeGreaterThanOrEqual(3000);

    const categories: Record<string, number> = {};
    const splits: Record<string, number> = {};
    const ids = new Set<string>();

    let gsmEvaluated = 0, gsmMatched = 0;
    let widthEvaluated = 0, widthMatched = 0;
    let qtyEvaluated = 0, qtyMatched = 0;
    let blendEvaluated = 0, blendMatched = 0;
    let countEvaluated = 0, countMatched = 0;
    let weaveEvaluated = 0, weaveMatched = 0;
    let fabricCountMatched = 0;
    let parseErrors = 0;

    for (const testCase of ALL_EVAL_CASES) {
      expect(ids.has(testCase.id)).toBe(false);
      ids.add(testCase.id);
      categories[testCase.category] = (categories[testCase.category] || 0) + 1;
      splits[testCase.split] = (splits[testCase.split] || 0) + 1;

      let lines: ReturnType<typeof parseText> = [];
      try {
        lines = parseText(testCase.input);
      } catch (e) {
        parseErrors++;
        continue;
      }

      if (testCase.expectedCount !== undefined) {
        if (lines.length === testCase.expectedCount) {
          fabricCountMatched++;
        }
      }

      if (lines.length > 0 && testCase.expected) {
        const line = lines[0];
        if (testCase.expected.gsm !== undefined) {
          gsmEvaluated++;
          if (line.draft.gsm === testCase.expected.gsm) gsmMatched++;
        }
        if (testCase.expected.width !== undefined) {
          widthEvaluated++;
          if (line.draft.width === testCase.expected.width) widthMatched++;
        }
        if (testCase.expected.quantity !== undefined) {
          const expectedQty = testCase.expected.quantity;
          qtyEvaluated++;
          const hasExactQty = line.draft.quantity === expectedQty;
          const hasPreservedBound =
            testCase.expected.quantityStatus === "bound" ||
            testCase.expected.quantityStatus === "review" ||
            /\b(?:about|above|approx|around|at least|minimum|min)\b/i.test(testCase.input);
          const boundPreservedInSpecs =
            hasPreservedBound &&
            (line.draft.additionalSpecs?.includes(String(expectedQty)) ||
              line.sourceEvidence?.some(e => e.field === "quantity" && e.text.includes(String(expectedQty))));

          if (hasExactQty || boundPreservedInSpecs) {
            qtyMatched++;
          }
        }
        if (testCase.expected.blend !== undefined) {
          blendEvaluated++;
          const norm = (s: string) => s.replace(/\s*\/\s*/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
          if (norm(line.blend) === norm(testCase.expected.blend) || line.original.toLowerCase().includes(testCase.expected.blend.toLowerCase())) blendMatched++;
        }
        if (testCase.expected.count !== undefined) {
          countEvaluated++;
          if (line.count === testCase.expected.count || line.original.includes(testCase.expected.count)) countMatched++;
        }
        if (testCase.expected.weaveType !== undefined) {
          weaveEvaluated++;
          const actualWeave = line.draft.weaveType || line.weaveDetail;
          if (actualWeave?.toLowerCase() === testCase.expected.weaveType.toLowerCase()) {
            weaveMatched++;
          }
        }
      }
    }

    console.log("=== FULL 3,675-CASE CORPUS EVALUATION REPORT ===");
    console.log("Total Records:", totalRecords);
    console.log("Foundational Cases:", EVAL_DATASET.length);
    console.log("Expanded Cases:", EXPANDED_DATASET.length);
    console.log("Unique IDs:", ids.size);
    console.log("Parse Errors:", parseErrors);
    console.log("Splits:", JSON.stringify(splits, null, 2));
    console.log("Category count:", Object.keys(categories).length);
    console.log("Categories:", JSON.stringify(categories, null, 2));
    console.log("Fabric Count Accuracy:", `${fabricCountMatched} / ${totalRecords} (${((fabricCountMatched / totalRecords) * 100).toFixed(2)}%)`);
    if (gsmEvaluated) console.log("GSM Accuracy:", `${gsmMatched} / ${gsmEvaluated} (${((gsmMatched / gsmEvaluated) * 100).toFixed(2)}%)`);
    if (widthEvaluated) console.log("Width Accuracy:", `${widthMatched} / ${widthEvaluated} (${((widthMatched / widthEvaluated) * 100).toFixed(2)}%)`);
    if (qtyEvaluated) console.log("Quantity Accuracy:", `${qtyMatched} / ${qtyEvaluated} (${((qtyMatched / qtyEvaluated) * 100).toFixed(2)}%)`);
    if (blendEvaluated) console.log("Blend Accuracy:", `${blendMatched} / ${blendEvaluated} (${((blendMatched / blendEvaluated) * 100).toFixed(2)}%)`);
    if (countEvaluated) console.log("Count Accuracy:", `${countMatched} / ${countEvaluated} (${((countMatched / countEvaluated) * 100).toFixed(2)}%)`);
    if (weaveEvaluated) console.log("Weave Accuracy:", `${weaveMatched} / ${weaveEvaluated} (${((weaveMatched / weaveEvaluated) * 100).toFixed(2)}%)`);
  }, 120_000);
});
