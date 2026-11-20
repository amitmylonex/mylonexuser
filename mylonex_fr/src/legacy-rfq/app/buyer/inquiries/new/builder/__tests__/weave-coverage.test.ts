import { describe, expect, it } from "vitest";
import { parseText } from "../parse-text";
import { lineDraft } from "../draft";
import { reconcileTextDrafts } from "../reconcile-text";
import { validateAiExtraction } from "../../../../../../src/domains/rfq/text/ai-validation";
import type { AiFabric } from "../../../../../../src/domains/rfq/text/ai-schema";

export const checklist = ["Plain", "Plain Poplin", "Poplin", "Twill", "2/1 Twill", "2/2 Twill",
  "3/1 Twill", "3/2 Twill", "Drill", "Matty", "Basket", "Oxford", "Pinpoint Oxford", "Royal Oxford",
  "Chambray", "Dobby", "Jacquard", "Herringbone", "Houndstooth", "Satin", "Sateen", "Leno",
  "Mock Leno", "Honeycomb", "Waffle", "Birdseye", "Seersucker", "Hopsack", "Gabardine",
  "Broken Twill", "Diamond Twill", "Chevron", "Ripstop"];
const inquiry = (phrase: string) => `Please quote 100% Cotton, ${phrase}, count: 40s x 40s, construction: 120 x 80, 150 GSM, 58 inches, 1000 m, ready stock.`;

describe("complete buyer inquiry weave coverage through builder", () => {
  it.each(checklist)("retains the specific requested term %s", phrase => {
    const source = inquiry(phrase);
    const [line] = parseText(source);
    expect(line.draft.weaveType).toBe(phrase);
    expect(lineDraft(line).weaveType).toBe(phrase);
    expect(line.original).toBe(source);
    expect(line.draft).toMatchObject({ gsm: 150, width: "58 inches", quantity: 1000 });
    expect(line.count).toBe("40s x 40s");
    expect(line.construction).toBe("120 x 80");
  });

  it.each(["ripstop", "rip stop", "rip-stop", "ribstop", "rib-stop", "rib stop", "RIBSTOP", "Rip–Stop"])("normalizes %s and retains source offsets", phrase => {
    const source = inquiry(phrase), [line] = parseText(source);
    expect(line.draft.weaveType).toBe("Ripstop");
    expect(line.weaveDetection?.mentions).toContainEqual(expect.objectContaining({ matchedTerm: phrase }));
    for (const mention of line.weaveDetection!.mentions) expect(source.slice(mention.start, mention.end)).toBe(mention.matchedTerm);
    expect(lineDraft(line).additionalSpecs).toContain(phrase);
  });

  it.each(["herring bone", "honey comb", "birds eye", "bird's eye", "bird’s-eye", "mock-leno", "mockleno", "seer sucker", "gaberdine",
    "2/2 matt", "mattie 2/2", "MATT 2/2", "twill 2/1", "drill 3/1", "2 x 1 Twill", "Twill (2 × 1)", "3 x 1 Drill"])("recognizes controlled wording %s", phrase => {
    const [line] = parseText(inquiry(phrase));
    expect(line.draft.weaveType).toBe(["2/2 matt", "mattie 2/2", "MATT 2/2"].includes(phrase) ? "2/2 Matty" : phrase);
    expect(line.weaveDetection?.mentions.map(mention => mention.matchedTerm)).toContain(phrase);
    expect(line.warnings.some(warning => /Review numeric pair/.test(warning))).toBe(false);
  });

  it.each(["2/1 Twill Ripstop", "Ripstop 2/1 Twill", "2/1 Twill rip-stop", "rip stop Twill 2/1"])("preserves compatible phrase %s", phrase => {
    const [line] = parseText(inquiry(phrase));
    expect(line.draft.weaveType).toBe(phrase.replace(/rip[ -]stop/i, "Ripstop"));
    expect(line.weaveDetection?.mentions).toHaveLength(1);
  });

  it.each(checklist)("does not treat excluded %s as a request", phrase => {
    const [line] = parseText(inquiry(`not ${phrase}`));
    expect(line.draft.weaveType).toBeUndefined();
  });

  it.each(checklist)("keeps alternatives to %s unselected, including after AI reconciliation", phrase => {
    const other = /Satin/.test(phrase) ? "Twill" : "Satin";
    const source = inquiry(`${phrase} or ${other}`), local = parseText(source);
    expect(local[0].draft.weaveType).toBeUndefined();
    const raw: AiFabric = { source, fields: [{ field: "weaveType", value: phrase, sourcePhrases: [phrase], interpretation: "explicit" }], alternatives: [], yarns: [], issues: [] };
    const validated = validateAiExtraction(source, { fabrics: [raw] }).fabrics;
    expect(reconcileTextDrafts(source, local, validated, [raw])[0].draft.weaveType).toBeUndefined();
  });

  it.each(["rib", "rib knit", "ribstopper", "satin finish", "satin finishing", "printed houndstooth pattern", "chevron print", "matt finish", "matt", "Satinwood",
    "2 x 1", "count: 2 x 1; Twill", "weave: not satin", "pattern: herringbone", "finish: Satin"])("does not invent a weave for %s", phrase => {
    const [line] = parseText(inquiry(phrase));
    if (phrase === "count: 2 x 1; Twill") expect(line.draft.weaveType).toBe("Twill");
    else expect(line.draft.weaveType).toBeUndefined();
  });

  it.each(["Twill or Satin", "2/1 Twill or 3/1 Twill", "Plain or Plain Poplin", "Twill / Ripstop", "weave: Twill or Satin"])("requires review for alternatives/conflicts %s", phrase => {
    const [line] = parseText(inquiry(phrase));
    expect(line.draft.weaveType).toBeUndefined();
    expect(line.warnings.join(" ")).toMatch(/weave.*(?:conflict|confirm)|conflict.*weave/i);
  });

  it("keeps unknown labelled wording for review", () => {
    const [line] = parseText(inquiry("weave: Zephyrlock"));
    expect(line.draft.weaveType).toBeUndefined();
    expect(line.weaveDetail).toBe("Zephyrlock");
  });

  it.each(["satin finish", "printed houndstooth pattern", "weave: Zephyrlock", "weave: not Satin"])("AI cannot auto-confirm non-weave or unknown wording %s", phrase => {
    const source = inquiry(phrase), local = parseText(source);
    const value = phrase.includes("Zephyrlock") ? "Zephyrlock" : /houndstooth/.test(phrase) ? "houndstooth" : "Satin";
    const raw: AiFabric = { source, fields: [{ field: "weaveType", value, sourcePhrases: [phrase], interpretation: "explicit" }], alternatives: [], yarns: [], issues: [] };
    const validated = validateAiExtraction(source, { fabrics: [raw] }).fabrics;
    expect(reconcileTextDrafts(source, local, validated, [raw])[0].draft.weaveType).toBeUndefined();
  });

  it.each(["Twill Finish: satin", "Twill with satin finish", "Twill, woven cotton printed houndstooth pattern", "Twill Width: 58 inches"])("scopes neighbouring descriptions in %s", phrase => {
    expect(parseText(inquiry(phrase))[0].draft.weaveType).toBe("Twill");
  });
  it.each(["Weave Architecture:", "Weave Detail:", "Weave Structure:", "Weave Type:", "Weave Pattern:"])("retains an explicit ratio under %s", label => {
    const source = `Please quote cotton twill, 150 GSM, 58 inches, 1000 m.\n${label} 3/1 Twill`;
    expect(parseText(source)[0].draft.weaveType).toBe("3/1 Twill");
  });

  it("separates processing and adjacent labels without truncating the compound phrase", () => {
    const [line] = parseText('Please quote yarn-dyed 100% cotton, Weave: 2/1 Twill ribstop Order qty: 5000m; 150 GSM; width: 58 inches; navy; peach finish.');
    expect(line.draft.weaveType).toBe("2/1 Twill Ripstop");
    expect(line.draft.quantity).toBe(5000);
    expect(line.draft.dyeMethod).toBe("yarn_dyed");
    expect(line.finish).toMatch(/peach/i);
    expect(line.colours.map(colour => colour.name.toLowerCase())).toContain("navy");
  });

  it.each(["ribstop", "2/1 Twill rip-stop", "mattie 2/2"])("reconciles source-backed AI spelling %s", phrase => {
    const source = inquiry(phrase), local = parseText(source);
    const raw: AiFabric = { source, fields: [{ field: "weaveType", value: phrase, sourcePhrases: [phrase], interpretation: "explicit" }], alternatives: [], yarns: [], issues: [] };
    const validated = validateAiExtraction(source, { fabrics: [raw] }).fabrics;
    const [line] = reconcileTextDrafts(source, local, validated, [raw]);
    expect(line.draft.weaveType).toBe(local[0].draft.weaveType);
    expect(line.textCandidates?.filter(candidate => candidate.field === "weaveType").every(candidate => candidate.status === "accepted")).toBe(true);
  });
});
