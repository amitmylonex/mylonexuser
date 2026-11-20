import { describe, expect, it } from "vitest";
import { parseText } from "../parse-text";
import { reconcileTextDrafts } from "../reconcile-text";
import { lineDraft } from "../draft";
import { extraction, field } from "../../../../../../src/domains/rfq/text/__tests__/ai-fixtures";

describe("Finish AI / Local Reconciliation & Persistence", () => {
  it("reconciles exact multi-finish 'Lam + Moisture Management' with AI agreement", () => {
    const input = "100% cotton poplin, 58 inches, 2000m\nFINISH – Lam + Moisture Management";
    const local = parseText(input);

    expect(local).toHaveLength(1);
    expect(local[0].finish).toBe("Lam + Moisture Management");

    const raw = extraction(input, [
      field("blend", "100% Cotton", "100% cotton"),
      field("width", "58 inches", "58 inches"),
      field("quantity", "2000 m", "2000m"),
      field("finish", "Lam + Moisture Management", "FINISH – Lam + Moisture Management"),
    ]);

    const reconciled = reconcileTextDrafts(input, local, raw.fabrics, raw.fabrics);
    expect(reconciled).toHaveLength(1);
    const line = reconciled[0];

    expect(line.finish).toBe("Lam + Moisture Management");

    // Submission mapping verification:
    const draft = lineDraft(line);
    expect(draft.additionalSpecs).toContain("Finish: Lam + Moisture Management");
  });

  it("preserves manual buyer edits during reconciliation and re-extraction", () => {
    const input = "100% cotton poplin, 58 inches, 2000m\nFinish: peach finish";
    const local = parseText(input);
    expect(local[0].finish).toBe("Peach");

    // Buyer manually edits the finish in the UI
    local[0].finish = "Custom Water-Repellent Teflon";
    local[0].finishConfirmed = true;

    const raw = extraction(input, [
      field("finish", "Peach", "peach finish"),
    ]);

    const reconciled = reconcileTextDrafts(input, local, raw.fabrics, raw.fabrics);
    expect(reconciled[0].finish).toBe("Custom Water-Repellent Teflon");
  });

  it("retains finish exclusions and qualifiers in lineDraft additionalSpecs", () => {
    const input = "100% Cotton poplin, 58\", 1000m. Soft finish, no silicone. PFAS-free DWR.";
    const lines = parseText(input);
    expect(lines).toHaveLength(1);
    const line = lines[0];

    expect(line.finish).toContain("Soft");
    expect(line.finishExclusions).toContain("No silicone");
    expect(line.finishQualifiers).toContain("PFAS-free");

    const draft = lineDraft(line);
    expect(draft.additionalSpecs).toMatch(/Finish: Soft/);
    expect(draft.additionalSpecs).toMatch(/Finish exclusion: No silicone/);
    expect(draft.additionalSpecs).toMatch(/Finish qualifier: PFAS-free/);
  });

  it("safely maps explicit finish: dyed to fabricState rather than functional finish", () => {
    const input = "Cotton twill 40s x 40s, 58\", 2000m. Finish: dyed.";
    const lines = parseText(input);
    expect(lines).toHaveLength(1);
    const line = lines[0];

    expect(line.draft.fabricState).toBe("dyed");
    expect(line.finish).toBe("");
  });
});
