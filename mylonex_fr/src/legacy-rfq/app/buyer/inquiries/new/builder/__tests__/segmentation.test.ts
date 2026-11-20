import { describe, expect, it } from "vitest";
import { parseText, parseGroups } from "../parse-text";
import { readRequirements } from "../read-requirements";

const choices = "OPTION 1 100% GOTS NOP-certified organic cotton\nOPTION 2 BCI cotton.\nOPTION 3 Regen Agri Cotton";
const a = `A) 16 OE × 16 OE / 96 × 60, 65” RS, 2/2 Matty (OL) –\n${choices}`;
const b = `B) 20 CCW × 20 CCW / 96 × 48, 3/1 Drill –\n${choices}`;
const combined = `${a}\n\n${b}`;
function check(text: string) {
  const lines = parseText(text); expect(lines).toHaveLength(2);
  const [first, second] = lines;
  expect(first).toMatchObject({ count: "16 OE × 16 OE", construction: "96 × 60", blend: "" });
  expect(first.draft).toMatchObject({ weaveType: "2/2 Matty", width: "65 inches", productionCycle: "ready_stock" });
  expect(second).toMatchObject({ count: "20 CCW × 20 CCW", construction: "96 × 48", blend: "" });
  expect(second.draft.weaveType).toBe("3/1 Drill");
  expect(first.draft.additionalSpecs).toContain("(OL)");
  expect(first.original).not.toContain("CCW"); expect(second.original).not.toContain("OE ×");
  expect(second.draft.width).toBeUndefined(); expect(second.draft.productionCycle).toBeUndefined();
  for (const line of lines) {
    expect(line.draft.additionalSpecs?.replace(/\r\n/g, "\n")).toContain(choices);
    expect(line.sourceEvidence?.filter(item => item.field === "alternatives")).toHaveLength(3);
    for (const key of ["gsm", "quantity", "fabricState"] as const) expect(line.draft[key]).toBeUndefined();
    for (const item of line.sourceEvidence ?? []) expect(line.original.slice(item.start, item.end)).toBe(item.text);
    expect(line.warnings.join(" ")).not.toMatch(/ambiguous|Conflicting count|Several weave/);
  }
  expect(first.original + second.original).toBe(text);
  return lines;
}
describe("fabric segmentation before independent plain-text extraction", () => {
  it("segments the EXACT combined A/B source, retaining each entry's own options", () => { check(combined); });
  it.each([["A.", "B."], ["1)", "2)"], ["1.", "2."], ["Fabric 1", "Fabric 2"], ["Fabric 1:", "Fabric 2:"]])("supports equivalent entry labels %s / %s", (first, second) => {
    check(combined.replace("A)", first).replace("B)", second));
  });
  it("recognizes a clear blank-line-separated pair of complete fabric specifications", () => {
    check(combined.replace("A) ", "").replace("B) ", ""));
  });
  it("uses explicit labels without needing a blank line, including standalone headings", () => {
    check(`${a}\n${b}`);
    check(combined.replace("A) ", "A)\n").replace("B) ", "B)\n"));
  });
  it("retains periods, CRLF and literal continuation backslashes without extra drafts", () => {
    check(combined.replace(/\n/g, "\r\n"));
    check(combined.replace(/–\n/g, "–\\\n"));
  });
  it("keeps blank-line-separated OPTION clauses with their fabric", () => {
    const lines = parseText(combined.replace(/\nOPTION/g, "\n\nOPTION"));
    expect(lines).toHaveLength(2);
    expect(lines[0].original).not.toContain("CCW"); expect(lines[1].original).not.toContain("(OL)");
    for (const line of lines) expect(line.sourceEvidence?.filter(item => item.field === "alternatives")).toHaveLength(3);
  });
  it("keeps options containing full fabric descriptions as alternatives", () => {
    const text = "A) 16 OE × 16 OE / 96 × 60\nOPTION 1 Cotton twill, 145 gsm, 58 inches\nOPTION 2 Polyester satin, 200 gsm, 60 inches\n\nB) 20 CCW × 20 CCW / 96 × 48";
    const lines = parseText(text); expect(lines).toHaveLength(2);
    expect(lines[0].draft.gsm).toBeUndefined(); expect(lines[0].draft.width).toBeUndefined();
    expect(lines[1].original).not.toContain("OPTION");
  });
  it("proves option ownership using different options in A and B", () => {
    const lines = parseText(combined.replace("OPTION 2 BCI cotton.", "OPTION 2 A-only BCI cotton.") + "\nB-only packing note");
    expect(lines).toHaveLength(2);
    expect(lines[0].draft.additionalSpecs).toContain("A-only"); expect(lines[1].draft.additionalSpecs).not.toContain("A-only");
    expect(lines[1].draft.additionalSpecs).toContain("B-only"); expect(lines[0].draft.additionalSpecs).not.toContain("B-only");
  });
  it("does not split a single fabric's multiline technical details or treat numbers as labels", () => {
    const text = '16 OE × 16 OE / 96 × 60\n\nWidth 65 inches\nGSM 145\n\n2/2 Matty\n\nOPTION 1 100% cotton\n\nOPTION 2 BCI cotton';
    const lines = parseText(text); expect(lines).toHaveLength(1);
    expect(lines[0].draft).toMatchObject({ width: "65 inches", gsm: 145, weaveType: "2/2 Matty" });
    expect(lines[0].original).toBe(text);
  });
  it("keeps a merged grouping response from bypassing explicit entry boundaries", () => {
    expect(parseGroups([{ source: combined, warnings: [] }])).toHaveLength(2);
  });
  it("runs the same segmentation through the actual local text-reading entry point", async () => {
    const lines = await readRequirements(combined, false);
    expect(lines).toHaveLength(2); expect(lines[1].draft.width).toBeUndefined();
  });
  it("does not infer GSM from the number in a Fabric label", () => {
    const lines = parseText('Fabric 1\n100% cotton twill 30x30/110x60, 58 inches, 500m\nFabric 2\n100% cotton satin 40x40/120x70, 60 inches, 900m');
    expect(lines).toHaveLength(2);
    for (const line of lines) { expect(line.draft.gsm).toBeUndefined(); expect(line.warnings.join(" ")).not.toContain("Proposed gsm"); }
  });
  it("retains existing explicit shared-scope behavior without sharing ordinary entry details", () => {
    const lines = parseText("1) Cotton poplin\n2) Polyester twill\nBoth fabrics should be 58 inches wide.\nNeed 500m.");
    expect(lines).toHaveLength(2);
    expect(lines.every(line => line.draft.width === "58 inches")).toBe(true);
    expect(lines[0].draft.quantity).toBeUndefined(); expect(lines[1].draft.quantity).toBe(500);
    expect(() => parseText("A) Cotton poplin\nB) Polyester twill\nC) Linen satin\nBoth fabrics 58 inches")).toThrow("shared scope");
  });
});
