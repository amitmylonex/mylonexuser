import { describe, expect, it } from "vitest";
import { reconcileTextDrafts } from "../reconcile-text";
import { parseText } from "../parse-text";
import { lineDraft } from "../draft";
import type { AiFabric } from "../../../../../../src/domains/rfq/text/ai-schema";

describe("Colour extraction AI/local reconciliation", () => {
  it("reconciles local colour extraction with AI colour candidates", () => {
    const input = "100% cotton poplin, 58 inches, 2000m\nSHADE - Dk Blue";
    const local = parseText(input);

    const aiFabric: AiFabric = {
      source: input,
      fields: [
        { field: "blend", value: "100% Cotton", sourcePhrases: ["100% cotton"], interpretation: "explicit" },
        { field: "colour", value: "Dark Blue", sourcePhrases: ["Dk Blue"], interpretation: "explicit" },
      ],
      alternatives: [],
      yarns: [],
      issues: [],
    };

    const reconciled = reconcileTextDrafts(input, local, [aiFabric]);
    expect(reconciled).toHaveLength(1);
    const [line] = reconciled;
    expect(line.colours.some(c => /dark blue/i.test(c.name))).toBe(true);
  });

  it("preserves manual buyer colour edits when coloursConfirmed is true", () => {
    const input = "100% cotton poplin, 58 inches, 2000m, Navy";
    const local = parseText(input);
    local[0].colours = [{ id: "custom-col", name: "Buyer Chosen Sky Blue", metres: "2000" }];
    local[0].coloursConfirmed = true;

    const aiFabric: AiFabric = {
      source: input,
      fields: [
        { field: "blend", value: "100% Cotton", sourcePhrases: ["100% cotton"], interpretation: "explicit" },
        { field: "colour", value: "Navy", sourcePhrases: ["Navy"], interpretation: "explicit" },
      ],
      alternatives: [],
      yarns: [],
      issues: [],
    };

    const reconciled = reconcileTextDrafts(input, local, [aiFabric]);
    expect(reconciled).toHaveLength(1);
    const [line] = reconciled;
    expect(line.colours).toHaveLength(1);
    expect(line.colours[0].name).toBe("Buyer Chosen Sky Blue");
  });

  it("transfers colour exclusions and alternatives to lineDraft additionalSpecs", () => {
    const input = "100% cotton poplin, 58 inches, 2000m. Navy, no red.";
    const local = parseText(input);

    const draft = lineDraft(local[0]);
    expect(draft.additionalSpecs).toMatch(/Colour exclusion: No red/i);
  });

  it("preserves explicit RFD state when a future colour is mentioned", () => {
    const input = "100% cotton twill, 58\", 2000m. RFD fabric; final shade navy after approval.";
    const local = parseText(input);

    const aiFabric: AiFabric = {
      source: input,
      fields: [
        { field: "blend", value: "100% Cotton", sourcePhrases: ["100% cotton"], interpretation: "explicit" },
        { field: "fabricState", value: "rfd", sourcePhrases: ["RFD"], interpretation: "explicit" },
        { field: "colour", value: "Navy", sourcePhrases: ["navy"], interpretation: "explicit" },
      ],
      alternatives: [],
      yarns: [],
      issues: [],
    };

    const reconciled = reconcileTextDrafts(input, local, [aiFabric]);
    expect(reconciled).toHaveLength(1);
    const [line] = reconciled;
    expect(line.draft.fabricState).toBe("rfd");
    expect(lineDraft(line).additionalSpecs).toMatch(/future shade: navy/i);
  });
});
