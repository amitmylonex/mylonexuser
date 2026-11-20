import { describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";
import { parseText } from "../parse-text";
import { parseSheet, validateSheetFile, REQUIRED_COLUMNS } from "../parse-sheet";
import { missingRequired } from "../draft";
function workbook(rows: unknown[][]) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), "RFQ");
  return XLSX.write(book, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}
const row = ["100% Cotton", 120, "Poplin", 58, "RFD", 3000, "Ready stock"];
describe("draft-only RFQ import", () => {
  it("reads explicit text values without guessing ambiguous blend or dates", () => {
    const [first, second] = parseText(
      '100% Cotton poplin, 120 gsm, 58", RFD, 3000 m, ready stock\nViscose crepe, 110 gsm, 44 inches, printed, 2000 m, deliver by 15 Jan'
    );
    expect(first.draft).toMatchObject({ gsm: 120, width: "58 inches", fabricState: "rfd", quantity: 3000, productionCycle: "ready_stock" });
    expect(first.blend).toBe("100% Cotton");
    expect(second.blend).toBe("Viscose");
    expect(second.compositionUncertain).toBe(true);
    expect(second.draft.requiredDeliveryDate).toBeUndefined();
    expect(second.warnings.join(" ")).toContain("year");
  });
  it("flags conflicting numbers, preserves unknown words, and limits pasted lines", () => {
    const [line] = parseText("Blend: 55/45 linen-cotton; plain, 120 gsm, 140 gsm, 58 inches, RFD, 1000 m, made to order");
    expect(line.draft.gsm).toBeUndefined();
    expect(line.blend).toBe("55% Linen 45% Cotton");
    expect(line.original).toContain("140 gsm");
    expect(() => parseText("")).toThrow("at least one");
    expect(() => parseText(Array.from({ length: 201 }, (_, index) => `${index + 1}. Cotton fabric`).join("\n"))).toThrow("200");
  });
  it("keeps identical spreadsheet rows as separate fabric lines", () => {
    const lines = parseSheet(workbook([REQUIRED_COLUMNS, row, row]), "fabrics.xlsx");
    expect(lines).toHaveLength(2);
    expect(lines[0].id).not.toBe(lines[1].id);
    expect(missingRequired(lines[0])).toEqual([]);
  });
  it("reads real CSV, preserves invalid cells, and reports missing required fields", () => {
    const data = new TextEncoder().encode(
      'Blend,GSM,Weave,Width (inch),Fabric state,Quantity (m),Production cycle\n"63/34/3 poly-cotton-lycra",wrong,unknown,58,RFD,1000,Made to order'
    );
    const [line] = parseSheet(data.buffer, "fabrics.csv");
    expect(missingRequired(line)).toEqual(["GSM", "weave"]);
    expect(line.original).toContain("wrong");
    expect(line.warnings[0]).toContain("row 2");
  });
  it("validates file type, empty files, size, renamed content and headings", () => {
    expect(() => validateSheetFile({ name: "x.png", size: 10 })).toThrow(".xlsx or .csv");
    expect(() => validateSheetFile({ name: "x.csv", size: 0 })).toThrow("empty");
    expect(() => validateSheetFile({ name: "x.xlsx", size: 11 * 1024 * 1024 })).toThrow("10 MB");
    expect(() => parseSheet(new TextEncoder().encode("not excel").buffer, "x.xlsx")).toThrow("not a valid");
    expect(() => parseSheet(workbook([["Unknown"], ["value"]]), "x.xlsx")).toThrow("recognised");
    expect(() =>
      parseSheet(
        workbook([
          ["Blend", "Blend"],
          ["Cotton", "Linen"],
        ]),
        "x.xlsx"
      )
    ).toThrow("unique");
  });
  it("accepts exactly 200 rows and rejects row 201 instead of truncating", () => {
    expect(parseSheet(workbook([REQUIRED_COLUMNS, ...Array(200).fill(row)]), "x.xlsx")).toHaveLength(200);
    expect(() => parseSheet(workbook([REQUIRED_COLUMNS, ...Array(201).fill(row)]), "x.xlsx")).toThrow("200");
    const csv = new TextEncoder().encode([REQUIRED_COLUMNS.join(","), ...Array(201).fill(row.join(","))].join("\n"));
    expect(() => parseSheet(csv.buffer, "x.csv")).toThrow("200");
  });
  it("never calls fetch while reading text or workbook drafts", () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    parseText("100% Cotton, 120 gsm");
    parseSheet(workbook([REQUIRED_COLUMNS, row]), "x.xlsx");
    expect(fetch).not.toHaveBeenCalled();
    fetch.mockRestore();
  });
});
