export type QuantityRelation = { operator: ">" | ">=" | "<" | "<="; phrase: string; start: number; end: number };
const relations: [QuantityRelation["operator"], RegExp][] = [
  [">=", /(?:\b(?:at least|minimum(?: of)?|not less than)|>=|≥)\s*$/i],
  ["<=", /(?:\b(?:at most|maximum(?: of)?|up to|not more than)|<=|≤)\s*$/i],
  [">", /(?:\b(?:above|over|more than|greater than)|>)\s*$/i],
  ["<", /(?:\b(?:below|under|less than)|<)\s*$/i],
];
export function quantityRelation(before: string, after: string, start: number, end: number): QuantityRelation | undefined {
  const group = before.match(/\s*\(\s*$/);
  const prefix = group ? before.slice(0, -group[0].length) : before;
  for (const [operator, expression] of relations) {
    const match = prefix.match(expression);
    if (match) return { operator, phrase: match[0].trim(), start: start - match[0].length - (group?.[0].length || 0), end: end + (group ? after.match(/^\s*\)/)?.[0].length || 0 : 0) };
  }
  const suffix = after.match(/^\s*(and above|or more|and below|or less|minimum|maximum)\b|^\s*(\+)/i);
  return suffix ? { operator: /above|more|minimum|\+/i.test(suffix[0]) ? ">=" : "<=", phrase: suffix[0].trim(), start, end: end + suffix[0].length } : undefined;
}
export function fitsQuantityBound(exact: number, bound: number, operator: QuantityRelation["operator"]) {
  return operator === ">" ? exact > bound : operator === ">=" ? exact >= bound : operator === "<" ? exact < bound : exact <= bound;
}
export function quantityRelationLabel(operator: QuantityRelation["operator"]): string {
  switch (operator) {
    case ">=": return "Minimum / at least";
    case ">": return "Strict lower bound: above";
    case "<=": return "Maximum / up to";
    case "<": return "Strict upper bound: below";
  }
}
