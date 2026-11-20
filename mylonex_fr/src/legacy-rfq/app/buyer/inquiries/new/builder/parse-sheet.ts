import * as XLSX from "xlsx";
import {
  BUYER_FABRIC_STATES,
  WEAVE_TYPES,
  PRODUCTION_CYCLES,
  WOVEN_END_USES,
  BUYER_DYED_DYE_METHODS,
  DYE_COLOR_TYPES,
  BUYER_PRINT_METHODS,
  PRINT_BASE_TYPES,
} from "../../../../../src/domains/rfq/constants";
import { newLine, type RfqLine } from "./draft";
import { applyPlatformWidthDefault } from "./platform-width";
import {
  extractWeightCandidates,
  recalculateGlmGsm,
  OZ_YD2_TO_GSM,
  OZ_M2_TO_GSM,
  roundGsm,
} from "../../../../../src/domains/rfq/text/weight-conversion";
import { exactOption, MAX_LINES } from "./parse-text";
import { parseWidthBounds } from "../../../../../src/domains/rfq/text/width-bounds";

export const REQUIRED_COLUMNS = ["Blend", "GSM", "Weave", "Width (inch)", "Fabric state", "Quantity (m)", "Production cycle"];
export const OPTIONAL_COLUMNS = [
  "Colours",
  "Count",
  "Construction",
  "Finish",
  "Yarn type",
  "Dye method",
  "Dye type",
  "Print method",
  "Print base",
  "Target delivery",
  "End use",
  "Target price ₹/m",
  "Your fabric name",
  "Notes",
];
function numeric(value: string, unit: RegExp) {
  const clean = value.replace(/,/g, "").replace(unit, "").trim();
  return /^\d+(?:\.\d+)?$/.test(clean) ? Number(clean) : undefined;
}
export function validateSheetFile(file: Pick<File, "name" | "size">) {
  if (!/\.(xlsx|csv)$/i.test(file.name)) throw new Error("Choose an .xlsx or .csv file.");
  if (file.size === 0) throw new Error("This file is empty. Choose a filled sheet.");
  if (file.size > 10 * 1024 * 1024) throw new Error("The sheet must be 10 MB or smaller.");
}
export function parseSheet(buffer: ArrayBuffer, name: string): RfqLine[] {
  validateSheetFile({ name, size: buffer.byteLength });
  // XLSX is a ZIP container; reject renamed images/text instead of accepting arbitrary text as a workbook.
  const signature = new Uint8Array(buffer);
  if (/\.xlsx$/i.test(name) && !(signature[0] === 0x50 && signature[1] === 0x4b))
    throw new Error("This is not a valid .xlsx workbook. Export it as Excel or CSV and try again.");
  let rows: unknown[][];
  try {
    const workbook = XLSX.read(buffer, { type: "array", cellFormula: false, cellHTML: false, sheetRows: MAX_LINES + 2 });
    if (workbook.SheetNames.length !== 1) throw new Error("Use a workbook with one sheet so no fabric rows are missed.");
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "", blankrows: false, raw: false });
    const fullRange = sheet["!fullref"] || sheet["!ref"];
    if (fullRange && XLSX.utils.decode_range(fullRange).e.r > MAX_LINES)
      throw new Error("Use at most 200 fabric rows, plus the header row.");
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : "Could not read the sheet. Check its format.");
  }
  if (rows.length < 2) throw new Error("Add a header and at least one fabric row.");
  if (rows.length - 1 > MAX_LINES) throw new Error("Use at most 200 fabric rows, plus the header row.");
  const headers = rows[0].map((value) => String(value).trim().toLowerCase());
  if (new Set(headers.filter(Boolean)).size !== headers.filter(Boolean).length) throw new Error("Column headings must be unique.");
  const known = [...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS].map((value) => value.toLowerCase());
  if (!headers.some((header) => known.includes(header)))
    throw new Error("No recognised columns found. Start with the downloadable template.");
  return rows
    .slice(1)
    .filter((row) => row.some((value) => String(value).trim()))
    .map((row, index) => {
      const line = newLine();
      const cell = (...names: string[]) => {
        const position = headers.findIndex((header) => names.includes(header));
        return position < 0 ? "" : String(row[position] ?? "").trim();
      };
      line.blend = cell("blend", "composition");
      const gsmRaw = cell("gsm", "weight");
      const gsmNum = numeric(gsmRaw, /\s*gsm$/i);
      if (gsmNum !== undefined) {
        line.draft.gsm = gsmNum;
        line.gsmProvenance = "extracted";
      } else if (gsmRaw) {
        const cands = extractWeightCandidates(gsmRaw);
        if (cands.length) {
          const cand = cands[0];
          line.weightInput = {
            value: cand.value,
            unit: cand.unit,
            rawText: cand.rawText,
            rawUnit: cand.rawUnit,
            min: cand.min,
            max: cand.max,
            tolerance: cand.tolerance,
            basis: cand.basis,
          };
          if (cand.unit === "oz/yd2") {
            const derivedGsm = roundGsm(cand.value * OZ_YD2_TO_GSM);
            line.draft.gsm = derivedGsm;
            line.gsmProvenance = "derived";
            line.gsmDerivedReason = `Converted from ${cand.rawText} (approx. ${derivedGsm} GSM).`;
          } else if (cand.unit === "oz/m2") {
            const derivedGsm = roundGsm(cand.value * OZ_M2_TO_GSM);
            line.draft.gsm = derivedGsm;
            line.gsmProvenance = "derived";
            line.gsmDerivedReason = `Converted from ${cand.rawText} (approx. ${derivedGsm} GSM).`;
          } else if (cand.unit === "bare_oz") {
            const derivedGsm = roundGsm(cand.value * OZ_YD2_TO_GSM);
            line.draft.gsm = derivedGsm;
            line.gsmProvenance = "derived";
            line.gsmDerivedReason = `Assumed oz/yd² basis for ${cand.rawText} (approx. ${derivedGsm} GSM); please review area basis.`;
            line.warnings.push(line.gsmDerivedReason);
          }
        }
      }
      const widthCell = cell("width (inch)", "width", "width (inches)");
      const widthBounds = parseWidthBounds(widthCell);
      if (widthBounds) {
        if (widthBounds.isRange) {
          line.draft.width = `${widthBounds.minInches}–${widthBounds.maxInches} inches`;
          line.widthMin = widthBounds.minInches;
          line.widthMax = widthBounds.maxInches;
        } else {
          line.draft.width = `${widthBounds.minInches} inches`;
          line.widthMin = widthBounds.minInches;
          line.widthMax = widthBounds.maxInches;
        }
        line.widthProvenance = "extracted";
      }
      line.draft.quantity = numeric(cell("quantity (m)", "quantity"), /\s*m$/i);
      line.draft.weaveType = exactOption(cell("weave"), WEAVE_TYPES);
      line.draft.fabricState = exactOption(cell("fabric state"), BUYER_FABRIC_STATES);
      const cycle = cell("production cycle");
      line.draft.productionCycle = exactOption(cycle === "Ready" ? "ready stock" : cycle, PRODUCTION_CYCLES);
      line.colours = cell("colours", "colors")
        .split(/[;|]/)
        .filter(Boolean)
        .map((name) => ({ id: crypto.randomUUID(), name: name.trim(), metres: "" }));
      line.count = cell("count");
      line.construction = cell("construction");
      line.finish = cell("finish");
      line.draft.yarnType = cell("yarn type") || undefined;
      line.draft.customFabricName = cell("your fabric name") || undefined;
      line.draft.dyeMethod = exactOption(cell("dye method"), BUYER_DYED_DYE_METHODS);
      line.draft.dyeColorType = exactOption(cell("dye type"), DYE_COLOR_TYPES);
      line.draft.printMethod = exactOption(cell("print method"), BUYER_PRINT_METHODS);
      line.draft.printBaseType = exactOption(cell("print base"), PRINT_BASE_TYPES);
      line.draft.endUse = exactOption(cell("end use"), WOVEN_END_USES);
      line.draft.requiredDeliveryDate = cell("target delivery") || undefined;
      line.draft.targetPriceMax = numeric(cell("target price ₹/m"), /\s*(?:inr|₹|\/m)$/i);
      line.draft.deliveryNotes = cell("notes") || undefined;
      line.original = headers
        .map((header, column) => (row[column] ? `${header}: ${row[column]}` : ""))
        .filter(Boolean)
        .join("; ");
      line.warnings = [
        `Sheet row ${index + 2}: review the extracted values. Blank or unsupported values need correction. Original cells are retained in additional specifications.`,
      ];
      applyPlatformWidthDefault(line);
      const updatedWeight = recalculateGlmGsm(line);
      Object.assign(line, updatedWeight);
      return line;
    });
}
export function downloadTemplate() {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([[...REQUIRED_COLUMNS, ...OPTIONAL_COLUMNS]]), "RFQ lines");
  XLSX.writeFile(workbook, "Mylonex-RFQ-template.xlsx");
}
