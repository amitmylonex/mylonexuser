import { evidence, type TextFields } from "./types";
const YARN = "(?:\\d+\\/\\d+|\\d+(?:\\.\\d+)?(?:s|D)?)(?:\\s*\\+\\s*\\d+D)?";
export function extractTechnical(text: string, result: TextFields) {
  // Standalone WhatsApp technical lines are common and may have no labels.
  // Parse their role from notation before generic numeric inference sees them.
  for (const rawLine of text.split(/\n/)) {
    const line = rawLine.trim();
    const densityLine = line.match(/^(?:construction|const(?:ruction)?)?\s*[-:=]?\s*(\d+)\s*[xX×]\s*(\d+)\s*$/i);
    if (densityLine && !result.construction) {
      result.construction = `${densityLine[1]} × ${densityLine[2]}`;
      result.evidence.push({ field: "construction", kind: "explicit", text: densityLine[0], start: text.indexOf(rawLine), end: text.indexOf(rawLine) + rawLine.length });
    }
    const yarnLine = line.match(/^(.+\d+(?:['’]?s|pc(?:s)?|[dD]|denier|Nm)[^\n]*?)\s*[xX×]\s*(.+)$/i);
    if (yarnLine && !result.count) {
      const beforeDensity = line.replace(/\s*\/\s*\d+\s*[xX×]\s*\d+(?:\s*[xX×]\s*\d+\s*["″”])?.*$/i, "").trim();
      result.count = beforeDensity.replace(/[’']/g, "").replace(/\s*[xX×]\s*/g, " × ");
      const tailDensity = line.match(/\/\s*(\d+)\s*[xX×]\s*(\d+)(?:\s*[xX×]\s*(\d+)\s*["″”])?/i);
      if (tailDensity && !result.construction) result.construction = `${tailDensity[1]} × ${tailDensity[2]}`;
      result.evidence.push({ field: "count", kind: "explicit", text: beforeDensity, start: text.indexOf(rawLine), end: text.indexOf(rawLine) + beforeDensity.length });
    }
  }
  const compactValues = [...text.matchAll(new RegExp(`\\b(${YARN})\\s*[xX×]\\s*(${YARN})\\s*[/|]\\s*(\\d+)\\s*[xX×]\\s*(\\d+)\\b`, "g"))];
  if (new Set(compactValues.map(match => match.slice(1).join("|"))).size > 1) {
    result.warnings.push("Conflicting yarn count/construction pairs are retained in notes. Confirm the intended specification."); return;
  }
  const compact = text.match(new RegExp(`\\b(${YARN})\\s*[xX×]\\s*(${YARN})\\s*[/|]\\s*(\\d+)\\s*[xX×]\\s*(\\d+)\\b`));
  if (compact) {
    result.count = `${compact[1]} × ${compact[2]}`; result.construction = `${compact[3]} × ${compact[4]}`;
    result.evidence.push(evidence("count/construction", compact));
  }
  const density = text.match(/\b(?:fabric construction|construction|const|density)\s*[-:=]?\s*(\d+)\s*[xX×/]\s*(\d+)\b/i);
  if (density && !compact) { result.construction = `${density[1]} × ${density[2]}`; result.evidence.push(evidence("construction", density)); }
  const pair = text.match(new RegExp(`(?:yarn count|count)\\s*[:=]?\\s*(${YARN})\\s*[xX×]\\s*(${YARN})`, "i"));
  const warp = text.match(new RegExp(`warp(?: yarn)? count\\s*[:=]?\\s*(${YARN})`, "i"));
  const weft = text.match(new RegExp(`weft(?: yarn)? count\\s*[:=]?\\s*(${YARN})`, "i"));
  if (pair && !compact) { result.count = `${pair[1]} × ${pair[2]}`; result.evidence.push(evidence("count", pair)); }
  if (warp && weft) { result.count = `${warp[1]} × ${weft[1]}`; result.evidence.push(evidence("count", warp), evidence("count", weft)); }
  if (!!warp !== !!weft) result.warnings.push("Only one directional yarn count was supplied; retain it in notes and confirm the other.");
  const epi = text.match(/(?:\b(?:EPI|ends per inch)\s*[:=]?\s*(\d+))|(?:(\d+)\s*(?:EPI|ends per inch)\b)/i);
  const ppi = text.match(/(?:\b(?:PPI|picks per inch)\s*[:=]?\s*(\d+))|(?:(\d+)\s*(?:PPI|picks per inch)\b)/i);
  const typo = text.match(/\bPPL\s*[:=]?\s*(\d+)/i);
  if (epi && (ppi || typo)) {
    const construction = `${epi[1] || epi[2]} × ${ppi ? ppi[1] || ppi[2] : typo![1]}`;
    if (result.construction && result.construction !== construction) {
      result.count = ""; result.construction = "";
      result.evidence = result.evidence.filter(item => !/count|construction/.test(item.field));
      result.warnings.push("Conflicting construction specifications are retained in notes. Confirm count and density before sending."); return;
    }
    result.construction = construction;
    result.evidence.push(evidence("construction", epi), evidence("construction", (ppi || typo)!));
    if (!ppi) result.warnings.push("PPL was interpreted as PPI alongside EPI; confirm this possible typo.");
  }
  if (/\breed\b/i.test(text)) result.warnings.push("Reed information is retained in notes; reed was not converted to EPI.");
  if (!compact && !pair && !warp && /\byarn count\b/i.test(text)) result.warnings.push("Review the yarn count wording retained in notes.");
}
