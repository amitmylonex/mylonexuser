import { NUMBER, numeric } from "./measurements";
import type { TextFields } from "./types";

/** A per-package length is never a standalone order length or shade allocation. */
export function readPackageQuantities(text: string) {
  const unit = "(?:pieces?|pcs?|rolls?|bolts?)";
  const metres = "(?:m|metres?|meters?)";
  const parenthetical = new RegExp(String.raw`\b(${NUMBER})[ \t]+(${unit})[ \t]*\(([^()\n]*)\)`, "gi");
  const atRate = new RegExp(String.raw`(?<![\w.,])(${NUMBER})[ \t]+${unit}[ \t]+at[ \t]+((?:about|around|approx(?:imately)?)[ \t]+|[<>±-][ \t]*)?(${NUMBER})([ \t]*(?:-|to|or)[ \t]*${NUMBER})?[ \t]*${metres}[ \t]+each\b(?![ \t]+(?:colou?rs?|shades?)\b)`, "gi");
  const rate = new RegExp(String.raw`\b(?:each[ \t]+${unit}[ \t]*(?:is[ \t]+|[:=][ \t]*)?(?:about[ \t]+|approximately[ \t]+|[<>±-][ \t]*)?${NUMBER}(?:[ \t]*(?:-|to)[ \t]*${NUMBER})?[ \t]*(?:m|metres?|meters?)\b|${NUMBER}[ \t]*(?:m|metres?|meters?)[ \t]+per[ \t]+${unit}\b)(?![²2])`, "gi");
  const exactRate = new RegExp(String.raw`^each[ \t]+(${unit})[ \t]*(?:is[ \t]+|[:=][ \t]*)?(${NUMBER})[ \t]*(?:m|metres?|meters?)$|^(${NUMBER})[ \t]*(?:m|metres?|meters?)[ \t]+per[ \t]+(${unit})$`, "i");
  const countBefore = new RegExp(String.raw`(?:^|[\s:;,(])(${NUMBER})[ \t]+(${unit})[ \t]*(?:\([ \t]*)?$`, "i");
  const singular = (value: string) => value.toLowerCase().replace(/s$/, "").replace(/^pc$/, "piece");
  const qualified = (prefix: string) =>
    /\b(?:no|not|or|about|approx(?:imately)?|around|at least|up to|over|under|sample|swatch|moq|earlier|previous(?:ly)?)\b|(?:[<>±+-]|\bto)\s*$/i.test(prefix.trim());
  const before = (start: number) => text.slice(0, start).split(/[,;\n]/).pop()!;
  const qualifiedAfter = (end: number) =>
    /^[ \t]*(?:±|\+\/-|or\b|about\b|approx(?:imately)?\b|TBC\b)/i.test(text.slice(end));
  const wholeMetres = (count: string, length: string) => {
    const countValue = numeric(count);
    const value = countValue * numeric(length);
    return Number.isInteger(countValue) && Number.isInteger(value) && value > 0 && value <= 2_147_483_647 ? value : undefined;
  };
  const packageTotal = (count: string, name: string, wording: string, prefix: string) => {
    const length = wording.match(exactRate);
    if (!length || singular(name) !== singular(length[1] || length[4]) || qualified(prefix)) return undefined;
    return wholeMetres(count, length[2] || length[3]);
  };
  const packages = [...text.matchAll(parenthetical)].filter(match => !/^\s*(?:total|overall)\b/i.test(match[3])).map(match => {
    const start = match.index!;
    const end = start + match[0].length;
    const value = packageTotal(match[1], match[2], match[3].trim(), before(start));
    return { start, maskStart: value === undefined ? start + match[0].indexOf("(") : start, end, value };
  });
  for (const match of text.matchAll(atRate)) {
    const start = match.index!;
    const end = start + match[0].length;
    if (packages.some(item => item.start <= start && end <= item.end)) continue;
    const value = !match[2] && !match[4] && !qualified(before(start)) && !qualifiedAfter(end)
      ? wholeMetres(match[1], match[3]) : undefined;
    // Reserve the per-package length before "each" can be read as per-colour.
    packages.push({ start, maskStart: start, end, value });
  }
  for (const match of text.matchAll(rate)) {
    const rateStart = match.index!;
    const end = rateStart + match[0].length;
    if (packages.some(item => item.start <= rateStart && end <= item.end)) continue;
    const preceding = before(rateStart);
    const count = preceding.match(countBefore);
    const value = count && !qualifiedAfter(end)
      ? packageTotal(count[1], count[2], match[0], preceding.slice(0, count.index)) : undefined;
    const start = count ? rateStart - count[0].length + count[0].indexOf(count[1]) : rateStart;
    packages.push({ start, maskStart: value === undefined ? rateStart : start, end, value });
  }
  if (!packages.length) return { text, packages };
  const masked = text.split("");
  for (const { maskStart, end } of packages) masked.fill(";", maskStart, end);
  return { text: masked.join(""), packages };
}

export function applyPackageQuantities(
  source: string,
  result: TextFields,
  packages: ReturnType<typeof readPackageQuantities>["packages"],
  hasStandaloneQuantity: boolean,
) {
  if (!packages.length) return;
  const [first] = packages;
  const value = packages.length === 1 ? first.value : undefined;
  if (value === undefined) {
    result.warnings.push("Package quantity needs review. Confirm the package count and length of each package.");
  } else if (!hasStandaloneQuantity) {
    const shadeSubtotal = result.colours.reduce((sum, colour) => sum + Number(colour.metres || 0), 0);
    if ((result.quantity !== undefined && result.quantity !== value) || shadeSubtotal > value) {
      delete result.quantity;
      result.warnings.push("Package total conflicts with the shade quantities. Confirm the order total.");
    } else {
      result.quantity = value;
    }
  } else if (result.quantity !== undefined && result.quantity !== value) {
    result.warnings.push("Stated order quantity differs from the package total. Confirm the package breakdown.");
  }
  for (const item of packages) {
    const matchesTotal = value !== undefined && result.quantity === value;
    result.evidence.push({
      field: "quantity", start: item.start, end: item.end, text: source.slice(item.start, item.end),
      kind: matchesTotal ? "explicit" : "unresolved", value: item.value, unit: "m",
      reason: matchesTotal ? "Calculated from the stated package count and length per package." : "Per-package length is not a standalone order quantity.",
    });
  }
}
