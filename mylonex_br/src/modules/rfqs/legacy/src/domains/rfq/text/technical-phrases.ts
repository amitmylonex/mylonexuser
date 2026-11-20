import type { TextAnalysis, Span } from "./analysis.js";
import { canonicalCountNotation, readYarn } from "./yarn-notation.js";

export type TechnicalField = "count" | "construction";
export type TechnicalCandidate = Span & { field: TechnicalField; value: string; priority: "label" | "pattern" };
export type NumericPair = Span & { left: string; right: string; separator: string; yarnUnits: boolean; value?: string; yarns?: Span[] };
export type SpecificationGroup = { count: NumericPair; density: NumericPair };
export function startsTypedYarn(analysis: TextAnalysis) {
  return readYarn(analysis, 0, true)?.units === true;
}
const labels: Record<string, TechnicalField> = { count: "count", construction: "construction", const: "construction", density: "construction" };

/** A small token grammar for yarn values, pairs and directional labels. */
export function technicalPhrases(analysis: TextAnalysis) {
  const tokens = analysis.tokens;
  const token = (i: number) => tokens[i]?.text;
  const number = (i: number) => tokens[i]?.kind === "number";
  const cross = (value: string) => value === "x" || value === "by";
  const yarn = (index: number, ply: boolean, descriptors = false) => readYarn(analysis, index, ply, descriptors);
  const pairAt = (index: number): (NumericPair & { next: number }) | undefined => {
    for (const ply of [true, false]) {
      const left = yarn(index, ply);
      if (!left || !["x", "by", "/"].includes(token(left.end))) continue;
      const right = yarn(left.end + 1, !cross(token(left.end + 4)));
      if (!right) continue;
      if (token(left.end) === "/" && !left.units && !right.units) {
        const leftNum = Number(left.value.match(/^\d+/)?.[0] || NaN);
        const rightNum = Number(right.value.match(/^\d+/)?.[0] || NaN);
        const nextToken = token(right.end) || "";
        const followedByWeave = /^(?:twill|twl|drill|drl|matty|matt|mattie|satin|plain|pln|chambray|chamb|basket|oxford|oxfd|poplin|popl)$/i.test(nextToken);
        if (!Number.isNaN(leftNum) && !Number.isNaN(rightNum) && leftNum <= 8 && rightNum <= 8 && followedByWeave) continue;
      }
      return { start: tokens[index].start, end: tokens[right.end - 1].end, left: left.value, right: right.value,
        separator: token(left.end), yarnUnits: left.units || right.units, next: right.end,
        ...(token(left.end) === "by" ? { value: `${left.value} × ${right.value}` } : {}) };
    }
  };
  // Yarn descriptors belong to the count grammar. Density remains an integer
  // pair, so a slash is a group delimiter only after a COMPLETE count pair.
  const countPairAt = (index: number, labelled = false, inGroup = false) => {
    const left = yarn(index, true, true);
    if (!left || !["x", "by", "/", "-"].includes(token(left.end))) return undefined;
    const separator = token(left.end);
    const right = yarn(left.end + 1, !cross(token(left.end + 4)), true);
    if (!right) return undefined;
    if (separator === "/" || separator === "-") {
      const leftNum = Number(left.value.match(/^\d+/)?.[0] || NaN);
      const rightNum = Number(right.value.match(/^\d+/)?.[0] || NaN);
      if (!Number.isNaN(leftNum) && !Number.isNaN(rightNum) && leftNum <= 8 && rightNum <= 8) return undefined;
      if (!Number.isNaN(leftNum) && !Number.isNaN(rightNum) && leftNum + rightNum === 100) return undefined;
      const leftTyped = left.units || left.descriptors;
      const rightTyped = right.units || right.descriptors;
      if (!labelled && !inGroup && !(leftTyped && rightTyped)) return undefined;
    }
    return { start: tokens[index].start, end: tokens[right.end - 1].end, left: left.value, right: right.value,
      separator, yarnUnits: left.units || right.units, next: right.end,
      value: (!labelled && separator === "/") || separator === "by" || separator === "-" || left.directionalBlend || right.directionalBlend ? `${left.value} × ${right.value}` : analysis.phrase(tokens[index].start, tokens[right.end - 1].end),
      structured: (left.descriptors && right.descriptors) || left.units || right.units,
      yarns: [{ start: tokens[index].start, end: tokens[left.end - 1].end }, { start: tokens[left.end + 1].start, end: tokens[right.end - 1].end }] };
  };
  const groupAt = (index: number, labelled = false) => {
    const count = countPairAt(index, labelled, true);
    if (!count) return undefined;
    const explicit = ["/", "-"].includes(token(count.next)) || cross(token(count.next)) && (count.yarnUnits || count.structured);
    const omitted = (count.yarnUnits || count.structured) && number(count.next) && /^\s+$/.test(analysis.text.slice(count.end, tokens[count.next].start));
    if (!explicit && !omitted) return undefined;
    const start = count.next + (explicit ? 1 : 0);
    if (!number(start) || !["x", "by", "-", "/"].includes(token(start + 1)) || !number(start + 2)) return undefined;
    const densityLeftNum = Number(token(start));
    const densityRightNum = Number(token(start + 2));
    if (token(start + 1) === "/" && (densityLeftNum <= 8 && densityRightNum <= 8 || densityLeftNum + densityRightNum === 100)) return undefined;
    const density: NumericPair = { start: tokens[start].start, end: tokens[start + 2].end,
      left: token(start), right: token(start + 2), separator: token(start + 1), yarnUnits: false,
      ...(["by", "-", "/"].includes(token(start + 1)) ? { value: `${token(start)} × ${token(start + 2)}` } : {}) };
    return { count, density, next: start + 3 };
  };
  const pairs: NumericPair[] = [], candidates: TechnicalCandidate[] = [], incomplete: (Span & { field: TechnicalField; reason?: string })[] = [];
  const hyphenatedCounts: { start: number; pair: NonNullable<ReturnType<typeof countPairAt>> }[] = [];
  const groups: SpecificationGroup[] = [];
  const labelled = (field: TechnicalField, start: number, end: number, value: string) => candidates.push({ field, start, end, value, priority: "label" });
  const afterLabel = (index: number) => {
    let cursor = index + 1;
    if ([":", "=", "-"].includes(token(cursor))) cursor++;
    return cursor;
  };
  const directionalBefore = (index: number) => {
    let cursor = index - 1;
    while (["count", "yarn", ":", "=", "-"].includes(token(cursor))) cursor--;
    return token(cursor) === "warp" || token(cursor) === "weft";
  };
  for (let index = 0; index < tokens.length; index++) {
    if (token(index) === "count" && ["&", "and"].includes(token(index + 1)) && token(index + 2) === "density") {
      const start = afterLabel(index + 2);
      const count = yarn(start, true);
      if (count?.units && token(count.end) === "-" && number(count.end + 1) && cross(token(count.end + 2)) && number(count.end + 3)
        && /^\d+$/.test(token(count.end + 1)) && /^\d+$/.test(token(count.end + 3))) {
        labelled("count", tokens[index].start, tokens[count.end - 1].end, canonicalCountNotation(count.value));
        labelled("construction", tokens[count.end + 1].start, tokens[count.end + 3].end, `${token(count.end + 1)} × ${token(count.end + 3)}`);
        index = count.end + 3;
        continue;
      }
    }
    const field = labels[token(index)];
    // Directional counts are combined below, never also treated as scalar counts.
    if (field && !["warp", "weft"].includes(token(index - 1)) && !["warp", "weft"].includes(token(index - 2))) {
      const valueStart = afterLabel(index), pair = field === "count" ? countPairAt(valueStart, true) || pairAt(valueStart) : pairAt(valueStart), single = yarn(valueStart, true, field === "count");
      if (field === "count" && pair?.separator === "-") {
        const complete = groupAt(valueStart, true);
        if (complete) {
          labelled(field, tokens[index].start, complete.count.end, complete.count.value!);
          groups.push(complete); pairs.push(complete.count, complete.density); index = complete.next - 1;
        } else {
          hyphenatedCounts.push({ start: tokens[index].start, pair: pair as NonNullable<ReturnType<typeof countPairAt>> });
          index = pair.next - 1;
        }
        continue;
      }
      if (pair) labelled(field, tokens[index].start, pair.end, "value" in pair && pair.value || analysis.phrase(pair.start, pair.end));
      else if (field === "count" && single) labelled(field, tokens[index].start, tokens[single.end - 1].end, single.value);
    }
    if (number(index) && directionalBefore(index)) {
      const directional = yarn(index, true, true);
      if (directional) index = directional.end - 1;
      continue;
    }
    const group = groupAt(index);
    if (group) { groups.push(group); pairs.push(group.count, group.density); index = group.next - 1; continue; }
    const typed = countPairAt(index);
    if (typed && typed.separator !== "-" && (typed.yarnUnits || typed.structured)) {
      candidates.push({ field: "count", start: typed.start, end: typed.end, value: typed.value, priority: "pattern" });
      pairs.push(typed); index = typed.next - 1; continue;
    }
    const pair = pairAt(index);
    if (pair) { pairs.push(pair); index = pair.next - 1; continue; }
    const atom = yarn(index, true, true);
    if (atom?.units) {
      candidates.push({ field: "count", start: tokens[index].start, end: tokens[atom.end - 1].end, value: atom.value, priority: "pattern" });
      index = atom.end - 1;
    }
  }
  for (const [first, second, field] of [["warp", "weft", "count"], ["epi", "ppi", "construction"]] as const) {
    const read = (label: string) => {
      const values: (Span & { value: string; yarnStart?: number; yarnEnd?: number })[] = [];
      const aliases = label === "epi" ? [["epi"], ["ends", "per", "inches"]] : label === "ppi" ? [["ppi"], ["picks", "per", "inches"]] : [[label]];
      const labelLength = (index: number) => aliases.find(words => words.every((word, offset) => token(index + offset) === word))?.length || 0;
      for (let index = 0; index < tokens.length; index++) if (labelLength(index)) {
        let cursor = index + labelLength(index) - 1;
        while (["yarn", "count"].includes(token(cursor + 1))) cursor++;
        const start = afterLabel(cursor), value = field === "count" ? yarn(start, true) : number(start) ? { end: start + 1, value: token(start) } : undefined;
        if (value) {
          const desc = field === "count" ? yarn(start, true, true) : undefined;
          const yarnStart = tokens[start].start;
          const yarnEnd = desc ? tokens[desc.end - 1].end : tokens[value.end - 1].end;
          values.push({ start: tokens[index].start, end: yarnEnd, value: value.value, yarnStart, yarnEnd });
        }
      }
      if (!values.length) for (let index = 1; index < tokens.length; index++) if (labelLength(index) && number(index - 1))
        values.push({ start: tokens[index - 1].start, end: tokens[index + labelLength(index) - 1].end, value: token(index - 1) });
      return values;
    };
    const left = read(first), right = read(second);
    if (left.length && right.length) {
      for (const item of left) labelled(field, item.start, item.end, `${item.value} × ${right[0].value}`);
      for (const item of right) labelled(field, item.start, item.end, `${left[0].value} × ${item.value}`);
      if (field === "count") {
        pairs.push({
          start: left[0].start,
          end: right[0].end,
          left: left[0].value,
          right: right[0].value,
          separator: "x",
          yarnUnits: true,
          value: `${left[0].value} × ${right[0].value}`,
          yarns: [
            { start: left[0].yarnStart ?? left[0].start, end: left[0].yarnEnd ?? left[0].end },
            { start: right[0].yarnStart ?? right[0].start, end: right[0].yarnEnd ?? right[0].end },
          ]
        });
      }
    } else for (const item of [...left, ...right]) incomplete.push({ start: item.start, end: item.end, field });
  }
  const directional = candidates.some(item => item.field === "count" && /\b(?:warp|weft)\b/i.test(analysis.phrase(item.start, item.end)));
  const density = candidates.some(item => item.field === "construction" && item.priority === "label");
  for (const item of hyphenatedCounts) {
    if (directional || density) labelled("count", item.start, item.pair.end, item.pair.value!);
    else incomplete.push({ field: "count", start: item.start, end: item.pair.end, reason: "A hyphenated count may be a count pair or a range; confirm the intended warp/weft specification." });
  }
  return { pairs, candidates, incomplete, groups };
}
